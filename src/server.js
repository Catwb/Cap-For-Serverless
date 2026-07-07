import { Hono } from "hono";
import { authBeforeHandle } from "./auth.js";
import { invalidateBlockCache } from "./cap.js";
import { demoGetKeys, demoGetKey, demoGetGeoStats, demoGetBlockedIps } from "./demo.js";
import { hashPassword, generateSecretKey, generateJwtSecret, randomHex, randomBase64url } from "./crypto.js";
import { setHeaders, setRatelimit, setCorsDefault, setFiltering, invalidateCorsCache } from "./settings-cache.js";
import { ensureRswKeypair, getRswStatus } from "./rsw-store.js";
import { getStatus as getIpdbStatus, saveSettings as saveIpdbSettings, clearSettings as clearIpdbSettings } from "./ipdb.js";

let _storage = null;
let _cfg = null;
let _platform = "vercel-serverless";

export function initServer(storage, cfg, platform) {
  _storage = storage;
  _cfg = cfg;
  if (platform) _platform = platform;
}

const keyDefaults = {
  difficulty: 4, challengeCount: 80, saltSize: 32,
  instrumentation: false, obfuscationLevel: 3,
  blockAutomatedBrowsers: false, rsw: false, rswT: 75_000,
};

const sumSolutions = (data, startBucket, endBucket) => {
  let sum = 0;
  for (const [bucketStr, countStr] of Object.entries(data || {})) {
    const bucket = Number(bucketStr);
    const count = Number(countStr);
    if (bucket >= startBucket && (endBucket === undefined || bucket < endBucket)) sum += count;
  }
  return sum;
};

