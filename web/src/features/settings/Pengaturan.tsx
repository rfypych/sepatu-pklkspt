import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BigButton, ConfirmModal, ErrorBox, PillBadge } from '../../components/ui'
import { ArrowLeft, HardHat, LogOut, ShieldCheck } from 'lucide-react'

export default function Pengaturan() {
  const { user, switchRole, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [konfirmasiKeluar, setKonfirmasiKeluar] = useState(false)

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
    setKonfirmasiKeluar(false)
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
        aria-pressed={aktif}
        className={`w-full rounded-3xl border-2 p-4 text-left shadow-sm transition-colors disabled:opacity-60 ${
          aktif
            ? 'border-slate-950 bg-slate-900 text-white'
            : 'border-slate-300 bg-white text-slate-900 active:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 ${
              aktif
                ? 'border-slate-700 bg-slate-800 text-white'
                : 'border-slate-300 bg-slate-100 text-slate-800'
            }`}
          >
            <IconComponent className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight">{label}</span>
              {aktif && <PillBadge color="emerald">Sedang dipakai</PillBadge>}
            </div>
            <div
              className={`mt-0.5 text-base font-medium leading-snug ${
                aktif ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {desc}
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="min-h-full bg-slate-100">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b-2 border-slate-300 bg-white px-3 py-3 sm:px-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-800 active:bg-slate-200"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-lg font-extrabold tracking-tight text-slate-900">Pengaturan</span>
        <div className="w-12" />
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-3 pb-10 sm:p-5">
        <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm sm:p-5">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Ganti Mode</h1>
          <p className="mt-0.5 text-base font-medium text-slate-600">
            Anda masuk sebagai <b className="text-slate-900">{user?.nama}</b>. Pilih mode di bawah
            untuk berpindah tanpa login ulang.
          </p>
        </div>

        <div className="space-y-3">
          {tombol(
            'admin',
            'Mode Admin',
            'Lihat hasil kerja, rekap gaji, dan atur master data.',
            ShieldCheck,
          )}
          {tombol(
            'mandor',
            'Mode Mandor',
            'Catat hasil kerja harian pekerja di lapangan.',
            HardHat,
          )}
        </div>

        {error && <ErrorBox message={error} />}

        <BigButton
          variant="ghost"
          size="lg"
          className="w-full border-rose-400 text-rose-700"
          onClick={() => setKonfirmasiKeluar(true)}
          disabled={loading}
        >
          <LogOut className="h-6 w-6" />
          Keluar dari Aplikasi
        </BigButton>
      </div>

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
