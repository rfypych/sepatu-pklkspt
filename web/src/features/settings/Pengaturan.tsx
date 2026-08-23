import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { resetDatabase } from '../../lib/api'
import { BigButton, ConfirmModal, ErrorBox, HintBox, PillBadge, SuccessBox } from '../../components/ui'
import { ArrowLeft, Database, HardHat, LogOut, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react'

export default function Pengaturan() {
  const { user, switchRole, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [konfirmasiKeluar, setKonfirmasiKeluar] = useState(false)

  // Confirm Modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmLabel: string
    cancelLabel?: string
    isDestructive?: boolean
    action: () => Promise<void>
  } | null>(null)

  async function ganti(role: 'admin' | 'mandor') {
    if (role === user?.role) return
    setError(null)
    setSuccess(null)
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

  function promptResetProduksi() {
    setConfirmDialog({
      isOpen: true,
      title: 'Kosongkan catatan hasil kerja?',
      message:
        'Semua riwayat hasil kerja dan hitungan gaji akan kembali ke 0. Nama pekerja, model sepatu, dan nomor PO tetap aman.',
      confirmLabel: 'Ya, Kosongkan',
      cancelLabel: 'Tidak, Batal',
      isDestructive: true,
      action: async () => {
        setResetting(true)
        setError(null)
        setSuccess(null)
        try {
          const res = await resetDatabase('produksi_only')
          setSuccess(res.message || 'Semua catatan hasil kerja berhasil dikosongkan!')
        } catch (e) {
          setError((e as Error).message)
        } finally {
          setResetting(false)
          setConfirmDialog(null)
        }
      },
    })
  }

  function promptFactoryReset() {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus bersih semua data pabrik?',
      message:
        'PERHATIAN: semua nama pekerja, upah model sepatu, nomor PO, dan catatan hasil kerja akan dihapus permanen. Akun login Admin dan Mandor tetap ada.',
      confirmLabel: 'Ya, Hapus Semua',
      cancelLabel: 'Tidak, Batal',
      isDestructive: true,
      action: async () => {
        setResetting(true)
        setError(null)
        setSuccess(null)
        try {
          const res = await resetDatabase('factory_reset')
          setSuccess(res.message || 'Seluruh data pabrik berhasil dibersihkan total!')
        } catch (e) {
          setError((e as Error).message)
        } finally {
          setResetting(false)
          setConfirmDialog(null)
        }
      },
    })
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
        {success && <SuccessBox message={success} />}

        {/* ---------- Hapus data (khusus admin) ---------- */}
        {user?.role === 'admin' && (
          <div className="space-y-3 rounded-3xl border-2 border-rose-300 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-rose-300 bg-rose-100 text-rose-700">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                  Hapus Data Pabrik
                </h2>
                <p className="text-base font-medium text-slate-600">
                  Gunakan dengan hati-hati.
                </p>
              </div>
            </div>

            <HintBox>
              Data yang sudah dihapus <b>tidak bisa dikembalikan</b>. Sebaiknya simpan dulu laporan
              ke Excel sebelum menghapus.
            </HintBox>

            <div className="space-y-3">
              <div className="space-y-2.5 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
                <div className="text-lg font-extrabold text-amber-950">
                  1. Kosongkan Catatan Hasil Kerja
                </div>
                <p className="text-base font-medium leading-snug text-amber-900">
                  Semua catatan pasang sepatu dan gaji harian kembali ke 0. Nama pekerja, model
                  sepatu, dan nomor PO <b>tetap aman</b>.
                </p>
                <BigButton
                  variant="ghost"
                  className="w-full border-amber-500 bg-amber-200 text-amber-950"
                  onClick={promptResetProduksi}
                  disabled={resetting}
                >
                  <RotateCcw className="h-5 w-5" />
                  Kosongkan Catatan
                </BigButton>
              </div>

              <div className="space-y-2.5 rounded-2xl border-2 border-rose-400 bg-rose-50 p-4">
                <div className="text-lg font-extrabold text-rose-950">
                  2. Hapus Bersih Semua Data
                </div>
                <p className="text-base font-medium leading-snug text-rose-900">
                  Menghapus SEMUA data: nama pekerja, model sepatu, nomor PO, dan catatan kerja.
                  Mulai benar-benar dari nol.
                </p>
                <BigButton
                  variant="danger"
                  className="w-full"
                  onClick={promptFactoryReset}
                  disabled={resetting}
                >
                  <Trash2 className="h-5 w-5" />
                  Hapus Bersih Semua
                </BigButton>
              </div>
            </div>
          </div>
        )}

        <BigButton
          variant="ghost"
          size="lg"
          className="w-full border-rose-400 text-rose-700"
          onClick={() => setKonfirmasiKeluar(true)}
          disabled={loading || resetting}
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

      {confirmDialog && (
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          isDestructive={confirmDialog.isDestructive}
          onConfirm={() => confirmDialog.action()}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}