export const serverRouter = new Hono()
  .use("*", async (c, next) => {
    if (_cfg.DEMO_MODE === "true") return next();
    return authBeforeHandle(c, next);
  })
  .use("*", async (c, next) => {
    if (_cfg.DEMO_MODE === "true" && ["POST", "PUT", "DELETE"].includes(c.req.method)) return c.json({ success: true, demo: true });
    return next();
  })

  .get("/keys", async (c) => {
    if (!_storage) return c.json([]);
    if (_cfg.DEMO_MODE === "true") return c.json(demoGetKeys());
    const now = Math.floor(Date.now() / 1000);
    const day = 24 * 60 * 60;
    const currentStart = now - day;
    const previousStart = now - 2 * day;
    const siteKeys = await _storage.smembers("keys");
    const keys = await Promise.all(siteKeys.map(async (sk) => {
      const fields = await _storage.hmget(`key:${sk}`, ["name", "config", "created"]);
      return { siteKey: sk, name: fields[0], config: fields[1], created: Number(fields[2]) };
    }));
    keys.sort((a, b) => b.created - a.created);
    const result = await Promise.all(keys.map(async (key) => {
      const data = await _storage.hgetall(`metrics:verified:${key.siteKey}`);
      const current = sumSolutions(data, currentStart);
      const previous = sumSolutions(data, previousStart, currentStart);
      let change = 0, direction = "";
      if (previous > 0) { change = ((current - previous) / previous) * 100; direction = current > previous ? "up" : current < previous ? "down" : ""; }
      else if (current > 0) { change = 100; direction = "up"; }
      return { siteKey: key.siteKey, name: key.name, created: key.created, solvesLast24h: current, difference: { value: change.toFixed(2), direction } };
    }));
    return c.json(result);
  })

  .post("/keys", async (c) => {
    if (!_storage) return c.json({ error: "Storage not configured" }, 500);
    const body = await c.req.json().catch(() => ({}));
    const siteKey = randomHex(5);
    const secretKey = generateSecretKey();
    const jwtSecret = generateJwtSecret();
    const config = { ...keyDefaults, instrumentation: body?.instrumentation ?? false, blockAutomatedBrowsers: body?.blockAutomatedBrowsers ?? false, rsw: body?.rsw ?? false, rswT: body?.rswT ?? keyDefaults.rswT };
    if (body?.corsOrigins && Array.isArray(body.corsOrigins) && body.corsOrigins.length) config.corsOrigins = body.corsOrigins;
    await _storage.hmset(`key:${siteKey}`, ["name", body?.name || siteKey, "secretHash", await hashPassword(secretKey), "jwtSecret", jwtSecret, "config", JSON.stringify(config), "created", String(Date.now())]);
    await _storage.sadd("keys", siteKey);
    return c.json({ siteKey, secretKey });
  })

  .get("/keys/:siteKey", async (c) => {
    if (!_storage) return c.json({ error: "Not found" }, 404);
    const siteKey = c.req.param("siteKey");
    if (_cfg.DEMO_MODE === "true") { const d = demoGetKey(siteKey, c.req.query("chartDuration") || "today"); return d ? c.json(d) : c.json({ error: "Not found" }, 404); }
    const fields = await _storage.hmget(`key:${siteKey}`, ["name", "config", "created"]);
    if (!fields[0]) return c.json({ error: "Not found" }, 404);
    const now = Math.floor(Date.now() / 1000);
    const day = 86400;
    const statsKeys = { verified: "metrics:verified", failed: "metrics:failed", ratelimited: "metrics:ratelimited", latency_sum: "metrics:latency_sum", latency_count: "metrics:latency_count" };
    const chartDuration = c.req.query("chartDuration") || "today";
    let startBucket, endBucket;
    if (chartDuration === "today") { startBucket = now - day; endBucket = now; }
    else if (chartDuration === "yesterday") { startBucket = now - 2 * day; endBucket = now - day; }
    else if (chartDuration === "last7days") { startBucket = now - 7 * day; endBucket = now; }
    else if (chartDuration === "last28days") { startBucket = now - 28 * day; endBucket = now; }
    else if (chartDuration === "last91days") { startBucket = now - 91 * day; endBucket = now; }
    else { startBucket = 0; endBucket = now; }
    const stats = {};
    for (const [key, prefix] of Object.entries(statsKeys)) {
      const d = await _storage.hgetall(`${prefix}:${siteKey}`);
      stats[key] = sumSolutions(d, startBucket, endBucket);
    }
    let prevStats = null;
    if (chartDuration !== "alltime") {
      const prevEnd = startBucket;
      const prevStart = startBucket - (endBucket - startBucket);
      prevStats = {};
      for (const [key, prefix] of Object.entries(statsKeys)) {
        const d = await _storage.hgetall(`${prefix}:${siteKey}`);
        prevStats[key] = sumSolutions(d, prevStart, prevEnd);
      }
    }
    const [chartVerified, chartFailed, chartRatelimited] = await Promise.all([
      _storage.hgetall(`metrics:verified:${siteKey}`),
      _storage.hgetall(`metrics:failed:${siteKey}`),
      _storage.hgetall(`metrics:ratelimited:${siteKey}`),
    ]);
    const allBuckets = new Set();
    for (const d of [chartVerified, chartFailed, chartRatelimited]) {
      if (d) for (const k of Object.keys(d)) { const b = Number(k); if (b >= startBucket && b < endBucket) allBuckets.add(k); }
    }
    const chartData = {
      duration: chartDuration,
      data: [...allBuckets].sort((a, b) => Number(a) - Number(b)).map(bucket => ({
        bucket: Number(bucket),
        verified: Number(chartVerified?.[bucket] || 0),
        failed: Number(chartFailed?.[bucket] || 0),
        ratelimited: Number(chartRatelimited?.[bucket] || 0),
      })),
    };
    return c.json({
      key: { siteKey, name: fields[0], created: Number(fields[2]), config: JSON.parse(fields[1] || "{}") },
      stats: { ...stats, avgLatency: stats.latency_count > 0 ? Math.round(stats.latency_sum / stats.latency_count) : 0 },
      prevStats: prevStats ? { ...prevStats, avgLatency: prevStats.latency_count > 0 ? Math.round(prevStats.latency_sum / prevStats.latency_count) : 0 } : null,
      chartData,
    });
  })

  .put("/keys/:siteKey/config", async (c) => {
    if (!_storage) return c.json({ error: "Storage not configured" }, 500);
    const siteKey = c.req.param("siteKey");
    const body = await c.req.json().catch(() => ({}));
    const configStr = await _storage.hget(`key:${siteKey}`, "config");
    if (!configStr) return c.json({ error: "Not found" }, 404);
    const config = { ...JSON.parse(configStr), ...body };
    await _storage.hset(`key:${siteKey}`, "config", JSON.stringify(config));
    invalidateCorsCache(siteKey);
    return c.json({ success: true });
  })

  .delete("/keys/:siteKey", async (c) => {
    if (!_storage) return c.json({ error: "Storage not configured" }, 500);
    const siteKey = c.req.param("siteKey");
    const exists = await _storage.exists(`key:${siteKey}`);
    if (!exists) return c.json({ error: "Not found" }, 404);
    const metricsPrefixes = ["verified", "failed", "ratelimited", "latency_sum", "latency_count", "country", "asn", "platform", "os"];
    await Promise.all([
      _storage.del(`key:${siteKey}`), ...metricsPrefixes.map(p => _storage.del(`metrics:${p}:${siteKey}`)),
      _storage.del(`blocked:${siteKey}`), _storage.srem("keys", siteKey),
    ]);
    invalidateBlockCache(siteKey);
    invalidateCorsCache(siteKey);
    return c.json({ success: true });
  })

  .post("/keys/:siteKey/rotate-secret", async (c) => {
    if (!_storage) return c.json({ error: "Storage not configured" }, 500);
    const siteKey = c.req.param("siteKey");
    const exists = await _storage.exists(`key:${siteKey}`);
    if (!exists) return c.json({ error: "Not found" }, 404);
    const secretKey = generateSecretKey();
    await _storage.hset(`key:${siteKey}`, "secretHash", await hashPassword(secretKey));
    return c.json({ success: true, secretKey });
  })

  .get("/keys/:siteKey/geo-stats", async (c) => {
    if (!_storage) return c.json({});
    const siteKey = c.req.param("siteKey");
    if (_cfg.DEMO_MODE === "true") { const d = demoGetGeoStats(siteKey); return d ? c.json(d) : c.json({}); }
    const catKeys = { country: `metrics:country:${siteKey}`, asn: `metrics:asn:${siteKey}`, platform: `metrics:platform:${siteKey}`, os: `metrics:os:${siteKey}` };
    const result = {};
    for (const [key, rk] of Object.entries(catKeys)) {
      const obj = await _storage.hgetall(rk);
      const entries = obj ? Object.entries(obj).map(([name, count]) => ({ name, count: Number(count) })).sort((a, b) => b.count - a.count) : [];
      result[key] = entries;
      result[`total${key.charAt(0).toUpperCase() + key.slice(1)}`] = entries.reduce((s, e) => s + e.count, 0);
    }
    return c.json(result);
  })

  .post("/keys/:siteKey/block-ip", async (c) => {
    if (!_storage) return c.json({ error: "Storage not configured" }, 500);
    const siteKey = c.req.param("siteKey");
    const body = await c.req.json().catch(() => ({}));
    const exists = await _storage.exists(`key:${siteKey}`);
    if (!exists) return c.json({ error: "Not found" }, 404);
    await _storage.hset(`blocked:${siteKey}`, body.ip || body.value, body.permanent ? "0" : String(body.expires || Date.now() + 86400000));
    invalidateBlockCache(siteKey);
    return c.json({ success: true });
  })

  .post("/keys/:siteKey/unblock-ip", async (c) => {
    if (!_storage) return c.json({ error: "Storage not configured" }, 500);
    const siteKey = c.req.param("siteKey");
    const body = await c.req.json().catch(() => ({}));
    const exists = await _storage.exists(`key:${siteKey}`);
    if (!exists) return c.json({ error: "Not found" }, 404);
    await _storage.hdel(`blocked:${siteKey}`, body.ip || body.value);
    invalidateBlockCache(siteKey);
    return c.json({ success: true });
  })

  .get("/keys/:siteKey/blocked-ips", async (c) => {
    if (!_storage) return c.json([]);
    const siteKey = c.req.param("siteKey");
    if (_cfg.DEMO_MODE === "true") return c.json(demoGetBlockedIps(siteKey));
    const obj = await _storage.hgetall(`blocked:${siteKey}`);
    if (!obj) return c.json([]);
    const now = Date.now();
    const entries = Object.entries(obj).filter(([, val]) => val === "0" || Number(val) > now);
    const rules = entries.map(([ip, val]) => {
      const isPerm = val === "0";
      let type = "ip";
      if (ip.startsWith("cidr:")) type = "cidr"; else if (ip.startsWith("asn:")) type = "asn"; else if (ip.startsWith("country:")) type = "country";
      return { ip: ip.replace(/^(cidr:|asn:|country:)/, ""), type, permanent: isPerm, expires: isPerm ? null : Number(val) };
    });
    return c.json(rules);
  })

  .get("/settings/sessions", async (c) => {
    if (!_storage) return c.json([]);
    const hashes = await _storage.smembers("sessions");
    const sessions = (await Promise.all(hashes.map(async (h) => {
      const data = await _storage.get(`session:${h}`);
      if (!data) return null;
      const s = JSON.parse(data);
      if (s.expires <= Date.now()) { await _storage.del(`session:${h}`); await _storage.srem("sessions", h); return null; }
      return { hash: h, created: s.created, expires: s.expires };
    }))).filter(Boolean);
    return c.json(sessions);
  })

  .get("/settings/apikeys", async (c) => {
    if (!_storage) return c.json([]);
    const ids = await _storage.smembers("apikeys");
    const keys = await Promise.all(ids.map(async (id) => {
      const fields = await _storage.hmget(`apikey:${id}`, ["name", "created"]);
      return { id, name: fields[0], created: Number(fields[1]) };
    }));
    return c.json(keys);
  })

  .post("/settings/apikeys", async (c) => {
    if (!_storage) return c.json({ error: "Storage not configured" }, 500);
    const body = await c.req.json().catch(() => ({}));
    const id = randomHex(16);
    const token = `cap-${randomBase64url(24)}`;
    const tokenHash = await hashPassword(token);
    await _storage.hmset(`apikey:${id}`, ["name", body?.name || "API Key", "tokenHash", tokenHash, "created", String(Date.now())]);
    await _storage.sadd("apikeys", id);
    return c.json({ id, token, name: body?.name || "API Key" });
  })

  .delete("/settings/apikeys/:id", async (c) => {
    if (!_storage) return c.json({ error: "Storage not configured" }, 500);
    const id = c.req.param("id");
    const exists = await _storage.exists(`apikey:${id}`);
    if (!exists) return c.json({ error: "Not found" }, 404);
    await _storage.del(`apikey:${id}`);
    await _storage.srem("apikeys", id);
    return c.json({ success: true });
  })

  .get("/settings/headers", async (c) => {
    if (!_storage) return c.json({});
    const raw = await _storage.get("settings:headers");
    return c.json(raw ? JSON.parse(raw) : { ipHeader: "", countryHeader: "", asnHeader: "" });
  })

  .put("/settings/headers", async (c) => {
    if (!_storage) return c.json({ error: "Storage not configured" }, 500);
    const body = await c.req.json().catch(() => ({}));
    await _storage.set("settings:headers", JSON.stringify(body));
    setHeaders(body);
    return c.json({ success: true });
  })

  .get("/settings/ratelimit", async (c) => {
    if (!_storage) return c.json({ max: 30, duration: 5000 });
    const raw = await _storage.get("settings:ratelimit");
    return c.json(raw ? JSON.parse(raw) : { max: 30, duration: 5000 });
  })

  .put("/settings/ratelimit", async (c) => {
    if (!_storage) return c.json({ error: "Storage not configured" }, 500);
    const body = await c.req.json().catch(() => ({}));
    await _storage.set("settings:ratelimit", JSON.stringify(body));
    setRatelimit(body);
    return c.json({ success: true });
  })

  .get("/settings/cors", async (c) => {
    if (!_storage) return c.json({ origins: null });
    const raw = await _storage.get("settings:cors");
    return c.json(raw ? JSON.parse(raw) : { origins: null });
  })

  .put("/settings/cors", async (c) => {
    if (!_storage) return c.json({ error: "Storage not configured" }, 500);
    const body = await c.req.json().catch(() => ({}));
    await _storage.set("settings:cors", JSON.stringify(body));
    setCorsDefault(body);
    invalidateCorsCache();
    return c.json({ success: true });
  })

  .get("/settings/filtering", async (c) => {
    if (!_storage) return c.json({ blockNonBrowserUA: false, requiredHeaders: [] });
    const raw = await _storage.get("settings:filtering");
    return c.json(raw ? JSON.parse(raw) : { blockNonBrowserUA: false, requiredHeaders: [] });
  })

  .put("/settings/filtering", async (c) => {
    if (!_storage) return c.json({ error: "Storage not configured" }, 500);
    const body = await c.req.json().catch(() => ({}));
    await _storage.set("settings:filtering", JSON.stringify(body));
    setFiltering(body);
    return c.json({ success: true });
  })

  .get("/settings/rsw", async (c) => c.json(getRswStatus()))

  .post("/settings/rsw/ensure", async (c) => {
    try { const s = await ensureRswKeypair(); return c.json(s); }
    catch (e) { return c.json({ error: e.message }, 500); }
  })

  .get("/settings/ipdb", async (c) => c.json(getIpdbStatus()))

  .post("/settings/ipdb/download", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    await saveIpdbSettings(body);
    return c.json({ success: true, mode: "ipinfo", loaded: true });
  })

  .delete("/settings/ipdb", async (c) => { await clearIpdbSettings(); return c.json({ success: true }); })

  .get("/about", async (c) => c.json({ version: "3.1.5", mode: _cfg.DEMO_MODE === "true" ? "demo" : "production", runtime: _platform === "cloudflare-workers" ? "workerd" : "node", platform: _platform }))

  .post("/logout", async (c) => {
    if (!_storage) return c.json({ success: true });
    const authorization = c.req.header("Authorization");
    if (authorization?.startsWith("Bearer ")) {
      try {
        const { hash } = JSON.parse(atob(authorization.replace("Bearer ", "").trim()));
        await _storage.del(`session:${hash}`);
        await _storage.srem("sessions", hash);
      } catch {}
    }
    return c.json({ success: true });
  });
