import { v } from "convex/values"

import { mutation } from "@acme/backend/_generated/server"

export const create = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      text: args.text,
      completed: false,
      createdAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete("tasks", args.id)
  },
})

export const toggle = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get("tasks", args.id)
    if (!task) throw new Error("Task not found")

    await ctx.db.patch("tasks", args.id, {
      completed: !task.completed,
    })
  },
})
