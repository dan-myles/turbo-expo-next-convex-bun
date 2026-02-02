import { z } from "zod"
import { zid } from "zodvex"

export const toggleArgsSchema = z.object({
  id: zid("tasks"),
})
export type ToggleArgs = z.infer<typeof toggleArgsSchema>

export const toggleResultSchema = z.null()
export type ToggleResult = z.infer<typeof toggleResultSchema>
