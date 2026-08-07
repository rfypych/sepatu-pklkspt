import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // bisa diakses dari perangkat lain di jaringan lokal (LAN)
    port: 5173,
    proxy: {
      // Frontend memakai /api (relative) → Vite teruskan ke backend lokal.
      // Ini membuat aplikasi jalan dari localhost maupun IP LAN tanpa CORS issue.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
