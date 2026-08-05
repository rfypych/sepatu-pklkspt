// Konfigurasi akses ke server API lokal.
// Ganti VITE_API_URL bila server jalan di host/port lain.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export function getToken(): string | null {
  return localStorage.getItem('sp_token')
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('sp_token', token)
  else localStorage.removeItem('sp_token')
}