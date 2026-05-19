import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: [
        "src/shared/lib/canvas-engine/**",
        "src/shared/lib/editor/**",
        "src/shared/lib/validation/**",
        "src/shared/stores/**",
        "src/components/editor/**",
      ],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/react/**"],
    },
  },
});
