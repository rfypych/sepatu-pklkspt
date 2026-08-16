import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PenTool, Clock, HelpCircle, Settings, LogOut } from 'lucide-react'

export function LogoIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" className={className}>
      <path d="M 128.005 191.173 C 128.448 156.208 156.93 128 192 128 L 192 64 L 128 64 C 128 99.346 99.346 128 64 128 L 64 192 L 128 192 Z M 192 256 L 64 256 C 28.654 256 0 227.346 0 192 L 0 64 L 64 64 L 64 0 L 192 0 C 227.346 0 256 28.654 256 64 L 256 192 L 192 192 Z" />
    </svg>
  )
}

const navItems = [
  { to: '/mandor', label: 'Input Produksi', icon: PenTool, end: true },
  { to: '/mandor/riwayat', label: 'Riwayat Kerja', icon: Clock, end: false },
  { to: '/help', label: 'Bantuan', icon: HelpCircle, end: false },
]

export default function MandorLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function keluar() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-full flex-col bg-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b-2 border-slate-800 bg-slate-900 px-4 py-3 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-slate-900 text-xl font-bold shadow-xs">
            👷
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-white leading-tight">
              {user?.nama ?? 'Mandor'}
            </div>
            <div className="text-xs font-bold text-amber-300">Mandor Lapangan</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/pengaturan"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-600 border border-slate-700"
            title="Pengaturan & Ganti Akun"
          >
            <Settings className="h-5 w-5" />
          </NavLink>
          <button
            onClick={keluar}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-rose-700"
            title="Keluar / Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="mx-auto max-w-xl">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t-2 border-slate-300 bg-white px-3 py-2 shadow-2xl">
        <div className="mx-auto grid max-w-xl grid-cols-3 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 text-xs font-black tracking-tight transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md border-2 border-emerald-700 scale-[1.02]'
                      : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 border-2 border-transparent'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
