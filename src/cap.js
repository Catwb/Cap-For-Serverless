import crypto from "node:crypto";
import { Hono } from "hono";
import {
  generateChallenge as coreGenerateChallenge,
  validateChallenge as coreValidateChallenge,
} from "capjs-core";
import { createRateLimiter } from "./ratelimit.js";
import { ensureRswKeypair, getRswKeypair } from "./rsw-store.js";
import { getFiltering, getHeaders, getRatelimit } from "./settings-cache.js";

let _storage = null;

export function initCap(storage) {
  _storage = storage;
}

const DEFAULT_RSW_T = 75_000;
const MIN_RSW_T = 10_000;
const MAX_RSW_T = 300_000;
const CHALLENGE_TTL_MS = 15 * 60 * 1000;
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

function hourlyBucket() {
  return String(Math.floor(Date.now() / 1000 / 3600) * 3600);
}

function parseUA(ua) {
  if (!ua) return { platform: null, os: null };
  let os = null;
  if (/iPad/.test(ua)) os = "iPadOS";
  else if (/iPhone/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Macintosh|Mac OS X/.test(ua)) os = "macOS";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Linux/.test(ua)) os = "Linux";
  let platform = null;
  if (/iPhone|Android.*Mobile|Mobile.*Android/.test(ua)) platform = "Phone";
  else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) platform = "Tablet";
  else if (/Macintosh|Windows|Linux|CrOS/.test(ua)) platform = "Desktop";
  return { platform, os };
}

const DEFAULT_IP_HEADERS = ["X-Forwarded-For", "X-Real-IP", "CF-Connecting-IP"];

function getClientIp(request) {
  const cachedHeaders = getHeaders();
  const headerName = cachedHeaders?.ipHeader || process.env.RATELIMIT_IP_HEADER;
  if (headerName) {
    const ip = request.headers.get(headerName) || request.headers.get(headerName.toLowerCase());
    if (ip) { const p = ip.split(",").filter(Boolean); return p[0].trim(); }
  }
  for (const h of DEFAULT_IP_HEADERS) {
    const val = request.headers.get(h);
    if (val) { const p = val.split(",").filter(Boolean); return p[0].trim(); }
  }
  return null;
}

function ipv4ToInt(a) {
  return a.split(".").reduce((r, b) => (r << 8) + parseInt(b, 10), 0) >>> 0;
}

function expandIPv6(addr) {
  let a = addr;
  if (a.includes("::")) {
    const [left, right] = a.split("::");
    const lParts = left ? left.split(":") : [];
    const rParts = right ? right.split(":") : [];
    const missing = 8 - lParts.length - rParts.length;
    a = [...lParts, ...Array(missing).fill("0"), ...rParts].join(":");
  }
  return a.split(":").map(g => g.padStart(4, "0")).join(":");
}

