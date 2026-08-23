import { useEffect, useState } from 'react'

export type ViewMode = 'kartu' | 'tabel'

/**
 * Menyimpan pilihan tampilan (tabel / kartu) per halaman ke localStorage,
 * supaya pengguna tidak perlu mengatur ulang setiap kali membuka menu.
 * DEFAULT: 'tabel' — daftar data selalu mulai sebagai tabel.
 *
 * Hook ini sengaja diletakkan di file terpisah (bukan di components/view.tsx)
 * agar file komponen hanya mengekspor komponen (syarat React Fast Refresh).
 */
export function useViewMode(pageKey: string, fallback: ViewMode = 'tabel') {
  const storageKey = `view_mode_${pageKey}`
  const [view, setView] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved === 'kartu' || saved === 'tabel') return saved
    } catch {
      // abaikan — localStorage bisa diblokir di mode privat
    }
    return fallback
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, view)
    } catch {
      // abaikan
    }
  }, [storageKey, view])

  return [view, setView] as const
}
