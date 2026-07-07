import { createApp } from "../app.js";

let app;

export default async function handler(req, res) {
  if (!app) {
    app = await createApp();
  }

  const body = await new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => data += chunk);
    req.on("end", () => resolve(data));
  });

  const url = new URL(req.url, `https://${req.headers.host}`);
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    headers[k] = Array.isArray(v) ? v.join(", ") : v;
  }

  const request = new Request(url, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" && body ? body : undefined,
  });

  const response = await app.fetch(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/wasm") || contentType.includes("octet-stream")) {
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  } else {
    res.end(await response.text());
  }
}
