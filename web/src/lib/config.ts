// Konfigurasi akses ke server API.
// Selalu memakai path relatif '/api' — diteruskan oleh proxy Vercel / Vite ke backend.
export const API_URL = '/api'

export function getToken(): string | null {
  return localStorage.getItem('sp_token')
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('sp_token', token)
  else localStorage.removeItem('sp_token')
}