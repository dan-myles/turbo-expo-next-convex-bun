/**
 * Type-safe environment variables using @t3-oss/env-core and Zod.
 *
 * Validates environment variables at runtime and provides full TypeScript
 * inference. Missing or invalid variables will throw descriptive errors.
 * We must manually destructure the `env` object to access the variables.
 * As Expo tree-shakes the environment variables on build.
 *
 * @example
 * // Access validated environment variables
 * import { env } from "@acme/backend/lib/env"
 *
 * const HTTP_URL = env.HTT_URL // type: "debug" | "info" | "warn" | "error"
 *
 * @example
 * // Adding new environment variables
 * client: {
 *   HTTP_URL: z.string().url(),
 *   DATABASE_URL: z.string().url(),
 *   OPTIONAL_VAR: z.string().optional(),
 * }
 */
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_",
  emptyStringAsUndefined: true,
  runtimeEnv: {
    EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL,
  },
  client: {
    EXPO_PUBLIC_CONVEX_URL: z.string(),
  },
});
