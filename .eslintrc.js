"use strict";

module.exports = {
  plugins: ["import", "react-hooks", "jest", "jest-formatting"],
  overrides: [
    {
      files: ["*.{ts,tsx}"],
      extends: [
        "@susisu/eslint-config/preset/ts",
        "plugin:eslint-comments/recommended",
        "plugin:import/typescript",
        "plugin:react-hooks/recommended",
        "prettier",
      ],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "./tsconfig.json",
      },
      env: {
        es6: true,
        browser: true,
      },
      rules: {
        "sort-imports": ["error", { ignoreDeclarationSort: true }],
        "eslint-comments/no-unused-disable": "error",
        "import/no-default-export": "error",
        "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
        "import/order": ["error", { alphabetize: { order: "asc" } }],
      },
    },
    {
      files: ["*.{test,spec}.{ts,tsx}", "src/**/__tests__/**/*.{ts,tsx}"],
      extends: ["plugin:jest/recommended", "plugin:jest-formatting/recommended"],
      env: {
        "jest/globals": true,
      },
      rules: {
        "@typescript-eslint/no-floating-promises": "off",
      },
    },
    {
      files: ["*.js"],
      extends: [
        "@susisu/eslint-config/preset/js",
        "plugin:eslint-comments/recommended",
        "prettier",
      ],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "script",
      },
      env: {
        es6: true,
        node: true,
      },
      rules: {
        "eslint-comments/no-unused-disable": "error",
      },
    },
  ],
};
