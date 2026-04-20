import { Effect } from "effect"

import type { ToggleArgs, ToggleResult } from "./toggle.validators"
import { DatabaseError } from "#backend/errors"
import { Mutation } from "#backend/services"

export const toggle = Effect.fn("task.toggle")(function* (args: ToggleArgs) {
  const { db } = yield* Mutation

  const task = yield* Effect.tryPromise({
    try: () => db.get("tasks", args.id),
    catch: (e) => new DatabaseError({ operation: "get:tasks", cause: e }),
  })

  if (!task) throw new Error("Task not found")

  yield* Effect.tryPromise({
    try: () =>
      db.patch("tasks", args.id, {
        completed: !task.completed,
      }),
    catch: (e) => new DatabaseError({ operation: "patch:tasks", cause: e }),
  })

  return null satisfies ToggleResult
})
