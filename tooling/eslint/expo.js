// @ts-expect-error Tanstack config does not provide types
import eslintPluginExpo from "eslint-plugin-expo"

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
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
