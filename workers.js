import { createApp } from "./app.js";

let app;

export default {
  async fetch(request, env, ctx) {
    if (!app) app = await createApp(env);
    return app.fetch(request);
  },
};
