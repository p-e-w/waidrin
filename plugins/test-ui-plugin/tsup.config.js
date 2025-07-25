import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["main.tsx"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  splitting: false,
  dts: false,
  platform: "browser",
  jsx: "react-jsx",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  external: ["react", "immer", "@radix-ui/themes", "react-icons/gi", "zustand/shallow"],
});