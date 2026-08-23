import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ConfirmModal } from '../components/ui'
import {
  LayoutDashboard,
  ClipboardList,
  Coins,
  SlidersHorizontal,
  HelpCircle,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Beranda', icon: LayoutDashboard, end: true },
  { to: '/admin/produksi', label: 'Produksi', icon: ClipboardList, end: false },
  { to: '/admin/payroll', label: 'Gaji', icon: Coins, end: false },
  { to: '/admin/master', label: 'Master', icon: SlidersHorizontal, end: false },
  { to: '/admin/bantuan', label: 'Bantuan', icon: HelpCircle, end: false },
]

export default function AdminLayout() {
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
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-2xl text-white">
              👔
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-extrabold leading-tight tracking-tight">
                {user?.nama ?? 'Admin'}
              </div>
              <div className="text-sm font-bold text-sky-300">Admin Pabrik</div>
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

      {/* ---------- Isi halaman ---------- */}
      <main className="flex-1 overflow-y-auto px-3 pb-32 pt-4 sm:px-5 sm:pt-5">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>

      {/* ---------- Menu bawah ---------- */}
      <nav
        className="pb-safe fixed bottom-0 left-0 right-0 z-30 border-t-2 border-slate-300 bg-white px-1.5 pt-2 shadow-[0_-4px_16px_rgba(15,23,42,0.10)]"
        aria-label="Menu utama"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-5 gap-0.5 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1.5 text-[0.78rem] font-bold leading-none tracking-tight transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-900' : 'text-slate-600 active:bg-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={isActive ? 'h-7 w-7' : 'h-6 w-6'}
                      strokeWidth={isActive ? 2.6 : 2}
                    />
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
