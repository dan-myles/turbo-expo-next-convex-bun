import { httpRouter } from "convex/server"

import { httpAction } from "./_generated/server"
import app from "./http/router"

const http = httpRouter()

http.route({
  path: "/.*",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    return app.fetch(req, { convex: ctx })
  }),
})

http.route({
  path: "/.*",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return app.fetch(req, { convex: ctx })
  }),
})

export default http
