import { getHeaders } from "./settings-cache.js";

let scopeCounter = 0;

const DEFAULT_IP_HEADERS = ["X-Forwarded-For", "X-Real-IP", "CF-Connecting-IP"];

function getClientIp(request) {
  const cachedHeaders = getHeaders();
  const headerFromSettings = cachedHeaders?.ipHeader;
  const headerName = headerFromSettings;

  if (headerName) {
    const ip = request.headers.get(headerName) || request.headers.get(headerName.toLowerCase());
    if (ip) {
      const parts = ip.split(",").filter(Boolean);
      return parts[0].trim();
    }
  }

  for (const h of DEFAULT_IP_HEADERS) {
    const val = request.headers.get(h);
    if (val) {
      const parts = val.split(",").filter(Boolean);
      return parts[0].trim();
    }
  }

  return null;
}

export function createRateLimiter(storage, {
  max: defaultMax = 30,
  duration: defaultDuration = 5000,
  getLimits,
  onLimited,
} = {}) {
  const scope = scopeCounter++;

  return async function rateLimit(c, next) {
    const ip = getClientIp(c.req.raw);
    if (!ip) return next();

    let max = defaultMax;
    let duration = defaultDuration;

    if (getLimits) {
      try {
        const limits = await getLimits(c.req.param());
        if (limits) {
          max = limits.max;
          duration = limits.duration;
        }
      } catch {}
    }

    const windowMs = duration;
    const windowSecs = Math.ceil(duration / 1000);
    const window = Math.floor(Date.now() / windowMs);
    const key = `rl:${scope}:${ip}:${windowMs}:${window}`;

    try {
      const count = await storage.incr(key);
      if (count === 1) {
        await storage.expire(key, windowSecs + 1);
      }

      c.res.headers.set("X-RateLimit-Limit", String(max));
      c.res.headers.set("X-RateLimit-Remaining", String(Math.max(0, max - count)));

      if (count > max) {
        if (onLimited) {
          try { await onLimited(c.req.raw, ip); } catch {}
        }
        return c.text(JSON.stringify({ error: "Rate limit exceeded" }), 429, {
          "Content-Type": "application/json",
        });
      }
    } catch {}

    return next();
  };
}
