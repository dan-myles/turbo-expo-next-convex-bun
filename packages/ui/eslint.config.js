import baseConfig from "@acme/eslint-config/base"

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "**/_generated/", "vendor/**"],
  },
]
