import baseConfig from "@acme/eslint-config/base"
import expoConfig from "@acme/eslint-config/expo"
import reactConfig from "@acme/eslint-config/react"

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
  {
    ignores: [
      "app.config.ts",
      "ios/**",
      "android/**",
      ".expo/**",
      "metro.config.js",
      "index.ts",
    ],
  },
  ...baseConfig,
  ...reactConfig,
  ...expoConfig,
]
