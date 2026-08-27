import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { MasterPo, MasterUkuran, Pekerja, TipeSepatu } from '../../lib/types'
import {
  getPekerjaSemua,
  getTipeSepatuSemua,
  getUkuranSemua,
  getPoSemua,
  tambahPekerja,
  ubahPekerja,
  hapusPekerja,
  tambahModel,
  ubahTipeSepatu,
  hapusModel,
  tambahUkuran,
  ubahUkuran,
  hapusUkuran,
  tambahPo,
  ubahPo,
  hapusPo,
  getCache,
} from '../../lib/api'
import { formatAngka, formatRupiah, tanggalHariIni } from '../../lib/constants'
import {
  BigButton,
  Card,
  ConfirmModal,
  EmptyState,
  ErrorBox,
  FieldLabel,
  HintBox,
  Modal,
  PageTitle,
  PillBadge,
  SkeletonCard,
  StatCard,
  SuccessBox,
  TextInput,
} from '../../components/ui'
import { downloadExcelWorkbook } from '../../lib/laporan'
import PoProgress from '../../components/PoProgress'
import {
  ArrowUpDown,
  Download,
  Layers,
  Package,
  Pencil,
  Plus,
  Ruler,
  SlidersHorizontal,
  Trash2,
  User,
} from 'lucide-react'

type Tab = 'pekerja' | 'model' | 'ukuran' | 'po'

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'pekerja', label: 'Pekerja', icon: User },
  { id: 'model', label: 'Model', icon: Layers },
  { id: 'ukuran', label: 'Ukuran', icon: Ruler },
  { id: 'po', label: 'Pesanan', icon: Package },
]

