import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Saat development, request ke /api diteruskan ke backend sehingga tidak ada masalah CORS.
  const target = env.VITE_PROXY_TARGET || "http://localhost:3000";
  return {
    plugins: [react()],
    server: {
      proxy: { "/api": { target, changeOrigin: true } },
    },
    test: {
      environment: "node",
      include: ["tests/**/*.test.{js,jsx}"],
      setupFiles: ["tests/setup.js"],
    },
  };
});
