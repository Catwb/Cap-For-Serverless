import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const port = process.env.SERVER_PORT || 3067;
const hostname = process.env.SERVER_HOSTNAME || "0.0.0.0";

const app = await createApp();

serve({ fetch: app.fetch, port: Number(port), hostname });
console.log(`🧢 Cap Cloud running on http://${hostname}:${port}`);
