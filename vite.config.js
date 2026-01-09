import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5000,   // <-- Set your desired port here
    open: true,   // <-- Auto open browser on npm run dev
    proxy: {
      '/task': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Add more endpoints here if needed
    },
  }
})