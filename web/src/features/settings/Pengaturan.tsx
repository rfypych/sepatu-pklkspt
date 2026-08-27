import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ErrorBox, PillBadge } from '../../components/ui'
import { ArrowLeft, HardHat, ShieldCheck, Shield } from 'lucide-react'

interface SystemStatus {
  client_name: string
  service_expiry: string
  service_tier: string
  days_remaining: number
  is_active: boolean
}

export default function Pengaturan() {
  const { user, switchRole } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Secret Developer tap counter
  const [tapCount, setTapCount] = useState(0)

  // System status
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)

  useEffect(() => {
    fetch('/api/system/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setSystemStatus(data)
      })
      .catch(() => {})
  }, [])

  function handleHeaderTap() {
    const next = tapCount + 1
    if (next >= 5) {
      setTapCount(0)
      navigate('/dev-console')
    } else {
      setTapCount(next)
      setTimeout(() => setTapCount(0), 3000)
    }
  }

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

  const formatTanggalIndo = (tglStr?: string) => {
    if (!tglStr) return '-'
    try {
      const d = new Date(tglStr)
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
      return tglStr
    }
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
        <button
          type="button"
          onClick={handleHeaderTap}
          className="select-none text-lg font-extrabold tracking-tight text-slate-900 active:opacity-75 focus:outline-none"
        >
          Pengaturan
        </button>
        <div className="w-12" />
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-3 pb-10 sm:p-5">
        {/* ---------- Switch Role Card ---------- */}
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

        {/* ---------- Status Layanan Server & Backup Card ---------- */}
        {systemStatus && (
          <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 ${
                  !systemStatus.is_active || systemStatus.days_remaining <= 0
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : systemStatus.days_remaining <= 7
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                }`}
              >
                <Shield className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                    Layanan Server & Brankas Data
                  </h2>
                  <PillBadge
                    color={
                      !systemStatus.is_active || systemStatus.days_remaining <= 0
                        ? 'rose'
                        : systemStatus.days_remaining <= 7
                        ? 'amber'
                        : 'emerald'
                    }
                  >
                    {!systemStatus.is_active || systemStatus.days_remaining <= 0
                      ? 'Masa Aktif Habis'
                      : systemStatus.days_remaining === 0
                      ? 'Jatuh Tempo Hari Ini'
                      : systemStatus.days_remaining <= 7
                      ? 'Segera Perpanjang'
                      : 'Aktif'}
                  </PillBadge>
                </div>
                <p className="text-xs font-semibold text-slate-500">{systemStatus.service_tier}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">Masa Aktif s/d:</span>
                <span className="font-extrabold text-slate-900">
                  {formatTanggalIndo(systemStatus.service_expiry)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">Sisa Waktu:</span>
                <span
                  className={`font-bold ${
                    !systemStatus.is_active || systemStatus.days_remaining <= 0
                      ? 'text-rose-700'
                      : systemStatus.days_remaining <= 7
                      ? 'text-amber-700 font-extrabold'
                      : 'text-emerald-700'
                  }`}
                >
                  {!systemStatus.is_active || systemStatus.days_remaining <= 0
                    ? 'Sudah Berakhir'
                    : `${systemStatus.days_remaining} Hari Lagi`}
                </span>
              </div>
            </div>

            {/* Warning Banner jika deadline sudah mepet (<= 7 hari) */}
            {systemStatus.days_remaining <= 7 && systemStatus.days_remaining > 0 && (
              <div className="mt-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                  <span>⚠️</span> Masa Aktif Layanan Segera Berakhir
                </div>
                <div className="mt-1 leading-relaxed text-amber-900 font-medium">
                  Masa aktif server dan sinkronisasi brankas data tersisa <b>{systemStatus.days_remaining} hari lagi</b>. Silakan hubungi pengembang / developer sistem untuk konfirmasi perpanjangan layanan.
                </div>
              </div>
            )}

            {/* Warning Banner jika masa aktif habis */}
            {(!systemStatus.is_active || systemStatus.days_remaining <= 0) && (
              <div className="mt-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-950">
                <div className="font-extrabold flex items-center gap-1.5 text-rose-900">
                  <span>🚨</span> Masa Aktif Layanan Telah Berakhir
                </div>
                <div className="mt-1 leading-relaxed text-rose-900 font-medium">
                  Masa aktif server telah jatuh tempo. Hubungi penyedia sistem / developer untuk memperbarui status langganan.
                </div>
              </div>
            )}

            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              * Data upah borongan dan produksi harian tersinkronisasi otomatis serta terlindungi di brankas server khusus.
            </p>
          </div>
        )}

        {error && <ErrorBox message={error} />}
      </div>
    </div>
  )
}
