import path from "path"
import { includeIgnoreFile } from "@eslint/compat"
import unusedImports from "eslint-plugin-unused-imports"
import tseslint from "typescript-eslint"

export default [
  includeIgnoreFile(path.join(import.meta.dirname, "../../.gitignore")),
  ...tseslint.configs.recommended,
  {
    ignores: [".cache/**", "vendor/**", "eslint.config.mjs"],
  },
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],

      // General code quality rules
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-console": "off",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "off",
      "prefer-template": "error",

      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": "off",
    },
  },
]
