import { defineConfig, loadEnv } from "vite";
import process from "node:process";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseURL = "http://192.168.125.203:5000";

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
        "/password_reset": {
          target: apiBaseURL,
          changeOrigin: true,
          secure: false,
        },
        "/user_monthly_tracker": {
          target: apiBaseURL,
          changeOrigin: true,
          secure: false,
        },
        "/qc": {
          target: apiBaseURL,
          changeOrigin: true,
          secure: false,
        },
      },
      // Fix: Serve index.html for unknown routes (SPA fallback)
      historyApiFallback: true,
    },
  };
});