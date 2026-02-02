import { Effect } from "effect"

import type { CreateArgs, CreateResult } from "./create.validators"
import { DatabaseError } from "#backend/errors"
import { Mutation } from "#backend/services"

export const create = Effect.fn("task.create")(function* (args: CreateArgs) {
  const { db } = yield* Mutation

  const id = yield* Effect.tryPromise({
    try: () =>
      db.insert("tasks", {
        text: args.text,
        completed: false,
        createdAt: Date.now(),
      }),
    catch: (e) => new DatabaseError({ operation: "insert:tasks", cause: e }),
  })

  return id satisfies CreateResult
})
