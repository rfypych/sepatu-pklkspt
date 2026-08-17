import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/produksi', label: 'Data Produksi', icon: ClipboardList, end: false },
  { to: '/admin/payroll', label: 'Rekap Gaji', icon: Coins, end: false },
  { to: '/admin/master', label: 'Master Data', icon: SlidersHorizontal, end: false },
  { to: '/admin/bantuan', label: 'Bantuan', icon: HelpCircle, end: false },
]

export default function AdminLayout() {
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
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white text-xl font-bold shadow-xs">
            👔
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-white leading-tight">
              {user?.nama ?? 'Admin'}
            </div>
            <div className="text-xs font-bold text-sky-300">Admin</div>
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
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t-2 border-slate-300 bg-white px-2 py-2 shadow-2xl">
        <div className="mx-auto grid max-w-4xl grid-cols-5 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-black tracking-tight transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md border-2 border-blue-700 scale-[1.02]'
                      : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 border-2 border-transparent'
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
