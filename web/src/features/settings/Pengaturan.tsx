import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { resetDatabase } from '../../lib/api'
import { BigButton, ConfirmModal, ErrorBox, PillBadge, SuccessBox } from '../../components/ui'
import {
  ArrowLeft,
  ArrowRight,
  Database,
  HardHat,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'

export default function Pengaturan() {
  const { user, switchRole, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)

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
    await signOut()
    navigate('/login')
  }

  function promptResetProduksi() {
    setConfirmDialog({
      isOpen: true,
      title: 'Kosongkan Catatan Hasil Kerja?',
      message:
        'Semua riwayat hasil produksi harian dan hitungan gaji akan dihapus kembali ke 0. Data master pekerja, model sepatu, dan nomor PO tetap aman tersimpan.',
      confirmLabel: 'Ya, Kosongkan Catatan',
      cancelLabel: 'Batal',
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
      title: 'Hapus Bersih Semua Data Pabrik?',
      message:
        'PERINGATAN: Semua data pekerja, tarif model sepatu, nomor PO, dan catatan hasil kerja akan dihapus permanen. Akun login Admin & Mandor tetap ada.',
      confirmLabel: 'Ya, Hapus Semua Data',
      cancelLabel: 'Batal',
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
        className={`w-full rounded-2xl border-2 p-4 text-left shadow-xs transition-all duration-150 active:scale-[0.99] disabled:opacity-60 ${
          aktif
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              aktif ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'
            }`}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight">{label}</span>
              {aktif && <PillBadge color="emerald">AKTIF</PillBadge>}
            </div>
            <div className={`text-xs ${aktif ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</div>
          </div>
          {!aktif && <ArrowRight className="h-4 w-4 text-slate-400" />}
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
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Ganti Mode Akun</h1>
          <p className="text-xs text-neutral-500">
            Login sebagai <b className="text-neutral-800">{user?.nama}</b>. Pilih mode untuk berpindah tanpa login ulang.
          </p>
        </div>

        <div className="space-y-2.5">
          {tombol('admin', 'Mode Admin / Pemilik', 'Kelola dashboard produksi, rekap gaji, dan master data.', ShieldCheck)}
          {tombol('mandor', 'Mode Mandor Lapangan', 'Input hasil produksi harian dan lihat riwayat.', HardHat)}
        </div>

        {/* Database Management Section (Admin Only) */}
        {user?.role === 'admin' && (
          <div className="rounded-3xl border-2 border-rose-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Hapus & Bersihkan Data Pabrik</h2>
                <p className="text-xs font-semibold text-slate-500">Pilihan untuk mengosongkan data lama atau mulai buku baru</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-amber-950">1. Kosongkan Catatan Hasil Kerja (Buku Baru)</div>
                  <div className="text-xs font-semibold text-amber-800 leading-snug mt-0.5">
                    Semua catatan pasang sepatu dan gaji harian akan dikosongkan (kembali ke 0). Nama pekerja, model sepatu, dan nomor PO <b>tetap aman</b>.
                  </div>
                </div>
                <button
                  onClick={promptResetProduksi}
                  disabled={resetting}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400 bg-amber-200/80 px-3.5 py-2 text-xs font-black text-amber-950 hover:bg-amber-300 active:bg-amber-400 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Kosongkan Catatan
                </button>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-rose-950">2. Hapus Bersih Semua Data (Mulai Pabrik Baru)</div>
                  <div className="text-xs font-semibold text-rose-800 leading-snug mt-0.5">
                    Menghapus SEMUA data termasuk nama pekerja, model sepatu, nomor PO, dan catatan kerja. Bersih total dari awal.
                  </div>
                </div>
                <button
                  onClick={promptFactoryReset}
                  disabled={resetting}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-black text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus Bersih Semua
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <ErrorBox message={error} />}
        {success && <SuccessBox message={success} />}

        <div className="pt-2">
          <BigButton
            variant="ghost"
            className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
            onClick={keluar}
            disabled={loading || resetting}
          >
            <LogOut className="h-4 w-4 mr-1 text-rose-600" />
            Keluar dari Aplikasi
          </BigButton>
        </div>
      </div>

      {/* In-App Confirmation Modal */}
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
