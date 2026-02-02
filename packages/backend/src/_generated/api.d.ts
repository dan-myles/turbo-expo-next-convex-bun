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
import type * as functions_task from "../functions/task.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_logger from "../lib/logger.js";
import type * as lib_middleware from "../lib/middleware.js";
import type * as modules_task_create from "../modules/task/create.js";
import type * as modules_task_list from "../modules/task/list.js";
import type * as modules_task_remove from "../modules/task/remove.js";
import type * as modules_task_toggle from "../modules/task/toggle.js";
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
  "functions/task": typeof functions_task;
  "lib/env": typeof lib_env;
  "lib/errors": typeof lib_errors;
  "lib/logger": typeof lib_logger;
  "lib/middleware": typeof lib_middleware;
  "modules/task/create": typeof modules_task_create;
  "modules/task/list": typeof modules_task_list;
  "modules/task/remove": typeof modules_task_remove;
  "modules/task/toggle": typeof modules_task_toggle;
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
