import baseConfig from "@acme/eslint-config/base"
import reactConfig from "@acme/eslint-config/react"
import tanstackConfig from "@acme/eslint-config/tanstack"

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  ...tanstackConfig,
  ...reactConfig,
]