function ipv6ToBytes(addr) {
  const hex = expandIPv6(addr).replace(/:/g, "");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function ipInCIDR(ip, cidr) {
  try {
    const [range, prefix] = cidr.split("/");
    const bits = parseInt(prefix, 10);
    if (Number.isNaN(bits)) return false;
    const isV4 = ip.includes(".") && !ip.includes(":");
    const rangeIsV4 = range.includes(".") && !range.includes(":");
    if (isV4 && rangeIsV4) {
      if (bits < 0 || bits > 32) return false;
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (ipv4ToInt(ip) & mask) === (ipv4ToInt(range) & mask);
    }
    if (!isV4 && !rangeIsV4) {
      if (bits < 0 || bits > 128) return false;
      const ipBytes = ipv6ToBytes(ip);
      const rangeBytes = ipv6ToBytes(range);
      const fullBytes = Math.floor(bits / 8);
      for (let i = 0; i < fullBytes; i++) { if (ipBytes[i] !== rangeBytes[i]) return false; }
      if (bits % 8 !== 0) {
        const mask = 0xff << (8 - (bits % 8));
        if ((ipBytes[fullBytes] & mask) !== (rangeBytes[fullBytes] & mask)) return false;
      }
      return true;
    }
    return false;
  } catch { return false; }
}

const _blockCache = new Map();
const BLOCK_CACHE_TTL = 5_000;

async function loadBlockRules(siteKey) {
  if (!_storage) return [];
  const cached = _blockCache.get(siteKey);
  if (cached && Date.now() - cached.ts < BLOCK_CACHE_TTL) return cached.entries;
  const obj = await _storage.hgetall(`blocked:${siteKey}`);
  const entries = obj ? Object.entries(obj) : [];
  _blockCache.set(siteKey, { entries, ts: Date.now() });
  return entries;
}

export function invalidateBlockCache(siteKey) {
  if (siteKey) _blockCache.delete(siteKey);
  else _blockCache.clear();
}

async function isBlocked(siteKey, ip) {
  const entries = await loadBlockRules(siteKey);
  if (entries.length === 0) return false;
  const now = Date.now();

  for (const [key, val] of entries) {
    if (val !== "0" && Number(val) <= now) continue;
    if (key === ip) return true;
    if (key.startsWith("cidr:") && ipInCIDR(ip, key.slice(5))) return true;
  }
  return false;
}

export const capRouter = new Hono();

capRouter.post("/:siteKey/challenge", async (c) => {
  if (!_storage) return c.json({ error: "Storage not configured" }, 500);

  const siteKey = c.req.param("siteKey");
  const fields = await _storage.hmget(`key:${siteKey}`, ["config", "jwtSecret"]);

  if (!fields[0]) return c.json({ error: "Invalid site key or secret" }, 404);

  const ip = getClientIp(c.req.raw);
  try { if (ip && (await isBlocked(siteKey, ip))) return c.json({ error: "Blocked" }, 403); } catch {}

  const fnf = (p) => { p.catch(() => {}); };

  (async () => {
    if (!ip || !_storage) return;
    const cachedHeaders = getHeaders();
    let country = cachedHeaders?.countryHeader ? (c.req.header(cachedHeaders.countryHeader) || c.req.header(cachedHeaders.countryHeader.toLowerCase())) : null;
    let asnValue = cachedHeaders?.asnHeader ? (c.req.header(cachedHeaders.asnHeader) || c.req.header(cachedHeaders.asnHeader.toLowerCase())) : null;
    if (country) fnf(_storage.hincrby(`metrics:country:${siteKey}`, country.toUpperCase(), 1));
    if (asnValue) fnf(_storage.hincrby(`metrics:asn:${siteKey}`, asnValue, 1));
  })().catch(() => {});

  try {
    const ua = c.req.header("user-agent");
    const { platform, os } = parseUA(ua);
    if (platform && _storage) fnf(_storage.hincrby(`metrics:platform:${siteKey}`, platform, 1));
    if (os && _storage) fnf(_storage.hincrby(`metrics:os:${siteKey}`, os, 1));
  } catch {}

  const keyConfig = JSON.parse(fields[0]);
  const jwtSecret = fields[1];
  if (!jwtSecret) return c.json({ error: "Site key is not configured for JWT challenges" }, 500);

  const globalFilter = getFiltering();
  const blockUA = keyConfig.blockNonBrowserUA ?? globalFilter.blockNonBrowserUA;
  const reqHeaders = keyConfig.requiredHeaders?.length ? keyConfig.requiredHeaders : globalFilter.requiredHeaders;

  if (blockUA) {
    const ua = c.req.header("user-agent") || "";
    if (!ua || !/Mozilla\/|Chrome\/|Safari\/|Firefox\/|Opera\/|Edg\//i.test(ua)) return c.json({ error: "Blocked" }, 403);
  }

  if (reqHeaders?.length) {
    for (const h of reqHeaders) { if (!c.req.header(h)) return c.json({ error: "Blocked" }, 403); }
  }

  const instrumentationOpts = keyConfig.instrumentation ? { blockAutomatedBrowsers: keyConfig.blockAutomatedBrowsers === true, obfuscationLevel: keyConfig.obfuscationLevel } : false;

  let challengeOpts;
  if (keyConfig.rsw) {
    let keypair = getRswKeypair();
    if (!keypair) {
      try { await ensureRswKeypair(); keypair = getRswKeypair(); } catch (err) { console.error("[cap] RSW keypair unavailable:", err); return c.json({ error: "RSW keypair unavailable" }, 500); }
      if (!keypair) return c.json({ error: "RSW keypair not ready" }, 503);
    }
    const rawT = Number(keyConfig.rswT) || DEFAULT_RSW_T;
    const t = Math.min(MAX_RSW_T, Math.max(MIN_RSW_T, rawT));
    challengeOpts = { format: 2, protocols: keyConfig.instrumentation ? ["rsw", "instrumentation"] : ["rsw"], keypair, t, expiresMs: CHALLENGE_TTL_MS, scope: siteKey, instrumentation: instrumentationOpts };
  } else {
    challengeOpts = { challengeCount: keyConfig.challengeCount ?? 80, challengeSize: keyConfig.saltSize ?? 32, challengeDifficulty: keyConfig.difficulty ?? 4, expiresMs: CHALLENGE_TTL_MS, scope: siteKey, instrumentation: instrumentationOpts };
  }

  try {
    const result = await coreGenerateChallenge(jwtSecret, challengeOpts);
    return c.json(result);
  } catch (err) {
    console.error("[cap] generateChallenge failed:", err);
    return c.json({ error: "Failed to generate challenge" }, 500);
  }
});

capRouter.post("/:siteKey/redeem", async (c) => {
  if (!_storage) return c.json({ error: "Storage not configured" }, 500);

  const siteKey = c.req.param("siteKey");
  const bucket = hourlyBucket();
  const body = await c.req.json();

  if (!body || !body.token || !body.solutions) return c.json({ error: "Missing required fields" }, 400);

  const jwtSecret = await _storage.hget(`key:${siteKey}`, "jwtSecret");
  if (!jwtSecret) return c.json({ error: "Invalid site key" }, 404);

  const result = await coreValidateChallenge(jwtSecret, {
    token: body.token, solutions: body.solutions, instr: body.instr, instr_blocked: body.instr_blocked, instr_timeout: body.instr_timeout,
  }, {
    scope: siteKey,
    consumeNonce: async (sigHex, ttlMs) => {
      const ttlSecs = Math.max(1, Math.ceil(ttlMs / 1000));
      const claim = await _storage.setnx(`blocklist:${sigHex}`, "1", ttlSecs);
      return claim;
    },
    signToken: () => {
      const redeemId = crypto.randomBytes(8).toString("hex");
      const redeemSecret = crypto.randomBytes(15).toString("hex");
      return `${siteKey}:${redeemId}:${redeemSecret}`;
    },
    tokenTtlMs: TOKEN_TTL_MS,
  });

  if (!result.success) {
    const reason = result.reason;
    await _storage.hincrby(`metrics:failed:${siteKey}`, bucket, 1);
    if (["missing_token", "missing_solutions", "invalid_solutions"].includes(reason)) return c.json({ error: "Invalid solutions" }, 400);
    if (reason === "expired") return c.json({ error: "Challenge expired" }, 403);
    if (reason === "scope_mismatch") return c.json({ error: "Challenge token does not match site key" }, 403);
    if (reason === "invalid_token") return c.json({ error: "Invalid challenge token" }, 403);
    if (reason === "already_redeemed") return c.json({ error: "Challenge already redeemed" }, 403);
    if (reason === "invalid_solution") return c.json({ error: "Invalid solution" }, 403);
    if (result.instr_error) {
      if (reason === "instr_corrupted") return c.json({ instr_error: true, error: "Blocked by instrumentation", reason: "corrupted_instrumentation_data" }, 403);
      if (reason === "instr_expired") return c.json({ instr_error: true, error: "Blocked by instrumentation", reason: "expired" }, 403);
      if (reason === "instr_automated_browser") return c.json({ instr_error: true, error: "Blocked by instrumentation", reason: "automated_browser_detected" }, 403);
      if (reason === "instr_timeout") return c.json({ instr_error: true, error: "Instrumentation timeout", reason: "timeout" }, 429);
      if (reason === "instr_missing") return c.json({ instr_error: true, error: "Blocked by instrumentation", reason: "missing_instrumentation_response" }, 403);
      return c.json({ instr_error: true, error: "Blocked by instrumentation", reason: reason || "failed_challenge" }, 403);
    }
    return c.json({ error: result.error || "Validation failed", reason }, 403);
  }

  const redeemToken = result.token;
  const tokenExpires = result.expires;
  const tokenTtlSecs = Math.ceil(TOKEN_TTL_MS / 1000);
  await _storage.set(`token:${redeemToken}`, String(tokenExpires));
  await _storage.expire(`token:${redeemToken}`, tokenTtlSecs);

  await _storage.hincrby(`metrics:verified:${siteKey}`, bucket, 1);

  if (result.iat) {
    const latencyMs = Date.now() - result.iat;
    await _storage.hincrby(`metrics:latency_sum:${siteKey}`, bucket, latencyMs);
    await _storage.hincrby(`metrics:latency_count:${siteKey}`, bucket, 1);
  }

  return c.json({ success: true, token: redeemToken, expires: tokenExpires });
});
