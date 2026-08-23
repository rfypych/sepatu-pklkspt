import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ConfirmModal } from '../components/ui'
import OfflineBanner from '../components/OfflineBanner'
import { PenLine, Clock, HelpCircle, Settings, LogOut } from 'lucide-react'

export function LogoIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" className={className}>
      <path d="M 128.005 191.173 C 128.448 156.208 156.93 128 192 128 L 192 64 L 128 64 C 128 99.346 99.346 128 64 128 L 64 192 L 128 192 Z M 192 256 L 64 256 C 28.654 256 0 227.346 0 192 L 0 64 L 64 64 L 64 0 L 192 0 C 227.346 0 256 28.654 256 64 L 256 192 L 192 192 Z" />
    </svg>
  )
}

const navItems = [
  { to: '/mandor', label: 'Isi Data', icon: PenLine, end: true },
  { to: '/mandor/riwayat', label: 'Riwayat', icon: Clock, end: false },
  { to: '/mandor/bantuan', label: 'Bantuan', icon: HelpCircle, end: false },
]

export default function MandorLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [konfirmasiKeluar, setKonfirmasiKeluar] = useState(false)

  async function keluar() {
    setKonfirmasiKeluar(false)
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-full flex-col bg-slate-100">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-20 border-b-2 border-slate-950 bg-slate-900 px-3 py-3 text-white sm:px-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-2xl text-slate-900">
              👷
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-extrabold leading-tight tracking-tight">
                {user?.nama ?? 'Mandor'}
              </div>
              <div className="text-sm font-bold text-amber-300">Mandor Lapangan</div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <NavLink
              to="/pengaturan"
              aria-label="Pengaturan"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-700 bg-slate-800 text-slate-100 active:bg-slate-600"
            >
              <Settings className="h-6 w-6" />
            </NavLink>
            <button
              onClick={() => setKonfirmasiKeluar(true)}
              aria-label="Keluar dari aplikasi"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-rose-800 bg-rose-700 text-white active:bg-rose-900"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <OfflineBanner />

      {/* ---------- Isi halaman ---------- */}
      <main className="flex-1 overflow-y-auto px-3 pb-32 pt-4 sm:px-5 sm:pt-5">
        <div className="mx-auto max-w-2xl">
          <Outlet />
        </div>
      </main>

      {/* ---------- Menu bawah ---------- */}
      <nav
        className="pb-safe fixed bottom-0 left-0 right-0 z-30 border-t-2 border-slate-300 bg-white px-2 pt-2 shadow-[0_-4px_16px_rgba(15,23,42,0.10)]"
        aria-label="Menu utama"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-1 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-sm font-bold tracking-tight transition-colors ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'text-slate-600 active:bg-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={isActive ? 'h-7 w-7' : 'h-6 w-6'} strokeWidth={isActive ? 2.6 : 2} />
                    <span className={isActive ? 'font-extrabold' : ''}>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      <ConfirmModal
        isOpen={konfirmasiKeluar}
        title="Keluar dari aplikasi?"
        message="Anda harus mengetik username dan password lagi untuk masuk kembali."
        confirmLabel="Ya, Keluar"
        cancelLabel="Tidak, Tetap di Sini"
        isDestructive
        onConfirm={keluar}
        onCancel={() => setKonfirmasiKeluar(false)}
      />
    </div>
  )
}
