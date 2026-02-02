import { z } from "zod"
import { zid } from "zodvex"

export const createArgsSchema = z.object({
  text: z.string(),
})
export type CreateArgs = z.infer<typeof createArgsSchema>

export const createResultSchema = zid("tasks")
export type CreateResult = z.infer<typeof createResultSchema>
