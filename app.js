import { Hono } from "hono";
import { cors } from "hono/cors";
import { UpstashRedisAdapter } from "./src/storage/upstash-redis.js";
import { NeonPGAdapter } from "./src/storage/neon-postgres.js";
import { MemoryAdapter } from "./src/storage/memory.js";
import { initSettingsCache, loadHeaders, loadRatelimit, loadCorsDefault, loadFiltering, getCorsDefault, checkCorsOrigin } from "./src/settings-cache.js";
import { initRswStore, loadRswKeypair } from "./src/rsw-store.js";
import { initAuth, authRouter } from "./src/auth.js";
import { initCap, capRouter } from "./src/cap.js";
import { initSiteverify, siteverifyRouter } from "./src/siteverify.js";
import { initAssets, assetsRouter } from "./src/assets.js";
import { initServer, serverRouter } from "./src/server.js";
import { initIpdb as initIpdbLib, loadSettings as loadIpdbSettings } from "./src/ipdb.js";

let storage;

export async function createApp(env) {
  const cfg = env || process.env;
  const useMemory = cfg.MEMORY_STORAGE === "true" || cfg.DEMO_MODE === "true";
  const platform = env ? "cloudflare-workers" : "vercel-serverless";
  if (useMemory) {
    storage = new MemoryAdapter();
  } else if (cfg.DATABASE_URL) {
    storage = new NeonPGAdapter();
    try {
      const ok = await storage.ping();
      if (!ok) throw new Error("Neon PG ping failed");
    } catch (e) {
      console.warn("[cap-cloud] Neon PG unavailable, falling back to memory:", e.message);
      storage = new MemoryAdapter();
    }
  } else {
    storage = new UpstashRedisAdapter();
    try {
      const ok = await storage.ping();
      if (!ok) throw new Error("Upstash Redis ping failed");
    } catch (e) {
      console.warn("[cap-cloud] Upstash Redis unavailable, falling back to memory:", e.message);
      storage = new MemoryAdapter();
    }
  }

  initSettingsCache(storage);
  initRswStore(storage);
  initAuth(storage, cfg);
  initCap(storage);
  initSiteverify(storage);
  initAssets(storage);
  initServer(storage, cfg, platform);
  initIpdbLib(storage, cfg);

  await Promise.all([
    loadHeaders().catch(() => {}),
    loadRatelimit().catch(() => {}),
    loadCorsDefault().catch(() => {}),
    loadFiltering().catch(() => {}),
    loadRswKeypair().catch(() => {}),
    loadIpdbSettings().catch(() => {}),
  ]);

  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true, version: "3.1.5" }));

  app.use("*", cors({
    origin: (origin, c) => {
      const path = new URL(c.req.url).pathname;
      if (path === "/assets" || path.startsWith("/assets/")) return origin || "*";
      return checkCorsOrigin(c.req.raw) ? (origin || "*") : "";
    },
    credentials: true,
  }));

  app.use("*", async (c, next) => {
    c.res.headers.set("X-Powered-By", "Cap Cloud");
    return next();
  });

  app.route("/auth", authRouter);
  app.route("/", capRouter);
  app.route("/", siteverifyRouter);
  app.route("/assets", assetsRouter);
  app.route("/server", serverRouter);

  app.onError((err, c) => {
    console.error("[cap] Error:", err);
    return c.json({ success: false, error: err.message || "Internal error" }, 500);
  });

  return app;
}

export function getStorage() {
  return storage;
}
