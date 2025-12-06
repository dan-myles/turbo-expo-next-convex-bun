import { query } from "@acme/backend/_generated/server"

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").order("desc").collect()
  },
})
