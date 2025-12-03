import { zActionBuilder, zMutationBuilder, zQueryBuilder } from "zodvex"

import {
  action as convexAction,
  mutation as convexMutation,
  query as convexQuery,
} from "@acme/backend/_generated/server"

/**
 * Convex - Zod Normal Query zActionBuilder
 *
 * Use this to build a type-safe Convex Action, with an exported validator.
 */
export const query = zQueryBuilder(convexQuery)
export const mutation = zMutationBuilder(convexMutation)
export const action = zActionBuilder(convexAction)
