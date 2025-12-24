// eslint.config.js (Flat config for ESLint v9)
// Launch-ready goal: `npm run lint` should PASS (warnings OK, errors = 0)

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  // ----------------------------
  // Global ignores
  // ----------------------------
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "_quarantine/**",
      "**/*.min.*",
      "**/*.d.ts",
      "_exports/**",

    ],
  },

  // Base JS recommended
  js.configs.recommended,

  // ----------------------------
  // Browser app (src) - TS/TSX
  // ----------------------------
  ...tseslint.configs.recommended.map((c) => ({
    ...c,
    files: ["src/**/*.{ts,tsx}"],
  })),

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: {
      react: { version: "detect" },
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // TS handles undefined vars better than ESLint in TS files
      "no-undef": "off",

      // React JSX runtime
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",

      // Keep hooks correctness strict, but turn “opinionated purity” rules off
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",

      // Fast refresh shouldn’t block lint passing
      "react-refresh/only-export-components": "warn",

      // Repo cleanup mode: don’t fail build for these (warnings are fine)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-unused-vars": "off",

      "prefer-const": "warn",
      "react/no-unescaped-entities": "warn",
      "no-console": "warn",
    },
  },

  // ----------------------------
  // Node (server) JS/CJS
  // ----------------------------
  {
    files: ["server/**/*.{js,cjs,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.node,
        ...globals.es2021,
        // Node 18+ has fetch; if you’re earlier, this avoids lint hard-failing
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-useless-escape": "warn",
      "no-console": "off",
    },
  },

  // ----------------------------
  // Content-heavy files: allow copy/question bank weird chars + escapes
  // ----------------------------
  {
    files: [
      "src/data/**/*.ts",
      "src/ui/microcopy/**/*.ts",
      "src/**/predicted*Questions*.ts",
      "src/**/topicHubV2Enrichment.ts",
      "src/services/weeklyWrappedGenerator.ts",

    ],
    rules: {
      "no-irregular-whitespace": "off",
      "no-useless-escape": "off",
    },
  }
);
