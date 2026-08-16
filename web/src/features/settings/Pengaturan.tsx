import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BigButton, ErrorBox, PillBadge } from '../../components/ui'
import { ArrowLeft, ArrowRight, HardHat, LogOut, ShieldCheck } from 'lucide-react'

export default function Pengaturan() {
  const { user, switchRole, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function ganti(role: 'admin' | 'mandor') {
    if (role === user?.role) return
    setError(null)
    setLoading(true)
    const res = await switchRole(role)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    navigate(role === 'admin' ? '/admin' : '/mandor')
  }

  async function keluar() {
    await signOut()
    navigate('/login')
  }

  const tombol = (
    role: 'admin' | 'mandor',
    label: string,
    desc: string,
    IconComponent: typeof ShieldCheck,
  ) => {
    const aktif = user?.role === role
    return (
      <button
        onClick={() => ganti(role)}
        disabled={loading}
        className={`w-full rounded-2xl border p-4 text-left shadow-xs transition-all duration-150 active:scale-[0.99] disabled:opacity-60 ${
          aktif
            ? 'border-neutral-900 bg-neutral-900 text-white'
            : 'border-neutral-200/90 bg-white text-neutral-900 hover:border-neutral-300'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              aktif ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-800'
            }`}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight">{label}</span>
              {aktif && <PillBadge color="emerald">AKTIF</PillBadge>}
            </div>
            <div className={`text-xs ${aktif ? 'text-neutral-400' : 'text-neutral-500'}`}>{desc}</div>
          </div>
          {!aktif && <ArrowRight className="h-4 w-4 text-neutral-400" />}
        </div>
      </button>
    )
  }

  return (
    <div className="min-h-full bg-[#F5F5F5]">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200/80 bg-white/90 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold tracking-tight text-neutral-900">Pengaturan</span>
        <div className="w-9" />
      </header>

      <div className="mx-auto max-w-xl p-4 md:p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Ganti Mode Akun</h1>
          <p className="text-xs text-neutral-500">
            Login sebagai <b className="text-neutral-800">{user?.nama}</b>. Pilih mode untuk berpindah tanpa login ulang.
          </p>
        </div>

        <div className="space-y-2.5">
          {tombol('admin', 'Mode Admin / Pemilik', 'Kelola dashboard produksi, rekap gaji, dan master data.', ShieldCheck)}
          {tombol('mandor', 'Mode Mandor Lapangan', 'Input hasil produksi harian dan lihat riwayat.', HardHat)}
        </div>

        {error && <ErrorBox message={error} />}

        <div className="pt-2">
          <BigButton
            variant="ghost"
            className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
            onClick={keluar}
            disabled={loading}
          >
            <LogOut className="h-4 w-4 mr-1 text-rose-600" />
            Keluar dari Aplikasi
          </BigButton>
        </div>
      </div>
    </div>
  )
}
