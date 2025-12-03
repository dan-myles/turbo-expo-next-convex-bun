import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    LOG_LEVEL: z.optional(z.enum(["debug", "info", "warn", "error"])),
  },
})
