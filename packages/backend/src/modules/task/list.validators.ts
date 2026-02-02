import { z } from "zod"

import { Tasks } from "#backend/tables/tasks"

export const listArgsSchema = z.object({})
export type ListArgs = z.infer<typeof listArgsSchema>

export const listResultSchema = z.array(Tasks.zDoc)
export type ListResult = z.infer<typeof listResultSchema>
