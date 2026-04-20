import { Context, Layer } from "effect"

import type {
  PublicActionCtx,
  PublicMutationCtx,
  PublicQueryCtx,
} from "#backend/lib/middleware"

export class Query extends Context.Tag("Query")<Query, PublicQueryCtx>() {
  static live = (ctx: PublicQueryCtx) => Layer.succeed(Query, ctx)
}

export class Mutation extends Context.Tag("Mutation")<
  Mutation,
  PublicMutationCtx
>() {
  static live = (ctx: PublicMutationCtx) => Layer.succeed(Mutation, ctx)
}

export class Action extends Context.Tag("Action")<Action, PublicActionCtx>() {
  static live = (ctx: PublicActionCtx) => Layer.succeed(Action, ctx)
}
