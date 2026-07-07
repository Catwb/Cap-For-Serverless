import { Hono } from "hono";

let _storage = null;

export function initAssets(storage) {
  _storage = storage;
}

const updateCache = async () => {
  if (process.env.ENABLE_ASSETS_SERVER !== "true" || !_storage) return;
  let cacheConfig = {};
  try { cacheConfig = JSON.parse((await _storage.get("asset:cache-config")) || "{}"); } catch {}

  const lastUpdate = cacheConfig.lastUpdate || 0;
  const currentTime = Date.now();
  const updateInterval = 1000 * 60 * 60 * 24;
  const intervalExceeded = currentTime - lastUpdate > updateInterval;
  const WIDGET_VERSION = process.env.WIDGET_VERSION || "latest";
  const WASM_VERSION = process.env.WASM_VERSION || "latest";

  if (!cacheConfig.versions) cacheConfig.versions = {};
  const versionsChanged = cacheConfig.versions.widget !== WIDGET_VERSION || cacheConfig.versions.wasm !== WASM_VERSION;
  if (!intervalExceeded && !versionsChanged) return;

  const CACHE_HOST = process.env.CACHE_HOST || "https://cdn.jsdelivr.net";
  try {
    const [widgetSource, floatingSource, wasmSource, wasmLoaderSource] = await Promise.all([
      fetch(`${CACHE_HOST}/npm/@cap.js/widget@${WIDGET_VERSION}`).then(r => r.text()),
      fetch(`${CACHE_HOST}/npm/@cap.js/widget@${WIDGET_VERSION}/cap-floating.min.js`).then(r => r.text()),
      fetch(`${CACHE_HOST}/npm/@cap.js/wasm@${WASM_VERSION}/browser/cap_wasm_bg.wasm`).then(r => r.arrayBuffer()),
      fetch(`${CACHE_HOST}/npm/@cap.js/wasm@${WASM_VERSION}/browser/cap_wasm.min.js`).then(r => r.text()),
    ]);

    cacheConfig.lastUpdate = currentTime;
    cacheConfig.versions.widget = WIDGET_VERSION;
    cacheConfig.versions.wasm = WASM_VERSION;

    await Promise.all([
      _storage.set("asset:cache-config", JSON.stringify(cacheConfig)),
      _storage.set("asset:widget.js", widgetSource),
      _storage.set("asset:floating.js", floatingSource),
      _storage.set("asset:cap_wasm_bg.wasm", Buffer.from(wasmSource)),
      _storage.set("asset:cap_wasm.js", wasmLoaderSource),
    ]);
  } catch (e) {
    console.error("📦 [asset server] failed to update assets cache:", e);
  }
};

updateCache();

export const assetsRouter = new Hono()

assetsRouter.use("*", async (c, next) => {
  c.res.headers.set("Cache-Control", "max-age=31536000, immutable");
  return next();
});

assetsRouter.get("/widget.js", async (c) => {
    if (!_storage) return c.text("Asset cache unavailable", 503);
    const content = await _storage.get("asset:widget.js");
    if (!content) return c.text("Asset not cached yet", 503);
    return c.body(content, 200, { "Content-Type": "text/javascript" });
  })
  .get("/floating.js", async (c) => {
    if (!_storage) return c.text("Asset cache unavailable", 503);
    const content = await _storage.get("asset:floating.js");
    if (!content) return c.text("Asset not cached yet", 503);
    return c.body(content, 200, { "Content-Type": "text/javascript" });
  })
  .get("/cap_wasm_bg.wasm", async (c) => {
    if (!_storage) return c.text("Asset cache unavailable", 503);
    const content = await _storage.get("asset:cap_wasm_bg.wasm");
    if (!content) return c.text("Asset not cached yet", 503);
    const buf = content instanceof ArrayBuffer ? content : Buffer.from(content);
    return c.body(buf, 200, { "Content-Type": "application/wasm" });
  })
  .get("/cap_wasm.js", async (c) => {
    if (!_storage) return c.text("Asset cache unavailable", 503);
    const content = await _storage.get("asset:cap_wasm.js");
    if (!content) return c.text("Asset not cached yet", 503);
    return c.body(content, 200, { "Content-Type": "text/javascript" });
  });
