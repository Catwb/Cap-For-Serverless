import { Hono } from "hono";
import { hashPassword, verifyPassword, sha256Hex, timingSafeEqual, generateSessionToken } from "./crypto.js";
import { createRateLimiter } from "./ratelimit.js";

let _storage = null;
let _adminKey = null;

export function initAuth(storage, cfg) {
  _storage = storage;
  _adminKey = cfg.ADMIN_KEY;
  if (cfg.DEMO_MODE !== "true") {
    if (!_adminKey) throw new Error("auth: Admin key missing. Please add one");
    if (_adminKey.length < 12) throw new Error("auth: Admin key too short. Please use one that's at least 12 characters");
  }
}

export const authRouter = new Hono();

const loginLimiter = createRateLimiter(null, { duration: 20000, max: 200 });

authRouter.post("/login", async (c) => {
  if (_storage) {
    const limitMiddleware = createRateLimiter(_storage, { duration: 20000, max: 200 });
    const res = await limitMiddleware(c, () => {});
    if (res) return res;
  }

  const { admin_key } = await c.req.json();
  const [adminKeyHash, storedHash] = await Promise.all([sha256Hex(admin_key), sha256Hex(_adminKey)]);
  if (!timingSafeEqual(adminKeyHash, storedHash)) {
    return c.json({ success: false }, 401);
  }

  const sessionToken = generateSessionToken();
  const expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const created = Date.now();
  const hashedToken = await hashPassword(sessionToken);
  const ttlSeconds = Math.ceil((expires - Date.now()) / 1000);

  if (_storage) {
    await _storage.set(`session:${hashedToken}`, JSON.stringify({ created, expires }));
    await _storage.expire(`session:${hashedToken}`, ttlSeconds);
    await _storage.sadd("sessions", hashedToken);
  }

  return c.json({ success: true, session_token: sessionToken, hashed_token: hashedToken, expires });
});

export async function authBeforeHandle(c, next) {
  const authorization = c.req.header("Authorization");
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("X-XSS-Protection", "1; mode=block");

  if (authorization?.startsWith("Bot ")) {
    const botToken = authorization.replace("Bot ", "").trim();
    const [id, token] = botToken.split("_");
    if (!id || !token) return c.json({ success: false, error: "Unauthorized. Invalid bot token." }, 401);

    if (_storage) {
      const fields = await _storage.hmget(`apikey:${id}`, ["tokenHash"]);
      const tokenHash = fields?.[0];
      if (!tokenHash) return c.json({ success: false, error: "Unauthorized. Deleted or non-existent bot token." }, 401);
      if (!(await verifyPassword(token, tokenHash))) return c.json({ success: false, error: "Unauthorized. Invalid bot token." }, 401);
    }
    return next();
  }

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Unauthorized. An API key or session token is required to use this endpoint." }, 401);
  }

  let token, hash;
  try {
    ({ token, hash } = JSON.parse(atob(authorization.replace("Bearer ", "").trim())));
  } catch {
    return c.json({ success: false, error: "Unauthorized. Malformed session token." }, 401);
  }

  if (_storage) {
    const sessionData = await _storage.get(`session:${hash}`);
    if (!sessionData) return c.json({ success: false, error: "Unauthorized. An invalid session token was used." }, 401);

    const session = JSON.parse(sessionData);
    if (session.expires <= Date.now()) {
      await _storage.del(`session:${hash}`);
      await _storage.srem("sessions", hash);
      return c.json({ success: false, error: "Unauthorized. An invalid session token was used." }, 401);
    }

    if (!(await verifyPassword(token, hash))) return c.json({ success: false, error: "Unauthorized. An invalid session token was used." }, 401);
  }

  return next();
}
