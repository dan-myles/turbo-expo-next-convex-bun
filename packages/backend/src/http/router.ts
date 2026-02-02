import { Hono } from "hono"

const app = new Hono()

app.get("/health", (c) => c.json({ status: "ok" }))

app.post("/webhook/example", async (c) => {
  const body = await c.req.json()
  return c.json({ received: true, data: body })
})

export default app
