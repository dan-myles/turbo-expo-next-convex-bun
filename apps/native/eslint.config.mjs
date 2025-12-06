import eslintPluginExpo from "eslint-plugin-expo"

import baseConfig from "@acme/eslint-config/base"
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
  {
    plugins: {
      expo: eslintPluginExpo,
    },
    rules: {
      "expo/use-dom-exports": ["error"],
      "expo/no-env-var-destructuring": ["error"],
      "expo/no-dynamic-env-var": ["error"],
    },
  },
]
