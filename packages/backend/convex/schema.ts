import { defineSchema } from "convex/server"

import { Tasks } from "./tables/tasks"

export default defineSchema({
  tasks: Tasks.table,
})
