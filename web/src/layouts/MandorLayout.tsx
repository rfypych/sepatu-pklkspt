import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/mandor', label: 'INPUT PRODUKSI', icon: '✏️' },
  { to: '/mandor/riwayat', label: 'RIWAYAT HARI INI', icon: '📋' },
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
      <header className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="text-xl">👟</span>
          <div>
            <div className="text-sm font-bold leading-tight">{user?.nama ?? 'Mandor'}</div>
            <div className="text-[11px] text-slate-400">Login sebagai Mandor</div>
          </div>
        </div>
        <button
          onClick={keluar}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold active:bg-white/20"
        >
          Keluar
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-white p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/mandor'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center rounded-xl py-3 text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 active:bg-slate-200'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
