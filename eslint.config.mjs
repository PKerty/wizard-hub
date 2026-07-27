import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextConfig from "eslint-config-next";
import importPlugin from "eslint-plugin-import";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

// eslint-config-next v16 exports a flat config array directly via CJS default.
/** @type {tseslint.ConfigWithExtends[]} */
const nextFlatConfig = nextConfig;

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextFlatConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { import: importPlugin },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./modules/**/domain",
              from: [
                "./modules/**/infrastructure",
                "./modules/**/application",
                "./app",
                "./lib",
              ],
              message: "Domain layer cannot import from outer layers (hexagonal — ADR-0009).",
            },
            {
              target: "./modules/**/application",
              from: ["./modules/**/infrastructure", "./app"],
              message:
                "Application layer cannot import concrete infrastructure or app (hexagonal — ADR-0009). Use the port interface defined in domain.",
            },
            {
              target: "./app",
              from: ["./modules/**/infrastructure"],
              message:
                "App layer must not import infrastructure directly. Use application use cases (ADR-0009).",
            },
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Build/tooling configs that legitimately use Node globals.
    files: ["*.cjs", "*.config.cjs", "postcss.config.cjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettierConfig,
  {
    ignores: [
      ".next",
      "node_modules",
      "coverage",
      "out",
      "docs/adr",
      ".husky/**",
      "postcss.config.cjs",
    ],
  },
);
