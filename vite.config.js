import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5000,
    open: true,
    proxy: {
      '/auth': {
        target: 'http://192.168.125.203:5000',
        changeOrigin: true,
        secure: false,
      },
      '/user': {
        target: 'http://192.168.125.203:5000',
        changeOrigin: true,
        secure: false,
      },
      '/tracker': {
        target: 'http://192.168.125.203:5000',
        changeOrigin: true,
        secure: false,
      },
      '/dropdown': {
        target: 'http://192.168.125.203:5000',
        changeOrigin: true,
        secure: false,
      },
      '/project': {
        target: 'http://192.168.125.203:5000',
        changeOrigin: true,
        secure: false,
      },
      '/task': {
        target: 'http://192.168.125.203:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  }
})