"use strict";

module.exports = {
  "plugins"  : ["react-hooks", "jest", "jest-formatting"],
  "overrides": [
    {
      "files"        : ["*.{ts,tsx}"],
      "extends"      : ["@susisu/eslint-config/preset/ts-types", "plugin:react-hooks/recommended"],
      "parserOptions": {
        "ecmaVersion": 2019,
        "sourceType" : "module",
        "project"    : "./tsconfig.json",
      },
      "env": {
        "es6": true,
      },
    },
    {
      "files"  : ["*.{test,spec}.{ts,tsx}"],
      "extends": ["plugin:jest/recommended", "plugin:jest-formatting/recommended"],
      "env"    : {
        "jest/globals": true,
      },
    },
    {
      "files"        : ["*.js"],
      "extends"      : ["@susisu/eslint-config/preset/es"],
      "parserOptions": {
        "ecmaVersion": 2019,
        "sourceType" : "script",
      },
      "env": {
        "es6" : true,
        "node": true,
      },
    },
  ],
};
