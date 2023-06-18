/** @type {import("eslint").Linter.Config} */
const config = {
  extends: [
    "turbo",
    "prettier",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  parser: "@typescript-eslint/parser",
  rules: {},
  parserOptions: {},
  ignorePatterns: [
    "**/*.config.js",
    "**/*.config.cjs",
    ".eslintrc.cjs",
    "**/dist/**",
  ],
};

module.exports = config;
