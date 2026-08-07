// Konfigurasi akses ke server API.
// Secara default memakai path relatif '/api' — Vite dev server akan meneruskan
// ke backend (lihat vite.config.ts). Jadi aplikasi jalan dari localhost maupun
// IP LAN tanpa perlu mengubah URL.
// Untuk production/deploy, isi VITE_API_URL dengan URL API absolut.
export const API_URL = import.meta.env.VITE_API_URL || '/api'

export function getToken(): string | null {
  return localStorage.getItem('sp_token')
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('sp_token', token)
  else localStorage.removeItem('sp_token')
}