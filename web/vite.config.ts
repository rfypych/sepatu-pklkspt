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
      // Teruskan request /api ke backend serverless yang aktif di Vercel
      // atau ke http://localhost:3000 jika VITE_API_PROXY disetel lokal.
      '/api': {
        target: process.env.VITE_API_PROXY || 'https://server-eta-six-49.vercel.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'https://server-eta-six-49.vercel.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
