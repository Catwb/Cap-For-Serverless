import { Hono } from "hono";
import { verifyPassword } from "./crypto.js";

let _storage = null;

export function initSiteverify(storage) {
  _storage = storage;
}

export const siteverifyRouter = new Hono();

siteverifyRouter.post("/:siteKey?/siteverify", async (c) => {
  if (!_storage) return c.json({ success: false, error: "Storage not configured" }, 500);

  const sitekeyraw = c.req.param("siteKey") || false;
  const body = await c.req.json();
  const { secret, response } = body;
  let sitekey = false;

  if (response.split(":").length !== 3) return c.json({ success: false, error: "Missing required parameters" }, 400);

  if (sitekeyraw) sitekey = sitekeyraw;
  else sitekey = response.split(":")[0];

  if (sitekeyraw && !response.startsWith(sitekeyraw)) return c.json({ success: false, error: "Invalid site key or secret" }, 404);
  if (!secret || !response) return c.json({ success: false, error: "Missing required parameters" }, 400);

  const secretHash = await _storage.hget(`key:${sitekey}`, "secretHash");
  if (!secretHash || !secret) return c.json({ success: false, error: "Invalid site key or secret" }, 404);

  const isValidSecret = await verifyPassword(secret, secretHash);
  if (!isValidSecret) return c.json({ success: false, error: "Invalid site key or secret" }, 403);

  const tokenKey = `token:${response}`;
  const expires = await _storage.getdel(tokenKey);
  if (!expires) return c.json({ success: false, error: "Token not found" }, 404);
  if (Number(expires) < Date.now()) return c.json({ success: false, error: "Token expired" }, 403);

  return c.json({ success: true });
});
