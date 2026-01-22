import fp from "fastify-plugin";

import { success } from "../response.js";

export const healthRoutes = fp((app, _opts, done) => {
  app.get("/healthz", () => success({ status: "ok" }));
  done();
});
