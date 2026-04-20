import { Effect } from "effect"

import type { RemoveArgs, RemoveResult } from "./remove.validators"
import { DatabaseError } from "#backend/errors"
import { Mutation } from "#backend/services"

export const remove = Effect.fn("task.remove")(function* (args: RemoveArgs) {
  const { db } = yield* Mutation

  yield* Effect.tryPromise({
    try: () => db.delete("tasks", args.id),
    catch: (e) => new DatabaseError({ operation: "delete:tasks", cause: e }),
  })

  return null satisfies RemoveResult
})
