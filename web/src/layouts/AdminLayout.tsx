import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/produksi', label: 'Data Produksi', icon: '📝', end: false },
  { to: '/admin/rekap', label: 'Rekap Harian', icon: '📅', end: false },
  { to: '/admin/payroll', label: 'Payroll', icon: '💰', end: false },
  { to: '/admin/master', label: 'Master Data', icon: '⚙️', end: false },
  { to: '/help', label: 'Bantuan', icon: '🛟', end: false },
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
      <header className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="text-xl">👟</span>
          <div>
            <div className="text-sm font-bold leading-tight">{user?.nama ?? 'Admin'}</div>
            <div className="text-[11px] text-slate-400">Admin / Pemilik</div>
          </div>
        </div>
        <button
          onClick={keluar}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold active:bg-white/20"
        >
          Keluar
        </button>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 active:bg-slate-200'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
