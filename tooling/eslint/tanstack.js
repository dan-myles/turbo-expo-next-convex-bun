import { tanstackConfig } from "@tanstack/eslint-config"

export default [
  ...tanstackConfig,
  {
    // Different sort order for imports via Prettier, Tanstack expects different order
    rules: {
      "sort-imports": "off",
      "import/order": "off",
    },
  },
]
