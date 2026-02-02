import { z } from "zod"
import { zid } from "zodvex"

export const removeArgsSchema = z.object({
  id: zid("tasks"),
})
export type RemoveArgs = z.infer<typeof removeArgsSchema>

export const removeResultSchema = z.null()
export type RemoveResult = z.infer<typeof removeResultSchema>
