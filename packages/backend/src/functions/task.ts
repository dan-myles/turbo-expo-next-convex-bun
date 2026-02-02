import { Effect } from "effect"

import { mutation, query } from "#backend/lib/middleware"
import { create as createEffect } from "#backend/modules/task/create"
import { createArgsSchema, createResultSchema } from "#backend/modules/task/create.validators"
import { list as listEffect } from "#backend/modules/task/list"
import { listArgsSchema, listResultSchema } from "#backend/modules/task/list.validators"
import { remove as removeEffect } from "#backend/modules/task/remove"
import { removeArgsSchema, removeResultSchema } from "#backend/modules/task/remove.validators"
import { toggle as toggleEffect } from "#backend/modules/task/toggle"
import { toggleArgsSchema, toggleResultSchema } from "#backend/modules/task/toggle.validators"
import { Mutation, Query } from "#backend/services"

export const list = query({
  args: listArgsSchema,
  returns: listResultSchema,
  handler: (ctx) =>
    listEffect({}).pipe(Effect.provide(Query.live(ctx)), Effect.runPromise),
})

export const create = mutation({
  args: createArgsSchema,
  returns: createResultSchema,
  handler: (ctx, args) =>
    createEffect(args).pipe(
      Effect.provide(Mutation.live(ctx)),
      Effect.runPromise,
    ),
})

export const toggle = mutation({
  args: toggleArgsSchema,
  returns: toggleResultSchema,
  handler: (ctx, args) =>
    toggleEffect(args).pipe(
      Effect.provide(Mutation.live(ctx)),
      Effect.runPromise,
    ),
})

export const remove = mutation({
  args: removeArgsSchema,
  returns: removeResultSchema,
  handler: (ctx, args) =>
    removeEffect(args).pipe(
      Effect.provide(Mutation.live(ctx)),
      Effect.runPromise,
    ),
})
