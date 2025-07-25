import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.tsx"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  splitting: false,
  dts: false, // Skip .d.ts generation for now
  platform: "browser", // Important for browser compatibility
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  noExternal: [/.*/], // Bundle all dependencies for self-contained plugin
});
