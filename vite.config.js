import { defineConfig, loadEnv } from "vite";
import process from "node:process";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseURL = env.VITE_API_BASE_URL;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5000,
      open: true,
      proxy: {
        "/auth": {
          target: apiBaseURL,
          changeOrigin: true,
          secure: false,
        },
        "/user": {
          target: apiBaseURL,
          changeOrigin: true,
          secure: false,
        },
        "/tracker": {
          target: apiBaseURL,
          changeOrigin: true,
          secure: false,
        },
        "/dropdown": {
          target: apiBaseURL,
          changeOrigin: true,
          secure: false,
        },
        "/project": {
          target: apiBaseURL,
          changeOrigin: true,
          secure: false,
        },
        "/task": {
          target: apiBaseURL,
          changeOrigin: true,
          secure: false,
        },
        "/dashboard": {
          target: apiBaseURL,
          changeOrigin: true,
          secure: false,
        },
        "/permission": {
          target: apiBaseURL,
          changeOrigin: true,
          secure: false,
        },
      },
      // Fix: Serve index.html for unknown routes (SPA fallback)
      middlewareMode: false,
      historyApiFallback: true,
    },
  };
});