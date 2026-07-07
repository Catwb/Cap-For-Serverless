let _headers = null;
let _ratelimit = null;
let _corsDefault = null;
let _filtering = null;

const _corsCache = new Map();
const CORS_CACHE_TTL = 60_000;

let _storage = null;
let _cfg = null;

export function initSettingsCache(storage, cfg) {
  _storage = storage;
  _cfg = cfg;
}

export async function loadHeaders() {
  if (!_storage) return;
  try {
    const raw = await _storage.get("settings:headers");
    _headers = raw ? JSON.parse(raw) : { ipHeader: "", countryHeader: "", asnHeader: "" };
  } catch {
    _headers = { ipHeader: "", countryHeader: "", asnHeader: "" };
  }
  return _headers;
}

export function getHeaders() {
  return _headers;
}

export function setHeaders(settings) {
  _headers = settings;
}

export async function loadRatelimit() {
  if (!_storage) return;
  try {
    const raw = await _storage.get("settings:ratelimit");
    _ratelimit = raw ? JSON.parse(raw) : { max: 30, duration: 5000 };
  } catch {
    _ratelimit = { max: 30, duration: 5000 };
  }
  return _ratelimit;
}

export function getRatelimit() {
  return _ratelimit || { max: 30, duration: 5000 };
}

export function setRatelimit(settings) {
  _ratelimit = settings;
}

function corsDefaultFromEnv() {
  const env = _cfg?.CORS_ORIGIN;
  if (!env || env.trim() === "*") return { origins: null };
  const origins = env.split(",").map(o => o.trim()).filter(o => o && o !== "*");
  return { origins: origins.length ? origins : null };
}

export async function loadCorsDefault() {
  if (!_storage) return;
  try {
    const raw = await _storage.get("settings:cors");
    _corsDefault = raw ? JSON.parse(raw) : corsDefaultFromEnv();
  } catch {
    _corsDefault = corsDefaultFromEnv();
  }
  return _corsDefault;
}

export function getCorsDefault() {
  return _corsDefault || { origins: null };
}

export function setCorsDefault(settings) {
  _corsDefault = settings;
}

export async function loadFiltering() {
  if (!_storage) return;
  try {
    const raw = await _storage.get("settings:filtering");
    _filtering = raw ? JSON.parse(raw) : { blockNonBrowserUA: false, requiredHeaders: [] };
  } catch {
    _filtering = { blockNonBrowserUA: false, requiredHeaders: [] };
  }
  return _filtering;
}

export function getFiltering() {
  return _filtering || { blockNonBrowserUA: false, requiredHeaders: [] };
}

export function setFiltering(settings) {
  _filtering = settings;
}

export function checkCorsOrigin(request) {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const siteKey = parts[0];
  if (!siteKey) return true;

  const now = Date.now();
  const cached = _corsCache.get(siteKey);
  let origins;

  if (cached) {
    origins = cached.origins;
    if (now - cached.ts >= CORS_CACHE_TTL) populateCorsCache(siteKey);
  } else {
    populateCorsCache(siteKey);
    origins = getCorsDefault().origins ?? null;
  }

  if (!origins?.length) return true;

  const from = request.headers.get("Origin") || "";
  if (origins.includes(from)) return true;

  try {
    const host = new URL(from).host;
    if (host && origins.includes(host)) return true;
  } catch {}
  return false;
}

function populateCorsCache(siteKey) {
  if (!_storage) return;
  _storage.hget(`key:${siteKey}`, "config").then(configStr => {
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        const origins = config.corsOrigins?.length ? config.corsOrigins : (getCorsDefault().origins ?? null);
        _corsCache.set(siteKey, { origins, ts: Date.now() });
      } catch {}
    } else {
      _corsCache.set(siteKey, { origins: getCorsDefault().origins ?? null, ts: Date.now() });
    }
  }).catch(() => {});
}

export function invalidateCorsCache(siteKey) {
  if (siteKey) _corsCache.delete(siteKey);
  else _corsCache.clear();
}