export default function Master() {
  const [tab, setTab] = useState<Tab>('pekerja')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <PageTitle
        icon={<SlidersHorizontal className="h-6 w-6" />}
        title="Master Data"
        subtitle="Atur nama pekerja, model sepatu & upahnya, nomor ukuran, dan nomor pesanan (PO)."
      />

      {error && <ErrorBox message={error} />}
      {info && <SuccessBox message={info} />}

      {/* Tab navigasi */}
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="tablist"
        aria-label="Bagian master data"
      >
        {TABS.map((t) => {
          const Icon = t.icon
          const aktif = tab === t.id
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={aktif}
              onClick={() => {
                setTab(t.id)
                setError(null)
                setInfo(null)
              }}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-2 text-base font-bold transition-colors ${
                aktif
                  ? 'border-slate-950 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 active:bg-slate-100'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className={aktif ? 'font-extrabold' : ''}>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {tab === 'pekerja' && <TabPekerja setError={setError} setInfo={setInfo} />}
      {tab === 'model' && <TabModel setError={setError} setInfo={setInfo} />}
      {tab === 'ukuran' && <TabUkuran setError={setError} setInfo={setInfo} />}
      {tab === 'po' && <TabPo setError={setError} setInfo={setInfo} />}
    </div>
  )
}

function useList<T>(load: () => Promise<T[]>, setError: (m: string | null) => void, cacheKey?: string) {
  const [list, setList] = useState<T[]>(() => (cacheKey ? (getCache<T[]>(cacheKey) ?? []) : []))
  const [loading, setLoading] = useState(() => (cacheKey ? !getCache(cacheKey) : true))
  const reload = useCallback(async () => {
    try {
      const data = await load()
      setList(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [load, setError])

  useEffect(() => {
    reload()
  }, [reload])

  return { list, setList, loading, reload }
}

// ---------------- TAB PEKERJA ----------------
function TabPekerja({
  setError,
  setInfo,
}: {
  setError: (m: string | null) => void
  setInfo: (m: string | null) => void
}) {
  const { list, setList, loading, reload } = useList(getPekerjaSemua, setError, 'pekerja_semua')
  const [nama, setNama] = useState('')
  const [editingPekerja, setEditingPekerja] = useState<Pekerja | null>(null)
  const [editNama, setEditNama] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [hapusTarget, setHapusTarget] = useState<Pekerja | null>(null)
  const [sortBy, setSortBy] = useState<'nama_asc' | 'nama_desc' | 'status' | 'terbaru'>('nama_asc')

  const sortedList = [...list].sort((a, b) => {
    if (sortBy === 'nama_asc') return a.nama.localeCompare(b.nama)
    if (sortBy === 'nama_desc') return b.nama.localeCompare(a.nama)
    if (sortBy === 'status') {
      const aktifA = a.status_aktif === 1 || a.status_aktif === true ? 1 : 0
      const aktifB = b.status_aktif === 1 || b.status_aktif === true ? 1 : 0
      if (aktifA !== aktifB) return aktifB - aktifA
      return a.nama.localeCompare(b.nama)
    }
    return b.id_pekerja - a.id_pekerja
  })

  async function tambah(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim()) return
    try {
      await tambahPekerja(nama.trim())
      setNama('')
      setInfo(`Pekerja "${nama.trim()}" berhasil ditambahkan.`)
      await reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function toggle(p: Pekerja) {
    const nextVal = p.status_aktif === 1 || p.status_aktif === true ? false : true
    setList((prev) =>
      prev.map((x) => (x.id_pekerja === p.id_pekerja ? { ...x, status_aktif: nextVal } : x)),
    )
    try {
      await ubahPekerja(p.id_pekerja, { status_aktif: nextVal })
      await reload()
    } catch (err) {
      setList((prev) =>
        prev.map((x) => (x.id_pekerja === p.id_pekerja ? { ...x, status_aktif: p.status_aktif } : x)),
      )
      setError((err as Error).message)
    }
  }

  function mulaiEdit(p: Pekerja) {
    setEditingPekerja(p)
    setEditNama(p.nama)
  }

  async function simpanEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingPekerja || !editNama.trim()) return
    setSavingEdit(true)
    try {
      await ubahPekerja(editingPekerja.id_pekerja, { nama: editNama.trim() })
      setList((prev) =>
        prev.map((x) => (x.id_pekerja === editingPekerja.id_pekerja ? { ...x, nama: editNama.trim() } : x)),
      )
      setInfo(`Nama pekerja berhasil diubah menjadi "${editNama.trim()}".`)
      setEditingPekerja(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSavingEdit(false)
    }
  }

  async function onHapusPekerja(p: Pekerja) {
    setHapusTarget(null)
    const prevList = [...list]
    setList((prev) => prev.filter((x) => x.id_pekerja !== p.id_pekerja))
    try {
      await hapusPekerja(p.id_pekerja)
      setInfo(`Pekerja "${p.nama}" berhasil dihapus.`)
      await reload()
    } catch (err) {
      setList(prevList)
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <form onSubmit={tambah} className="space-y-3">
          <FieldLabel htmlFor="pekerja-nama">Tambah pekerja baru</FieldLabel>
          <TextInput
            id="pekerja-nama"
            placeholder="Ketik nama pekerja"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
          <BigButton type="submit" variant="primary" className="w-full" disabled={!nama.trim()}>
            <Plus className="h-6 w-6" />
            Tambah Pekerja
          </BigButton>
        </form>
      </Card>

      <HintBox>
        Data pekerja bisa diubah, dinonaktifkan, atau <b>dihapus</b>. Jika pekerja sudah memiliki catatan produksi lama, sistem otomatis mengarsipkan data agar histori laporan upah tetap aman.
      </HintBox>

      {loading && list.length === 0 ? (
        <div className="space-y-2.5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<User className="h-8 w-8" />}
          title="Belum ada pekerja"
          description="Ketik nama pekerja di kotak di atas, lalu tekan Tambah Pekerja."
        />
      ) : (
        <div className="space-y-2.5">
          {/* Bar Urutkan */}
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-bold text-slate-500">
              Total {list.length} Pekerja
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <label htmlFor="sort-pekerja" className="font-semibold text-slate-600">Urutkan:</label>
              <select
                id="sort-pekerja"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="nama_asc">Nama (A - Z)</option>
                <option value="nama_desc">Nama (Z - A)</option>
                <option value="status">Status (Aktif Dulu)</option>
                <option value="terbaru">Terbaru Ditambahkan</option>
              </select>
            </div>
          </div>

          {sortedList.map((p) => (
            <Card key={p.id_pekerja}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-300 bg-slate-100 text-slate-700">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`truncate text-lg font-extrabold ${
                        p.status_aktif ? 'text-slate-900' : 'text-slate-400 line-through'
                      }`}
                    >
                      {p.nama}
                    </div>
                    <PillBadge color={p.status_aktif ? 'emerald' : 'neutral'}>
                      {p.status_aktif ? 'Aktif' : 'Nonaktif'}
                    </PillBadge>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <BigButton
                    size="sm"
                    variant="ghost"
                    onClick={() => mulaiEdit(p)}
                    className="px-3"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>Edit</span>
                  </BigButton>
                  <BigButton
                    size="sm"
                    variant={p.status_aktif ? 'ghost' : 'primary'}
                    onClick={() => toggle(p)}
                  >
                    {p.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </BigButton>
                  <button
                    onClick={() => setHapusTarget(p)}
                    aria-label={`Hapus pekerja ${p.nama}`}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-rose-400 bg-rose-50 text-rose-700 active:bg-rose-200"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Edit Pekerja */}
      <Modal
        isOpen={editingPekerja !== null}
        onClose={() => setEditingPekerja(null)}
        title="Edit Nama Pekerja"
      >
        {editingPekerja && (
          <form onSubmit={simpanEdit} className="space-y-4">
            <div>
              <FieldLabel htmlFor="edit-pekerja-nama">Nama Pekerja</FieldLabel>
              <TextInput
                id="edit-pekerja-nama"
                placeholder="Nama pekerja"
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-slate-100">
              <BigButton
                type="button"
                variant="ghost"
                onClick={() => setEditingPekerja(null)}
                disabled={savingEdit}
              >
                Batal
              </BigButton>
              <BigButton
                type="submit"
                variant="primary"
                disabled={savingEdit || !editNama.trim()}
              >
                {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </BigButton>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Konfirmasi Hapus Pekerja */}
      <ConfirmModal
        isOpen={hapusTarget !== null}
        title={`Hapus Pekerja "${hapusTarget?.nama ?? ''}"?`}
        message="Pekerja ini akan dihapus dari daftar master. Jika pekerja memiliki catatan kerja masa lalu, data historis tetap aman."
        confirmLabel="Ya, Hapus"
        cancelLabel="Tidak, Batal"
        isDestructive
        onConfirm={() => hapusTarget && onHapusPekerja(hapusTarget)}
        onCancel={() => setHapusTarget(null)}
      />
    </div>
  )
}

// ---------------- TAB MODEL ----------------
function TabModel({
  setError,
  setInfo,
}: {
  setError: (m: string | null) => void
  setInfo: (m: string | null) => void
}) {
  const { list, setList, loading, reload } = useList(getTipeSepatuSemua, setError, 'tipe_sepatu_semua')
  const [nama, setNama] = useState('')
  const [ongkos, setOngkos] = useState('')
  const [editingModel, setEditingModel] = useState<TipeSepatu | null>(null)
  const [editNamaModel, setEditNamaModel] = useState('')
  const [editOngkosModel, setEditOngkosModel] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [hapusTarget, setHapusTarget] = useState<TipeSepatu | null>(null)
  const [sortBy, setSortBy] = useState<'nama_asc' | 'nama_desc' | 'upah_desc' | 'upah_asc' | 'status'>('nama_asc')

  const sortedList = [...list].sort((a, b) => {
    if (sortBy === 'nama_asc') return a.nama_model.localeCompare(b.nama_model)
    if (sortBy === 'nama_desc') return b.nama_model.localeCompare(a.nama_model)
    if (sortBy === 'upah_desc') return (Number(b.ongkos_kerja) || 0) - (Number(a.ongkos_kerja) || 0)
    if (sortBy === 'upah_asc') return (Number(a.ongkos_kerja) || 0) - (Number(b.ongkos_kerja) || 0)
    if (sortBy === 'status') {
      const aktifA = a.status_aktif === 1 || a.status_aktif === true ? 1 : 0
      const aktifB = b.status_aktif === 1 || b.status_aktif === true ? 1 : 0
      if (aktifA !== aktifB) return aktifB - aktifA
      return a.nama_model.localeCompare(b.nama_model)
    }
    return a.nama_model.localeCompare(b.nama_model)
  })

  async function tambah(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim()) return
    try {
      await tambahModel(nama.trim(), Number(ongkos) || 0)
      setNama('')
      setOngkos('')
      setInfo(`Model "${nama.trim()}" berhasil ditambahkan.`)
      await reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function simpanHarga(m: TipeSepatu) {
    try {
      await ubahTipeSepatu(m.id_sepatu, { ongkos_kerja: m.ongkos_kerja })
      setError(null)
      setInfo(
        `Upah model "${m.nama_model}" berhasil disimpan (${formatRupiah(m.ongkos_kerja)}). Berlaku untuk catatan baru.`,
      )
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function toggle(m: TipeSepatu) {
    const nextVal = m.status_aktif === 1 || m.status_aktif === true ? false : true
    setList((prev) =>
      prev.map((x) => (x.id_sepatu === m.id_sepatu ? { ...x, status_aktif: nextVal } : x)),
    )
    try {
      await ubahTipeSepatu(m.id_sepatu, { status_aktif: nextVal })
      await reload()
    } catch (err) {
      setList((prev) =>
        prev.map((x) => (x.id_sepatu === m.id_sepatu ? { ...x, status_aktif: m.status_aktif } : x)),
      )
      setError((err as Error).message)
    }
  }

  function mulaiEdit(m: TipeSepatu) {
    setEditingModel(m)
    setEditNamaModel(m.nama_model)
    setEditOngkosModel(String(m.ongkos_kerja || 0))
  }

  async function simpanEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingModel || !editNamaModel.trim()) return
    setSavingEdit(true)
    const ongkosNum = Number(editOngkosModel) || 0
    try {
      await ubahTipeSepatu(editingModel.id_sepatu, {
        nama_model: editNamaModel.trim(),
        ongkos_kerja: ongkosNum,
      })
      setList((prev) =>
        prev.map((x) =>
          x.id_sepatu === editingModel.id_sepatu
            ? { ...x, nama_model: editNamaModel.trim(), ongkos_kerja: ongkosNum }
            : x,
        ),
      )
      setInfo(`Model "${editNamaModel.trim()}" berhasil diperbarui.`)
      setEditingModel(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSavingEdit(false)
    }
  }

  async function onHapusModel(m: TipeSepatu) {
    setHapusTarget(null)
    const prevList = [...list]
    setList((prev) => prev.filter((x) => x.id_sepatu !== m.id_sepatu))
    try {
      await hapusModel(m.id_sepatu)
      setInfo(`Model "${m.nama_model}" berhasil dihapus.`)
      await reload()
    } catch (err) {
      setList(prevList)
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <form onSubmit={tambah} className="space-y-3">
          <FieldLabel htmlFor="model-nama">Tambah model sepatu baru</FieldLabel>
          <TextInput
            id="model-nama"
            placeholder="Nama model (contoh: Futsal)"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
          <div>
            <FieldLabel htmlFor="model-ongkos">Upah per pasang (Rp)</FieldLabel>
            <TextInput
              id="model-ongkos"
              placeholder="contoh: 1200"
              inputMode="numeric"
              value={ongkos}
              onChange={(e) => setOngkos(e.target.value.replace(/[^\d]/g, ''))}
            />
          </div>
          <BigButton type="submit" variant="primary" className="w-full" disabled={!nama.trim()}>
            <Plus className="h-6 w-6" />
            Tambah Model
          </BigButton>
        </form>
      </Card>

      <HintBox>
        Mengubah upah hanya berlaku untuk catatan <b>baru</b>. Gaji periode lalu tidak akan berubah. Model yang dihapus akan otomatis diarsipkan jika memiliki catatan riwayat produksi.
      </HintBox>

      {loading && list.length === 0 ? (
        <div className="space-y-2.5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-8 w-8" />}
          title="Belum ada model sepatu"
          description="Isi nama model dan upah per pasang di kotak di atas."
        />
      ) : (
        <div className="space-y-2.5">
          {/* Bar Urutkan */}
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-bold text-slate-500">
              Total {list.length} Model
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <label htmlFor="sort-model" className="font-semibold text-slate-600">Urutkan:</label>
              <select
                id="sort-model"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="nama_asc">Nama Model (A - Z)</option>
                <option value="nama_desc">Nama Model (Z - A)</option>
                <option value="upah_desc">Upah Tertinggi</option>
                <option value="upah_asc">Upah Terendah</option>
                <option value="status">Status (Aktif Dulu)</option>
              </select>
            </div>
          </div>

          {sortedList.map((m) => (
            <Card key={m.id_sepatu}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-100 pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-300 bg-slate-100 text-slate-700">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`truncate text-lg font-extrabold ${
                        m.status_aktif ? 'text-slate-900' : 'text-slate-400 line-through'
                      }`}
                    >
                      {m.nama_model}
                    </div>
                    <PillBadge color={m.status_aktif ? 'emerald' : 'neutral'}>
                      {m.status_aktif ? 'Aktif' : 'Nonaktif'}
                    </PillBadge>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <BigButton
                    size="sm"
                    variant="ghost"
                    onClick={() => mulaiEdit(m)}
                    className="px-3"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>Edit</span>
                  </BigButton>
                  <BigButton
                    size="sm"
                    variant={m.status_aktif ? 'ghost' : 'primary'}
                    onClick={() => toggle(m)}
                  >
                    {m.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </BigButton>
                  <button
                    onClick={() => setHapusTarget(m)}
                    aria-label={`Hapus model ${m.nama_model}`}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-rose-400 bg-rose-50 text-rose-700 active:bg-rose-200"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <FieldLabel htmlFor={`upah-${m.id_sepatu}`}>
                  Upah per pasang — sekarang {formatRupiah(m.ongkos_kerja)}
                </FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  <TextInput
                    id={`upah-${m.id_sepatu}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={m.ongkos_kerja}
                    onChange={(e) =>
                      setList((prev) =>
                        prev.map((x) =>
                          x.id_sepatu === m.id_sepatu
                            ? { ...x, ongkos_kerja: Number(e.target.value) || 0 }
                            : x,
                        ),
                      )
                    }
                    className="w-40"
                  />
                  <BigButton variant="dark" onClick={() => simpanHarga(m)}>
                    Simpan Upah
                  </BigButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Edit Model */}
      <Modal
        isOpen={editingModel !== null}
        onClose={() => setEditingModel(null)}
        title="Edit Model Sepatu"
      >
        {editingModel && (
          <form onSubmit={simpanEdit} className="space-y-4">
            <div>
              <FieldLabel htmlFor="edit-model-nama">Nama Model</FieldLabel>
              <TextInput
                id="edit-model-nama"
                placeholder="Nama model"
                value={editNamaModel}
                onChange={(e) => setEditNamaModel(e.target.value)}
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="edit-model-ongkos">Upah per pasang (Rp)</FieldLabel>
              <TextInput
                id="edit-model-ongkos"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="contoh: 1200"
                value={editOngkosModel}
                onChange={(e) => setEditOngkosModel(e.target.value.replace(/[^\d]/g, ''))}
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-slate-100">
              <BigButton
                type="button"
                variant="ghost"
                onClick={() => setEditingModel(null)}
                disabled={savingEdit}
              >
                Batal
              </BigButton>
              <BigButton
                type="submit"
                variant="primary"
                disabled={savingEdit || !editNamaModel.trim()}
              >
                {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </BigButton>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Konfirmasi Hapus Model */}
      <ConfirmModal
        isOpen={hapusTarget !== null}
        title={`Hapus Model "${hapusTarget?.nama_model ?? ''}"?`}
        message="Model ini akan dihapus dari daftar master. Jika model ini memiliki catatan produksi lama, data historis tetap aman tersimpan."
        confirmLabel="Ya, Hapus"
        cancelLabel="Tidak, Batal"
        isDestructive
        onConfirm={() => hapusTarget && onHapusModel(hapusTarget)}
        onCancel={() => setHapusTarget(null)}
      />
    </div>
  )
}

// ---------------- TAB UKURAN ----------------
function TabUkuran({
  setError,
  setInfo,
}: {
  setError: (m: string | null) => void
  setInfo: (m: string | null) => void
}) {
  const { list, setList, loading, reload } = useList(getUkuranSemua, setError, 'ukuran_semua')
  const [label, setLabel] = useState('')
  const [hapusTarget, setHapusTarget] = useState<MasterUkuran | null>(null)
  const [sortBy, setSortBy] = useState<'nomor_asc' | 'nomor_desc' | 'status' | 'default'>('nomor_asc')

  const sortedList = [...list].sort((a, b) => {
    const numA = Number(a.label_ukuran)
    const numB = Number(b.label_ukuran)
    const isNumA = !isNaN(numA)
    const isNumB = !isNaN(numB)

    if (sortBy === 'nomor_asc') {
      if (isNumA && isNumB) return numA - numB
      return String(a.label_ukuran).localeCompare(String(b.label_ukuran))
    }
    if (sortBy === 'nomor_desc') {
      if (isNumA && isNumB) return numB - numA
      return String(b.label_ukuran).localeCompare(String(a.label_ukuran))
    }
    if (sortBy === 'status') {
      const aktifA = a.status_aktif === 1 || a.status_aktif === true ? 1 : 0
      const aktifB = b.status_aktif === 1 || b.status_aktif === true ? 1 : 0
      if (aktifA !== aktifB) return aktifB - aktifA
      if (isNumA && isNumB) return numA - numB
      return String(a.label_ukuran).localeCompare(String(b.label_ukuran))
    }
    return Number(a.urutan || 0) - Number(b.urutan || 0)
  })

  async function tambah(e: FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    try {
      await tambahUkuran(label.trim())
      setLabel('')
      setInfo(`Ukuran "${label.trim()}" berhasil ditambahkan.`)
      await reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function toggle(u: MasterUkuran) {
    const nextVal = u.status_aktif === 1 || u.status_aktif === true ? false : true
    setList((prev) =>
      prev.map((x) => (x.id_ukuran === u.id_ukuran ? { ...x, status_aktif: nextVal } : x)),
    )
    try {
      await ubahUkuran(u.id_ukuran, nextVal)
      await reload()
    } catch (err) {
      setList((prev) =>
        prev.map((x) => (x.id_ukuran === u.id_ukuran ? { ...x, status_aktif: u.status_aktif } : x)),
      )
      setError((err as Error).message)
    }
  }

  async function onHapusUkuran(u: MasterUkuran) {
    setHapusTarget(null)
    const prevList = [...list]
    setList((prev) => prev.filter((x) => x.id_ukuran !== u.id_ukuran))
    try {
      await hapusUkuran(u.id_ukuran)
      setInfo(`Ukuran "${u.label_ukuran}" berhasil dihapus.`)
      await reload()
    } catch (err) {
      setList(prevList)
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <form onSubmit={tambah} className="space-y-3">
          <FieldLabel htmlFor="ukuran-baru">Tambah nomor ukuran baru</FieldLabel>
          <TextInput
            id="ukuran-baru"
            placeholder="contoh: 45"
            inputMode="numeric"
            value={label}
            onChange={(e) => setLabel(e.target.value.replace(/[^\d]/g, ''))}
          />
          <BigButton type="submit" variant="primary" className="w-full" disabled={!label.trim()}>
            <Plus className="h-6 w-6" />
            Tambah Ukuran
          </BigButton>
        </form>
      </Card>

      <HintBox>
        Nomor berwarna <b>hitam</b> = aktif di form mandor. Ketuk tombol status untuk mengaktifkan/menonaktifkan, atau klik ikon tong sampah untuk <b>menghapus</b> ukuran.
      </HintBox>

      {loading && list.length === 0 ? (
        <SkeletonCard />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Ruler className="h-8 w-8" />}
          title="Belum ada nomor ukuran"
          description="Tambahkan nomor ukuran sepatu (contoh 36 sampai 44) di kotak di atas."
        />
      ) : (
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              Daftar Nomor Ukuran ({list.length})
            </h2>

            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <label htmlFor="sort-ukuran" className="font-semibold text-slate-600">Urutkan:</label>
              <select
                id="sort-ukuran"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="nomor_asc">Kecil ke Besar</option>
                <option value="nomor_desc">Besar ke Kecil</option>
                <option value="status">Aktif Dulu</option>
                <option value="default">Urutan Input</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {sortedList.map((u) => (
              <div
                key={u.id_ukuran}
                className={`flex flex-col items-center justify-between gap-2 rounded-2xl border-2 p-3 transition-colors ${
                  u.status_aktif
                    ? 'border-slate-950 bg-slate-900 text-white'
                    : 'border-slate-300 bg-slate-100 text-slate-500'
                }`}
              >
                <div className="text-2xl font-black">{u.label_ukuran}</div>
                <div className="flex w-full items-center justify-center gap-1.5 pt-1 border-t border-slate-700/40">
                  <button
                    type="button"
                    onClick={() => toggle(u)}
                    className={`rounded-lg px-2 py-1 text-xs font-bold transition-colors ${
                      u.status_aktif
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-slate-300 text-slate-800 hover:bg-slate-400'
                    }`}
                  >
                    {u.status_aktif ? 'Aktif' : 'Off'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHapusTarget(u)}
                    aria-label={`Hapus ukuran ${u.label_ukuran}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal Konfirmasi Hapus Ukuran */}
      <ConfirmModal
        isOpen={hapusTarget !== null}
        title={`Hapus Ukuran "${hapusTarget?.label_ukuran ?? ''}"?`}
        message="Nomor ukuran ini akan dihapus dari daftar master. Jika nomor ukuran ini memiliki catatan produksi lama, data historis tetap aman."
        confirmLabel="Ya, Hapus"
        cancelLabel="Tidak, Batal"
        isDestructive
        onConfirm={() => hapusTarget && onHapusUkuran(hapusTarget)}
        onCancel={() => setHapusTarget(null)}
      />
    </div>
  )
}

// ---------------- TAB PO ----------------
function TabPo({
  setError,
  setInfo,
}: {
  setError: (m: string | null) => void
  setInfo: (m: string | null) => void
}) {
  const { list, setList, loading, reload } = useList(getPoSemua, setError, 'po_semua')
  const [noPo, setNoPo] = useState('')
  const [customer, setCustomer] = useState('')
  const [target, setTarget] = useState('')

  // State untuk Modal Edit PO
  const [editingPo, setEditingPo] = useState<MasterPo | null>(null)
  const [editForm, setEditForm] = useState({ no_po: '', nama_customer: '', target_qty: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  // State untuk Hapus PO
  const [hapusTarget, setHapusTarget] = useState<MasterPo | null>(null)
  const [sortBy, setSortBy] = useState<'po_asc' | 'po_desc' | 'target_desc' | 'progress_desc' | 'status'>('po_asc')

  const sortedList = [...list].sort((a, b) => {
    if (sortBy === 'po_asc') return a.no_po.localeCompare(b.no_po)
    if (sortBy === 'po_desc') return b.no_po.localeCompare(a.no_po)
    if (sortBy === 'target_desc') return (b.target_qty || 0) - (a.target_qty || 0)
    if (sortBy === 'progress_desc') return (b.achieved_qty || 0) - (a.achieved_qty || 0)
    if (sortBy === 'status') {
      const aktifA = a.status_aktif === 1 || a.status_aktif === true ? 1 : 0
      const aktifB = b.status_aktif === 1 || b.status_aktif === true ? 1 : 0
      if (aktifA !== aktifB) return aktifB - aktifA
      return a.no_po.localeCompare(b.no_po)
    }
    return a.no_po.localeCompare(b.no_po)
  })

  async function tambah(e: FormEvent) {
    e.preventDefault()
    if (!noPo.trim()) return
    try {
      await tambahPo(noPo.trim(), customer.trim(), Number(target) || 0)
      setNoPo('')
      setCustomer('')
      setTarget('')
      setInfo(`PO "${noPo.trim()}" berhasil ditambahkan.`)
      await reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function mulaiEdit(p: MasterPo) {
    setEditingPo(p)
    setEditForm({
      no_po: p.no_po,
      nama_customer: p.nama_customer ?? '',
      target_qty: String(p.target_qty || 0),
    })
  }

  async function simpanEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingPo) return
    const no_po = editForm.no_po.trim()
    if (!no_po) {
      setError('Nomor PO tidak boleh kosong.')
      return
    }
    const nama_customer = editForm.nama_customer.trim()
    const target_qty = Math.max(0, Math.floor(Number(editForm.target_qty) || 0))

    setSavingEdit(true)
    try {
      await ubahPo(editingPo.id_po, { no_po, nama_customer, target_qty })
      setList((prev) =>
        prev.map((x) =>
          x.id_po === editingPo.id_po
            ? { ...x, no_po, nama_customer: nama_customer || null, target_qty }
            : x,
        ),
      )
      setInfo(`Perubahan PO "${no_po}" berhasil disimpan.`)
      setEditingPo(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSavingEdit(false)
    }
  }

  async function toggle(p: MasterPo) {
    const nextVal = p.status_aktif === 1 || p.status_aktif === true ? false : true
    setList((prev) =>
      prev.map((x) => (x.id_po === p.id_po ? { ...x, status_aktif: nextVal } : x)),
    )
    try {
      await ubahPo(p.id_po, { status_aktif: nextVal })
      await reload()
    } catch (err) {
      setList((prev) =>
        prev.map((x) => (x.id_po === p.id_po ? { ...x, status_aktif: p.status_aktif } : x)),
      )
      setError((err as Error).message)
    }
  }

  async function onHapusPo(p: MasterPo) {
    setHapusTarget(null)
    const prevList = [...list]
    setList((prev) => prev.filter((x) => x.id_po !== p.id_po))
    try {
      await hapusPo(p.id_po)
      setInfo(`PO "${p.no_po}" berhasil dihapus.`)
      await reload()
    } catch (err) {
      setList(prevList)
      setError((err as Error).message)
    }
  }

  const totalTarget = list.reduce((a, p) => a + p.target_qty, 0)
  const totalTerisi = list.reduce((a, p) => a + p.achieved_qty, 0)

  async function exportExcel() {
    const XLSX = await import('xlsx')
    const rows = list.map((p) => {
      const sisa = Math.max(0, p.target_qty - p.achieved_qty)
      const lunas = p.target_qty > 0 && sisa === 0
      return {
        'No PO': p.no_po,
        Customer: p.nama_customer ?? '',
        'Target (pasang)': p.target_qty,
        'Terisi (pasang)': p.achieved_qty,
        'Sisa (pasang)': sisa,
        Status: p.target_qty > 0 ? (lunas ? 'LUNAS' : 'Berjalan') : 'Belum ada target',
      }
    })
    rows.push({
      'No PO': 'TOTAL',
      Customer: '',
      'Target (pasang)': totalTarget,
      'Terisi (pasang)': totalTerisi,
      'Sisa (pasang)': Math.max(0, totalTarget - totalTerisi),
      Status: '',
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'PO')
    downloadExcelWorkbook(XLSX, wb, `laporan-po-${tanggalHariIni()}.xlsx`)
  }

  return (
    <div className="space-y-3">
      {/* Ringkasan semua PO */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          tone="slate"
          icon={<Package className="h-5 w-5" />}
          label="Jumlah PO"
          value={String(list.length)}
          unit="PO"
        />
        <StatCard
          tone="emerald"
          label="Sudah Dikerjakan"
          value={`${formatAngka(totalTerisi)} / ${formatAngka(totalTarget)}`}
          hint={
            totalTarget > 0
              ? `${Math.round((totalTerisi / totalTarget) * 100)}% dari semua target`
              : 'Belum ada target'
          }
        />
      </div>

      {list.length > 0 && (
        <BigButton variant="dark" className="w-full" onClick={exportExcel}>
          <Download className="h-6 w-6" />
          Simpan Daftar PO ke Excel
        </BigButton>
      )}

      {/* Tambah PO */}
      <Card>
        <form onSubmit={tambah} className="space-y-3">
          <FieldLabel htmlFor="po-no">Tambah nomor pesanan (PO)</FieldLabel>
          <TextInput
            id="po-no"
            placeholder="Nomor PO (contoh: PO-2026-001)"
            value={noPo}
            onChange={(e) => setNoPo(e.target.value)}
          />
          <div>
            <FieldLabel htmlFor="po-cust">Nama customer (boleh dikosongkan)</FieldLabel>
            <TextInput
              id="po-cust"
              placeholder="contoh: Toko Maju"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="po-tgt">Target jumlah (pasang)</FieldLabel>
            <TextInput
              id="po-tgt"
              placeholder="contoh: 500"
              inputMode="numeric"
              value={target}
              onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ''))}
            />
          </div>
          <BigButton type="submit" variant="primary" className="w-full" disabled={!noPo.trim()}>
            <Plus className="h-6 w-6" />
            Tambah PO
          </BigButton>
        </form>
      </Card>

      {/* Daftar PO */}
      {loading && list.length === 0 ? (
        <div className="space-y-2.5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Belum ada nomor PO"
          description="Isi nomor PO dan target jumlah di kotak di atas."
        />
      ) : (
        <div className="space-y-2.5">
          {/* Bar Urutkan */}
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-bold text-slate-500">
              Total {list.length} PO
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <label htmlFor="sort-po" className="font-semibold text-slate-600">Urutkan:</label>
              <select
                id="sort-po"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="po_asc">Nomor PO (A - Z)</option>
                <option value="po_desc">Nomor PO (Z - A)</option>
                <option value="target_desc">Target Terbesar</option>
                <option value="progress_desc">Paling Banyak Selesai</option>
                <option value="status">Status (Aktif Dulu)</option>
              </select>
            </div>
          </div>

          {sortedList.map((p) => {
            const sisa = Math.max(0, p.target_qty - p.achieved_qty)
            const lunas = p.target_qty > 0 && sisa === 0
            return (
              <Card key={p.id_po}>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-slate-100 pb-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-300 bg-slate-100 text-slate-700">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`truncate text-lg font-extrabold ${
                          p.status_aktif ? 'text-slate-900' : 'text-slate-400 line-through'
                        }`}
                      >
                        {p.no_po}
                      </div>
                      {p.nama_customer && (
                        <div className="truncate text-base font-semibold text-slate-600">
                          {p.nama_customer}
                        </div>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <PillBadge color={p.status_aktif ? 'emerald' : 'neutral'}>
                          {p.status_aktif ? 'Aktif' : 'Nonaktif'}
                        </PillBadge>
                        {p.target_qty > 0 && (
                          <PillBadge color={lunas ? 'emerald' : 'blue'}>
                            {lunas ? '✓ LUNAS' : 'Berjalan'}
                          </PillBadge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap shrink-0 items-center gap-2">
                    <BigButton
                      size="sm"
                      variant="ghost"
                      onClick={() => mulaiEdit(p)}
                      aria-label={`Edit PO ${p.no_po}`}
                      className="px-3"
                    >
                      <Pencil className="h-4 w-4" />
                      <span>Edit</span>
                    </BigButton>
                    <BigButton
                      size="sm"
                      variant={p.status_aktif ? 'ghost' : 'primary'}
                      onClick={() => toggle(p)}
                    >
                      {p.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                    </BigButton>
                    <button
                      onClick={() => setHapusTarget(p)}
                      aria-label={`Hapus PO ${p.no_po}`}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-rose-400 bg-rose-50 text-rose-700 active:bg-rose-200"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <PoProgress target={p.target_qty} achieved={p.achieved_qty} />
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Edit PO */}
      <Modal
        isOpen={editingPo !== null}
        onClose={() => setEditingPo(null)}
        title="Edit Data Pesanan (PO)"
      >
        {editingPo && (
          <form onSubmit={simpanEdit} className="space-y-4">
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-3.5 text-sm text-blue-950">
              <div className="font-bold">Progress Pengerjaan Saat Ini:</div>
              <div className="mt-1 text-slate-700">
                Sudah selesai dikerjakan: <span className="font-black text-slate-900">{formatAngka(editingPo.achieved_qty)} pasang</span>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="edit-po-no">Nomor Pesanan (PO)</FieldLabel>
              <TextInput
                id="edit-po-no"
                placeholder="Nomor PO (contoh: PO-2026-001)"
                value={editForm.no_po}
                onChange={(e) => setEditForm((prev) => ({ ...prev, no_po: e.target.value }))}
                required
              />
            </div>

            <div>
              <FieldLabel htmlFor="edit-po-cust">Nama Customer (boleh dikosongkan)</FieldLabel>
              <TextInput
                id="edit-po-cust"
                placeholder="contoh: Toko Sepatu Maju"
                value={editForm.nama_customer}
                onChange={(e) => setEditForm((prev) => ({ ...prev, nama_customer: e.target.value }))}
              />
            </div>

            <div>
              <FieldLabel htmlFor="edit-po-tgt">Target Jumlah (pasang)</FieldLabel>
              <TextInput
                id="edit-po-tgt"
                placeholder="contoh: 500"
                type="number"
                inputMode="numeric"
                min={0}
                value={editForm.target_qty}
                onChange={(e) => setEditForm((prev) => ({ ...prev, target_qty: e.target.value.replace(/[^\d]/g, '') }))}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-slate-100">
              <BigButton
                type="button"
                variant="ghost"
                onClick={() => setEditingPo(null)}
                disabled={savingEdit}
              >
                Batal
              </BigButton>
              <BigButton
                type="submit"
                variant="primary"
                disabled={savingEdit || !editForm.no_po.trim()}
              >
                {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </BigButton>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Konfirmasi Hapus PO */}
      <ConfirmModal
        isOpen={hapusTarget !== null}
        title={`Hapus PO "${hapusTarget?.no_po ?? ''}"?`}
        message="Nomor PO ini akan dihapus dari daftar master. Catatan hasil kerja yang sudah tersimpan tidak akan hilang."
        confirmLabel="Ya, Hapus"
        cancelLabel="Tidak, Batal"
        isDestructive
        onConfirm={() => hapusTarget && onHapusPo(hapusTarget)}
        onCancel={() => setHapusTarget(null)}
      />
    </div>
  )
}
