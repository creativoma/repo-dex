import js from "@eslint/js";
import globals from "globals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierConfig from "eslint-config-prettier";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["build/**", "node_modules/**", ".react-router/**", ".omc/**", ".claude/**"],
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11y,
    },
    settings: {
      react: { version: "19.0" },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      // React 17+ JSX transform — no need to import React
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // TypeScript already catches undefined variables
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // Existing codebase uses derived-state pattern — revisit when refactoring
      "react-hooks/set-state-in-effect": "warn",
      // Existing forms use implicit label association — revisit for accessibility
      "jsx-a11y/label-has-associated-control": "warn",
    },
  },
  prettierConfig,
];
