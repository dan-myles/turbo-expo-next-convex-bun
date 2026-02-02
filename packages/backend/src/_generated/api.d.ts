/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as errors_common from "../errors/common.js";
import type * as errors_index from "../errors/index.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_logger from "../lib/logger.js";
import type * as lib_middleware from "../lib/middleware.js";
import type * as modules_task_mutations from "../modules/task/mutations.js";
import type * as modules_task_queries from "../modules/task/queries.js";
import type * as services_ctx from "../services/ctx.js";
import type * as services_index from "../services/index.js";
import type * as tables_tasks from "../tables/tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "errors/common": typeof errors_common;
  "errors/index": typeof errors_index;
  "lib/env": typeof lib_env;
  "lib/errors": typeof lib_errors;
  "lib/logger": typeof lib_logger;
  "lib/middleware": typeof lib_middleware;
  "modules/task/mutations": typeof modules_task_mutations;
  "modules/task/queries": typeof modules_task_queries;
  "services/ctx": typeof services_ctx;
  "services/index": typeof services_index;
  "tables/tasks": typeof tables_tasks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
