/**
 * Type-safe environment variables using @t3-oss/env-core and Zod.
 *
 * Validates environment variables at runtime and provides full TypeScript
 * inference. Missing or invalid variables will throw descriptive errors.
 *
 * @example
 * // Access validated environment variables
 * import { env } from "@acme/backend/lib/env"
 *
 * const level = env.LOG_LEVEL // type: "debug" | "info" | "warn" | "error"
 *
 * @example
 * // Adding new environment variables
 * server: {
 *   LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("debug"),
 *   DATABASE_URL: z.string().url(),
 *   API_KEY: z.string().min(1),
 *   OPTIONAL_VAR: z.string().optional(),
 * }
 */
import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error"])
      .optional()
      .default("debug"),
  },
})
