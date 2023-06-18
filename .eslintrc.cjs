/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  // This tells ESLint to load the config from the package `eslint-config-custom`
  extends: ["@headless-alert"],
  settings: {
    next: {
      rootDir: ["apps/*/"],
    },
  },
};

module.exports = config;
