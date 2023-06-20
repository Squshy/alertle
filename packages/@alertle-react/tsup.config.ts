import { defineConfig } from "tsup";

export default defineConfig((_opts) => ({
  splitting: false,
  dts: true,
  format: ["esm"],
  entry: ["./src/index.ts", "./src/hooks.ts"],
  ignoreWatch: ["**/dist", "**/node_modules"],
}));
