import { Effect } from "effect"

import type { ListArgs, ListResult } from "./list.validators"
import { DatabaseError } from "#backend/errors"
import { Query } from "#backend/services"

export const list = Effect.fn("task.list")(function* (_args: ListArgs) {
  const { db } = yield* Query

  const tasks = yield* Effect.tryPromise({
    try: () => db.query("tasks").order("desc").collect(),
    catch: (e) => new DatabaseError({ operation: "query:tasks", cause: e }),
  })

  return tasks satisfies ListResult
})
