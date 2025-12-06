import convexPlugin from "@convex-dev/eslint-plugin"

const recommendedConfig = convexPlugin.configs.recommended[0]
const recommendedRules = recommendedConfig.rules

export default [
  {
    files: ["**/src/**/*.ts"],
    plugins: {
      "@convex-dev": convexPlugin,
    },
    rules: recommendedRules,
  },
]
