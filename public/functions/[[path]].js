import { createApp } from "../../app.js";

let app;

export async function onRequest(context) {
  if (!app) app = await createApp(context.env);
  return app.fetch(context.request);
}
