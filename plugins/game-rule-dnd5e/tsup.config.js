import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.tsx"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  splitting: false,
  dts: false, // Skip .d.ts generation for now
  platform: "browser", // Important for browser compatibility
  jsx: "react-jsx",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  external: ["react", "immer", "@radix-ui/themes", "react-icons/gi", "zustand/shallow", "@dice-roller/rpg-dice-roller"],
});