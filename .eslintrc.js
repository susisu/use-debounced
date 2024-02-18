"use strict";

module.exports = {
  plugins: ["import", "react-hooks"],
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
