import baseConfig from "@acme/eslint-config/base"
import convexConfig from "@acme/eslint-config/convex"

export default [
  ...baseConfig,
  ...convexConfig,
  {
    ignores: ["dist/**", "**/_generated/", "vendor/**"],
  },
  {
    rules: {
      "no-console": "off",
    },
  },
]
