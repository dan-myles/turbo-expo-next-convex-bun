import baseConfig from "@acme/eslint-config/base"
import reactConfig from "@acme/eslint-config/react"
import expoConfig from "@acme/eslint-config/expo"

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
