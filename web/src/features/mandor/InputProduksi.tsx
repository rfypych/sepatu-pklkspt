import { useCallback, useEffect, useState } from 'react'
import {
  getMandorInit,
  getPekerjaAktif,
  getTipeSepatuAktif,
  getUkuranAktif,
  getPoAktif,
  getPoSemua,
  getProduksiHariIni,
  hapusProduksi,
  replaceProduksiDetail,
  simpanProduksiBatch,
  tambahPo,
  getCache,
  setCache,
} from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { ProduksiRow } from '../../lib/api'
import type { MasterPo, MasterUkuran, Pekerja, TipeSepatu } from '../../lib/types'
import { SHIFTS, formatRupiah, tanggalHariIni } from '../../lib/constants'
import {
  BigButton,
  Card,
  ConfirmModal,
  ErrorBox,
  Modal,
  Skeleton,
  SkeletonCard,
  Spinner,
} from '../../components/ui'
import PoProgress from '../../components/PoProgress'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Layers,
  Package,
  Plus,
  RotateCw,
  Trash2,
  User,
} from 'lucide-react'

type NewItem = { localId: number; id_sepatu: number; qty: Record<string, number> }

// "Lembaran kerja" mandor: daftar menetap sepanjang hari.
// Item yang sudah disimpan -> terkunci (abu-abu), tidak bisa diisi ulang kecuali dihapus.
// Disimpan di localStorage agar menetap walau halaman direfresh — tapi hanya BERLAKU 1 HARI,
// keesokan hari otomatis kosong (refresh harian).
const STORE_KEY = 'mandor-sheet'
const SHIFT_MAP_KEY = 'mandor-shift-map'
const PO_MAP_KEY = 'mandor-po-map'
const LAST_PO_KEY = 'mandor-last-po'

function labelTanggalHariIni(): string {
  const [y, m, d] = tanggalHariIni().split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}

export default function InputProduksi() {
  const { user } = useAuth()
  const [pekerjaList, setPekerjaList] = useState<Pekerja[]>(() => getCache<Pekerja[]>('pekerja_aktif') ?? [])
  const [modelList, setModelList] = useState<TipeSepatu[]>(() => getCache<TipeSepatu[]>('tipe_sepatu_aktif') ?? [])
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>(() => getCache<MasterUkuran[]>('ukuran_aktif') ?? [])
  const [poList, setPoList] = useState<MasterPo[]>(() => getCache<MasterPo[]>('po_semua') ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => !getCache('pekerja_aktif'))

  const [idPekerja, setIdPekerja] = useState<number | null>(null)
  const [shift, setShift] = useState<1 | 2>(1)
  const [idPo, setIdPo] = useState<number | null>(null)

  // shift yang dipilih hari ini per karyawan (untuk badge di list karyawan)
  const [shiftMap, setShiftMap] = useState<Record<number, 1 | 2>>({})
  // PO yang dipilih hari ini per karyawan
  const [poMap, setPoMap] = useState<Record<number, number | null>>({})
  // PO terakhir yang dipilih mandor (untuk default karyawan baru)
  const [lastPoId, setLastPoId] = useState<number | null>(null)

  // Item hari ini (dari server) untuk pekerja + shift ini -> terkunci
  const [savedList, setSavedList] = useState<ProduksiRow[]>([])
  // Item baru yang sedang diketik (belum disimpan)
  const [newItems, setNewItems] = useState<NewItem[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingSaved, setLoadingSaved] = useState(false)

  // sub-screen
  const [pilihPo, setPilihPo] = useState(false)
  const [pilihModel, setPilihModel] = useState(false)
  const [tambahPoMode, setTambahPoMode] = useState(false)
  const [poForm, setPoForm] = useState({ no_po: '', customer: '', target: '' })

  const today = tanggalHariIni()

  const reloadPo = useCallback(async () => {
    try {
      const pos = await getPoAktif()
      setPoList(pos)
      setCache('po_semua', pos)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const reloadSaved = useCallback(
    async (workerId: number, shiftVal: 1 | 2, currentPoId?: number | null) => {
      try {
        setLoadingSaved(true)
        const rows = await getProduksiHariIni()
        const forThisWorker = rows.filter(
          (r) => Number(r.id_pekerja) === workerId && Number(r.shift) === shiftVal,
        )
        setSavedList(forThisWorker)

        // Jika pekerja ini belum punya PO yang diset, tapi sudah punya record tersimpan hari ini,
        // otomatis pakai PO dari data tersimpan tersebut
        if (currentPoId === undefined || currentPoId === null) {
          const rowWithPo = forThisWorker.find((r) => r.id_po != null)
          if (rowWithPo && rowWithPo.id_po != null) {
            const resolvedPo = Number(rowWithPo.id_po)
            setIdPo(resolvedPo)
            setPoMap((prev) => ({ ...prev, [workerId]: resolvedPo }))
          }
        }
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoadingSaved(false)
      }
    },
    [],
  )

  const muatData = useCallback(async () => {
    setLoading(true)
    setError(null)

    let restored: { idPekerja: number; shift: 1 | 2; idPo: number | null } | null = null
    let restoredMap: Record<number, 1 | 2> = {}
    let restoredPoMap: Record<number, number | null> = {}
    let restoredLastPo: number | null = null

    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) {
        const st = JSON.parse(raw)
        if (st.tanggal === today && st.idPekerja) {
          restored = { idPekerja: Number(st.idPekerja), shift: st.shift === 2 ? 2 : 1, idPo: st.idPo ?? null }
        }
      }
      const rawMap = localStorage.getItem(SHIFT_MAP_KEY)
      if (rawMap) {
        const sm = JSON.parse(rawMap)
        if (sm.tanggal === today && sm.workers) {
          restoredMap = Object.fromEntries(
            Object.entries(sm.workers).map(([k, v]) => [Number(k), v === 2 ? 2 : 1]),
          )
        }
      }
      const rawPoMap = localStorage.getItem(PO_MAP_KEY)
      if (rawPoMap) {
        const pm = JSON.parse(rawPoMap)
        if (pm.tanggal === today && pm.pos) {
          restoredPoMap = Object.fromEntries(
            Object.entries(pm.pos).map(([k, v]) => [Number(k), v != null ? Number(v) : null]),
          )
        }
      }
      const rawLastPo = localStorage.getItem(LAST_PO_KEY)
      if (rawLastPo) {
        const lp = JSON.parse(rawLastPo)
        if (lp.tanggal === today && lp.idPo != null) {
          restoredLastPo = Number(lp.idPo)
        }
      }
    } catch {
      // abaikan
    }

    try {
      let p: Pekerja[] = []
      let m: TipeSepatu[] = []
      let u: MasterUkuran[] = []
      let po: MasterPo[] = []
      let todayProd: ProduksiRow[] = []

      try {
        const data = await getMandorInit()
        p = data.pekerja
        m = data.model
        u = data.ukuran
        po = data.po
        todayProd = data.todayProduksi ?? []
      } catch {
        const [resP, resM, resU, resPo, resProd] = await Promise.all([
          getPekerjaAktif(),
          getTipeSepatuAktif(),
          getUkuranAktif(),
          getPoSemua(),
          getProduksiHariIni().catch(() => []),
        ])
        p = resP
        m = resM
        u = resU
        po = resPo
        todayProd = resProd
      }

      setPekerjaList(p)
      setModelList(m)
      setUkuranList(u)
      setPoList(po)

      // Simpan ke unified cache
      setCache('pekerja_aktif', p)
      setCache('tipe_sepatu_aktif', m)
      setCache('ukuran_aktif', u)
      setCache('po_semua', po)

      // Ambil data Shift & PO yang sudah tersimpan di database hari ini
      const dbShiftMap: Record<number, 1 | 2> = {}
      const dbPoMap: Record<number, number | null> = {}
      for (const row of todayProd) {
        if (row.shift) dbShiftMap[row.id_pekerja] = row.shift
        if (row.id_po != null) dbPoMap[row.id_pekerja] = row.id_po
      }

      // Gabungkan: prioritas data database > localStorage
      const mergedShiftMap = { ...restoredMap, ...dbShiftMap }
      const mergedPoMap = { ...restoredPoMap, ...dbPoMap }

      setShiftMap(mergedShiftMap)
      setPoMap(mergedPoMap)
      setLastPoId(restoredLastPo)

      if (restored) {
        setIdPekerja(restored.idPekerja)
        const resolvedShift = dbShiftMap[restored.idPekerja] ?? restored.shift
        const resolvedPo =
          dbPoMap[restored.idPekerja] ?? restored.idPo ?? restoredPoMap[restored.idPekerja] ?? restoredLastPo
        setShift(resolvedShift)
        setIdPo(resolvedPo)

        const forThisWorker = todayProd.filter(
          (r) => Number(r.id_pekerja) === restored.idPekerja && Number(r.shift) === resolvedShift,
        )
        setSavedList(forThisWorker)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [today])

  // Muat master data saat mount atau saat user login/berubah
  useEffect(() => {
    muatData()
  }, [muatData, user])

  // simpan lembar kerja ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ tanggal: today, idPekerja, shift, idPo }))
    } catch {
      // abaikan
    }
  }, [today, idPekerja, shift, idPo])

  // catat shift yang dipilih untuk karyawan hari ini (badge di list karyawan)
  useEffect(() => {
    if (idPekerja) {
      setShiftMap((prev) => (prev[idPekerja] === shift ? prev : { ...prev, [idPekerja]: shift }))
    }
  }, [idPekerja, shift])

  useEffect(() => {
    try {
      localStorage.setItem(SHIFT_MAP_KEY, JSON.stringify({ tanggal: today, workers: shiftMap }))
    } catch {
      // abaikan
    }
  }, [today, shiftMap])

  useEffect(() => {
    try {
      localStorage.setItem(PO_MAP_KEY, JSON.stringify({ tanggal: today, pos: poMap }))
    } catch {
      // abaikan
    }
  }, [today, poMap])

  useEffect(() => {
    try {
      if (lastPoId != null) {
        localStorage.setItem(LAST_PO_KEY, JSON.stringify({ tanggal: today, idPo: lastPoId }))
      }
    } catch {
      // abaikan
    }
  }, [today, lastPoId])

  // In-App Confirm Dialog State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    title?: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    isDestructive?: boolean
    onConfirm: () => void
  } | null>(null)

  function requestConfirm(opts: {
    title?: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    isDestructive?: boolean
    onConfirm: () => void
  }) {
    setConfirmState({
      isOpen: true,
      ...opts,
    })
  }

  // Edit Saved Production Item State
  const [editingRow, setEditingRow] = useState<ProduksiRow | null>(null)
  const [editQty, setEditQty] = useState<Record<string, number>>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  function bukaEdit(r: ProduksiRow) {
    setEditingRow(r)
    setEditError(null)
    const initialQty: Record<string, number> = {}
    for (const u of ukuranList) {
      initialQty[String(u.id_ukuran)] = 0
    }
    for (const d of r.detail ?? []) {
      initialQty[String(d.id_ukuran)] = Number(d.qty || 0)
    }
    setEditQty(initialQty)
  }

  async function simpanEdit() {
    if (!editingRow) return
    setSavingEdit(true)
    setEditError(null)
    try {
      const payload = ukuranList.map((u) => ({
        id_ukuran: String(u.id_ukuran),
        qty: editQty[String(u.id_ukuran)] ?? 0,
      }))
      await replaceProduksiDetail(editingRow.id_produksi, payload)
      setEditingRow(null)
      if (idPekerja) {
        await Promise.all([
          reloadSaved(idPekerja, shift, idPo),
          getProduksiHariIni(),
          reloadPo(),
        ])
      }
    } catch (e) {
      setEditError((e as Error).message)
    } finally {
      setSavingEdit(false)
    }
  }

  function pilihPekerja(id: number) {
    const hasUnsaved = newItems.some((it) => Object.values(it.qty).some((q) => q > 0))
    if (hasUnsaved) {
      requestConfirm({
        title: 'Ada Item Belum Disimpan',
        message: 'Anda memiliki data pasang sepatu yang belum disimpan. Yakin ingin berganti pekerja dan membuang perubahan?',
        confirmLabel: 'Ya, Ganti Pekerja',
        cancelLabel: 'Batal',
        isDestructive: true,
        onConfirm: () => {
          setConfirmState(null)
          lanjutPilihPekerja(id)
        },
      })
      return
    }
    lanjutPilihPekerja(id)
  }

  function lanjutPilihPekerja(id: number) {
    const s = shiftMap[id] ?? 1
    // Prioritas PO: PO yang pernah dipilih untuk pekerja ini -> PO terakhir yang aktif -> null
    const targetPo = poMap[id] !== undefined ? poMap[id] : (idPo ?? lastPoId ?? null)

    setIdPekerja(id)
    setShift(s)
    setIdPo(targetPo)
    setNewItems([])
    setError(null)
    void reloadSaved(id, s, targetPo)
  }

  function gantiShift(s: 1 | 2) {
    const hasUnsaved = newItems.some((it) => Object.values(it.qty).some((q) => q > 0))
    if (hasUnsaved) {
      requestConfirm({
        title: 'Ada Item Belum Disimpan',
        message: 'Ada isian data yang belum disimpan. Yakin ingin mengganti shift dan membuang data yang belum disimpan?',
        confirmLabel: 'Ya, Ganti Shift',
        cancelLabel: 'Batal',
        isDestructive: true,
        onConfirm: () => {
          setConfirmState(null)
          lanjutGantiShift(s)
        },
      })
      return
    }
    lanjutGantiShift(s)
  }

  function lanjutGantiShift(s: 1 | 2) {
    setShift(s)
    setNewItems([])
    setError(null)
    if (idPekerja) void reloadSaved(idPekerja, s, idPo)
  }

  function handlePilihPo(selectedId: number | null) {
    setIdPo(selectedId)
    setLastPoId(selectedId)
    if (idPekerja) {
      setPoMap((prev) => ({ ...prev, [idPekerja]: selectedId }))
    }
    setPilihPo(false)
  }

  function hapusLocked(r: ProduksiRow) {
    requestConfirm({
      title: 'Hapus Catatan Produksi?',
      message: `Yakin ingin menghapus data ${r.nama_model ?? 'item'} yang sudah tersimpan ini? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Hapus Data',
      cancelLabel: 'Batal',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmState(null)
        try {
          await hapusProduksi(r.id_produksi)
          setSavedList((prev) => prev.filter((x) => x.id_produksi !== r.id_produksi))
          const [updatedToday] = await Promise.all([getProduksiHariIni(), reloadPo()])
          const dbShiftMap: Record<number, 1 | 2> = {}
          const dbPoMap: Record<number, number | null> = {}
          for (const row of updatedToday) {
            if (row.shift) dbShiftMap[row.id_pekerja] = row.shift
            if (row.id_po != null) dbPoMap[row.id_pekerja] = row.id_po
          }
          setShiftMap((prev) => ({ ...prev, ...dbShiftMap }))
          setPoMap((prev) => ({ ...prev, ...dbPoMap }))
          setError(null)
        } catch (e) {
          setError((e as Error).message)
        }
      },
    })
  }

  async function simpan() {
    if (!idPekerja) return
    const payloadItems = newItems
      .map((it) => ({
        id_sepatu: it.id_sepatu,
        qtyPerUkuran: ukuranList.map((u) => ({
          id_ukuran: String(u.id_ukuran),
          qty: it.qty[String(u.id_ukuran)] ?? 0,
        })),
      }))
      .filter((it) => it.qtyPerUkuran.some((d) => d.qty > 0))

    if (payloadItems.length === 0) return

    setSaving(true)
    setError(null)
    try {
      await simpanProduksiBatch({ tanggal: today, shift, id_pekerja: idPekerja, id_po: idPo, items: payloadItems })
      setNewItems([])
      if (idPo != null) {
        setLastPoId(idPo)
        setPoMap((prev) => ({ ...prev, [idPekerja]: idPo }))
      }
      const [updatedToday] = await Promise.all([
        getProduksiHariIni(),
        reloadSaved(idPekerja, shift, idPo),
        reloadPo(),
      ])
      const dbShiftMap: Record<number, 1 | 2> = {}
      const dbPoMap: Record<number, number | null> = {}
      for (const row of updatedToday) {
        if (row.shift) dbShiftMap[row.id_pekerja] = row.shift
        if (row.id_po != null) dbPoMap[row.id_pekerja] = row.id_po
      }
      setShiftMap((prev) => ({ ...prev, ...dbShiftMap }))
      setPoMap((prev) => ({ ...prev, ...dbPoMap }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading && pekerjaList.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm">
          <Skeleton className="h-6 w-32 rounded-full mb-3" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (!idPekerja) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full w-fit border border-emerald-300">
            <Calendar className="h-4 w-4" />
            <span>{labelTanggalHariIni()}</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Pilih Nama Pekerja
          </h1>
          <p className="mt-0.5 text-sm font-semibold text-slate-600">
            Ketuk nama pekerja di bawah untuk mulai mengisi hasil pasang sepatu hari ini.
          </p>
        </div>

        <div className="space-y-3">
          {pekerjaList.map((p) => {
            const workerPoId = poMap[p.id_pekerja]
            const workerPo = workerPoId ? poList.find((po) => po.id_po === workerPoId) : null
            const hasShift = shiftMap[p.id_pekerja] !== undefined
            return (
              <button
                key={p.id_pekerja}
                onClick={() => pilihPekerja(p.id_pekerja)}
                className="group flex w-full items-center justify-between rounded-3xl border-2 border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-150 hover:border-emerald-500 hover:bg-emerald-50/40 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 text-xl font-bold border-2 border-emerald-300">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-lg font-black tracking-tight text-slate-900">
                      {p.nama}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {hasShift && (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                          shiftMap[p.id_pekerja] === 1 
                            ? 'bg-amber-100 text-amber-950 border-amber-300' 
                            : 'bg-indigo-100 text-indigo-950 border-indigo-300'
                        }`}>
                          {shiftMap[p.id_pekerja] === 1 ? '☀️ Shift 1 (Pagi)' : '🌙 Shift 2 (Malam)'}
                        </span>
                      )}
                      {workerPo && (
                        <span className="inline-flex items-center rounded-full bg-sky-100 text-sky-950 border border-sky-300 px-2.5 py-0.5 text-xs font-bold">
                          <Package className="mr-1 h-3 w-3 inline text-sky-700" />
                          {workerPo.no_po}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-bold text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <span>PILIH</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </button>
            )
          })}
        </div>
        {error && (
          <div className="space-y-2">
            <ErrorBox message={error} />
            <button
              onClick={() => muatData()}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Coba Muat Ulang</span>
            </button>
          </div>
        )}
        {!loading && pekerjaList.length === 0 && !error && (
          <Card className="text-center text-slate-500 py-10 space-y-3">
            <p>Belum ada pekerja aktif.</p>
            <button
              onClick={() => muatData()}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Segarkan Data</span>
            </button>
          </Card>
        )}
      </div>
    )
  }

  if (pilihPo) {
    return (
      <PoPickerScreen
        poList={poList}
        idPo={idPo}
        setIdPo={handlePilihPo}
        onBack={() => setPilihPo(false)}
        tambahPoMode={tambahPoMode}
        setTambahPoMode={setTambahPoMode}
        poForm={poForm}
        setPoForm={setPoForm}
        error={error}
        setError={setError}
        reloadPo={reloadPo}
      />
    )
  }

  if (pilihModel) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Pilih Model Sepatu</h1>
          <p className="text-sm font-semibold text-slate-600">Pilih model sepatu yang keluar dari loker untuk diisi jumlahnya.</p>
        </div>

        <div className="space-y-3">
          {modelList.map((m) => (
            <button
              key={m.id_sepatu}
              onClick={() => onTambahItem(m.id_sepatu)}
              className="flex w-full items-center justify-between rounded-3xl border-2 border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-150 hover:border-emerald-500 hover:bg-emerald-50/40 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-800 border border-blue-200">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-lg font-black tracking-tight text-slate-900 block">
                    {m.nama_model}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Upah: {formatRupiah(m.ongkos_kerja)} / pasang
                  </span>
                </div>
              </div>
              <span className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-xs">
                + PILIH MODEL
              </span>
            </button>
          ))}
        </div>

        {error && <ErrorBox message={error} />}

        <BigButton variant="ghost" className="w-full py-4 text-base font-bold" onClick={() => setPilihModel(false)}>
          <ArrowLeft className="h-5 w-5 mr-1" />
          Batal & Kembali
        </BigButton>
      </div>
    )
  }

  const pekerja = pekerjaList.find((p) => p.id_pekerja === idPekerja)
  const selectedPo = poList.find((p) => p.id_po === idPo)

  const savedTotal = savedList.reduce((a, r) => a + (r.detail ?? []).reduce((x, d) => x + Number(d.qty), 0), 0)
  const newTotal = newItems.reduce(
    (a, it) => a + ukuranList.reduce((x, u) => x + (it.qty[String(u.id_ukuran)] ?? 0), 0),
    0,
  )
  const totalPasang = savedTotal + newTotal

  // streaming: progress PO = sudah tercatat (dari server) + yang sedang diketik
  const poProjected = selectedPo ? selectedPo.achieved_qty + newTotal : 0
  const jumlahBaruTerisi = newItems.filter((it) => Object.values(it.qty).some((q) => q > 0)).length

  function onTambahItem(idSepatu: number) {
    if (newItems.some((it) => it.id_sepatu === idSepatu)) {
      setError('Model ini sudah ada di daftar input di bawah.')
      setPilihModel(false)
      return
    }
    setNewItems((prev) => [...prev, { localId: Date.now(), id_sepatu: idSepatu, qty: {} }])
    setPilihModel(false)
    setError(null)
  }

  return (
    <div className="space-y-4">
      {/* Header bar Pekerja Aktif */}
      <div className="rounded-3xl border-2 border-slate-800 bg-slate-900 p-4 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-slate-900 text-xl font-bold">
            👤
          </div>
          <div>
            <div className="text-xs font-bold text-amber-300">Pekerja yang Dipilih:</div>
            <h1 className="text-xl font-black tracking-tight text-white leading-tight">
              {pekerja?.nama}
            </h1>
          </div>
        </div>
        <button
          onClick={() => {
            const hasUnsaved = newItems.some((it) => Object.values(it.qty).some((q) => q > 0))
            if (hasUnsaved) {
              requestConfirm({
                title: 'Ada Item Belum Disimpan',
                message: 'Anda sedang menginput item baru yang belum disimpan. Yakin ingin kembali dan membuang perubahan?',
                confirmLabel: 'Kembali & Buang',
                cancelLabel: 'Batal',
                isDestructive: true,
                onConfirm: () => {
                  setConfirmState(null)
                  setNewItems([])
                  setIdPekerja(null)
                },
              })
              return
            }
            setIdPekerja(null)
          }}
          className="rounded-2xl border-2 border-slate-600 bg-slate-800 px-3.5 py-2 text-xs font-black text-slate-200 hover:bg-slate-700 active:bg-slate-600 transition-colors"
        >
          ← Ganti Pekerja
        </button>
      </div>

      {/* Shift Toggle */}
      <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm space-y-2">
        <div className="text-sm font-black uppercase tracking-wider text-slate-800">
          1. PILIH SHIFT KERJA
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {SHIFTS.map((s) => {
            const isShift1 = s.value === 1
            const isSelected = shift === s.value
            return (
              <button
                key={s.value}
                onClick={() => gantiShift(s.value)}
                className={`rounded-2xl p-3.5 text-center transition-all ${
                  isSelected
                    ? isShift1
                      ? 'bg-amber-400 text-slate-950 border-2 border-amber-600 shadow-md scale-[1.02]'
                      : 'bg-indigo-600 text-white border-2 border-indigo-800 shadow-md scale-[1.02]'
                    : 'border-2 border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-base font-black tracking-tight">
                  {isShift1 ? '☀️ ' : '🌙 '}
                  {s.label}
                </div>
                <div className={`text-xs font-bold mt-0.5 ${isSelected ? (isShift1 ? 'text-amber-950' : 'text-indigo-200') : 'text-slate-500'}`}>
                  {s.sub}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* PO Selector */}
      <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm space-y-2">
        <div className="text-sm font-black uppercase tracking-wider text-slate-800">
          2. NOMOR PURCHASE ORDER (PO)
        </div>
        {selectedPo ? (
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-sky-700" />
                <span className="text-lg font-black text-sky-950">{selectedPo.no_po}</span>
                {selectedPo.nama_customer && (
                  <span className="text-xs font-bold text-sky-700">({selectedPo.nama_customer})</span>
                )}
              </div>
              <button
                onClick={() => setPilihPo(true)}
                className="rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-sky-700 shadow-xs"
              >
                Ganti PO
              </button>
            </div>
            {selectedPo.target_qty > 0 && (
              <div className="mt-2.5">
                <PoProgress target={selectedPo.target_qty} achieved={poProjected} />
                {newTotal > 0 && (
                  <div className="mt-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                    +{newTotal} pasang baru sedang diketik
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setPilihPo(true)}
            className="flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-sky-400 bg-sky-50/50 p-4 text-sm font-bold text-sky-900 hover:bg-sky-100"
          >
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-sky-600" />
              <span>Belum Memilih PO (Ketuk di sini untuk memilih)</span>
            </div>
            <span className="text-xs font-black text-sky-700 bg-sky-200/80 px-2.5 py-1 rounded-lg">PILIH PO →</span>
          </button>
        )}
      </div>

      {/* Item Tercatat (Terkunci) */}
      {savedList.length > 0 && (
        <div className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="text-xs font-black uppercase tracking-wider text-slate-600">
            ✓ Data Sudah Tersimpan di Database ({savedList.length} Model)
          </div>
          {loadingSaved ? (
            <Spinner />
          ) : (
            <div className="space-y-2">
              {savedList.map((r) => {
                const model = modelList.find((m) => m.id_sepatu === Number(r.id_sepatu))
                const sum = (r.detail ?? []).reduce((x, d) => x + Number(d.qty), 0)
                const ringkas = (r.detail ?? [])
                  .filter((d) => Number(d.qty) > 0)
                  .map((d) => `No ${ukuranList.find((u) => u.id_ukuran === Number(d.id_ukuran))?.label_ukuran ?? '?'}: ${d.qty}`)
                  .join(' · ')
                return (
                  <div key={r.id_produksi} className="rounded-2xl border-2 border-slate-200 bg-white p-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div className="font-black text-slate-900 text-base">
                          {model?.nama_model ?? '?'}
                        </div>
                        {r.no_po && (
                          <span className="bg-slate-100 text-slate-700 border border-slate-300 rounded-full px-2.5 py-0.5 text-xs font-bold">
                            {r.no_po}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                          {sum} pasang
                        </span>
                        <button
                          onClick={() => bukaEdit(r)}
                          className="rounded-xl p-2 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200"
                          title="Edit data ini"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => hapusLocked(r)}
                          className="rounded-xl p-2 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200"
                          title="Hapus data ini"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {ringkas && <div className="mt-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">{ringkas}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Item Baru */}
      <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <div className="text-sm font-black uppercase tracking-wider text-slate-900">
              3. ISI JUMLAH UKURAN SEPATU
            </div>
            <div className="text-xs text-slate-500 font-semibold">Ketik jumlah pasang sesuai nomor ukuran</div>
          </div>
          <button
            onClick={() => setPilihModel(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 shadow-md active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>+ TAMBAH MODEL</span>
          </button>
        </div>

        {newItems.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            <Layers className="mx-auto h-10 w-10 text-slate-400 mb-2" />
            <p className="text-base font-black text-slate-800">Belum ada model sepatu yang dipilih.</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Tekan tombol biru <b>+ TAMBAH MODEL</b> di atas untuk mulai mengisi.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {newItems.map((it, idx) => {
              const model = modelList.find((m) => m.id_sepatu === it.id_sepatu)
              const subTotal = ukuranList.reduce((x, u) => x + (it.qty[String(u.id_ukuran)] ?? 0), 0)
              return (
                <div key={it.localId} className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                    <div>
                      <div className="text-lg font-black text-slate-900">{model?.nama_model ?? '?'}</div>
                      <div className="text-xs font-bold text-emerald-800">
                        {model ? `Tarif Upah: ${formatRupiah(model.ongkos_kerja)} / pasang` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-xl bg-emerald-600 px-3.5 py-1 text-sm font-black text-white shadow-xs">
                        Total: {subTotal} psg
                      </span>
                      <button
                        onClick={() => setNewItems((prev) => prev.filter((x) => x.localId !== it.localId))}
                        className="rounded-xl p-2 text-rose-600 hover:bg-rose-100 border border-rose-300 bg-white"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2.5">
                    {ukuranList.map((u) => (
                      <div key={u.id_ukuran} className="rounded-xl border-2 border-slate-300 bg-white p-2 text-center shadow-xs">
                        <div className="text-xs font-black text-slate-700 mb-1">
                          No {u.label_ukuran}
                        </div>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          placeholder="0"
                          value={it.qty[String(u.id_ukuran)] === undefined || it.qty[String(u.id_ukuran)] === 0 ? '' : it.qty[String(u.id_ukuran)]}
                          onChange={(e) => {
                            const raw = e.target.value
                            const val = raw === '' ? 0 : Math.max(0, Math.floor(Number(raw) || 0))
                            setNewItems((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? { ...x, qty: { ...x.qty, [String(u.id_ukuran)]: val } }
                                  : x,
                              ),
                            )
                          }}
                          className="w-full rounded-lg border-2 border-slate-200 bg-slate-50 py-2 text-center text-xl font-black text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {error && <ErrorBox message={error} />}

      {/* Summary Box */}
      <div className="rounded-3xl border-2 border-slate-800 bg-slate-900 p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wider text-slate-300">TOTAL HASIL KERJA:</span>
          <span className="text-3xl font-black tracking-tight text-emerald-400">{totalPasang} Pasang</span>
        </div>
        {newTotal > 0 && (
          <div className="mt-1 text-right text-xs font-bold text-amber-300">
            ({savedTotal} tersimpan + <span className="underline">{newTotal} pasang baru belum disimpan</span>)
          </div>
        )}
      </div>

      {/* Big Save Button */}
      <BigButton
        disabled={saving || newTotal <= 0}
        variant="primary"
        onClick={simpan}
        className="w-full py-4 text-lg font-black shadow-xl"
      >
        {saving ? (
          'SEDANG MENYIMPAN KE DATABASE...'
        ) : newTotal > 0 ? (
          <>
            <span>💾 SIMPAN HASIL PRODUKSI ({jumlahBaruTerisi} MODEL)</span>
            <ArrowRight className="h-5 w-5 ml-1" />
          </>
        ) : (
          '✓ SEMUA DATA SUDAH TERSIMPAN'
        )}
      </BigButton>

      {/* Modal Edit Item Tersimpan */}
      {editingRow && (
        <Modal
          isOpen={true}
          onClose={() => setEditingRow(null)}
          title={`Edit Produksi: ${editingRow.nama_model ?? 'Model'}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-bold text-slate-800">
                👤 {pekerja?.nama}
              </span>
              <span className="rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-900">
                {editingRow.shift === 1 ? '☀️ Shift 1' : '🌙 Shift 2'}
              </span>
              {editingRow.no_po && (
                <span className="rounded-full bg-sky-100 border border-sky-300 px-3 py-1 text-xs font-bold text-sky-900">
                  📦 {editingRow.no_po}
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Ubah Jumlah per Nomor Ukuran:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ukuranList.map((u) => {
                  const val = editQty[String(u.id_ukuran)] || 0
                  return (
                    <div
                      key={u.id_ukuran}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-center shadow-xs"
                    >
                      <div className="text-xs font-black text-slate-500">No {u.label_ukuran}</div>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditQty((prev) => ({
                              ...prev,
                              [String(u.id_ukuran)]: Math.max(0, (prev[String(u.id_ukuran)] || 0) - 1),
                            }))
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 text-xs font-black"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={val === 0 ? '' : val}
                          placeholder="0"
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10)
                            setEditQty((prev) => ({
                              ...prev,
                              [String(u.id_ukuran)]: isNaN(n) ? 0 : Math.max(0, n),
                            }))
                          }}
                          className="w-12 text-center text-base font-black text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEditQty((prev) => ({
                              ...prev,
                              [String(u.id_ukuran)]: (prev[String(u.id_ukuran)] || 0) + 1,
                            }))
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 text-xs font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Total Pasang in Edit Modal */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
              <span className="text-xs font-bold uppercase text-slate-300">Total Pasang:</span>
              <span className="text-xl font-black text-emerald-400">
                {Object.values(editQty).reduce((a, b) => a + (Number(b) || 0), 0)} Pasang
              </span>
            </div>

            {editError && <ErrorBox message={editError} />}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <BigButton
                variant="ghost"
                type="button"
                className="py-3 text-sm font-bold"
                onClick={() => setEditingRow(null)}
                disabled={savingEdit}
              >
                Batal
              </BigButton>
              <BigButton
                variant="primary"
                type="button"
                className="py-3 text-sm font-black"
                onClick={simpanEdit}
                disabled={savingEdit}
              >
                {savingEdit ? 'Menyimpan...' : '✓ Simpan Perubahan'}
              </BigButton>
            </div>
          </div>
        </Modal>
      )}

      {/* In-App Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmState?.isOpen)}
        title={confirmState?.title}
        message={confirmState?.message ?? ''}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        isDestructive={confirmState?.isDestructive}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  )
}

// ============================================================================
// Pemilih PO (dengan progress) + tambah PO baru (mandor & admin)
// ============================================================================
function PoPickerScreen({
  poList,
  idPo,
  setIdPo,
  onBack,
  tambahPoMode,
  setTambahPoMode,
  poForm,
  setPoForm,
  error,
  setError,
  reloadPo,
}: {
  poList: MasterPo[]
  idPo: number | null
  setIdPo: (id: number | null) => void
  onBack: () => void
  tambahPoMode: boolean
  setTambahPoMode: (b: boolean) => void
  poForm: { no_po: string; customer: string; target: string }
  setPoForm: (f: { no_po: string; customer: string; target: string }) => void
  error: string | null
  setError: (m: string | null) => void
  reloadPo: () => Promise<void>
}) {
  const [saving, setSaving] = useState(false)

  async function submitPo(e: React.FormEvent) {
    e.preventDefault()
    if (!poForm.no_po.trim()) {
      setError('No PO wajib diisi.')
      return
    }
    setSaving(true)
    try {
      const r = await tambahPo(poForm.no_po.trim(), poForm.customer.trim(), Number(poForm.target) || 0)
      await reloadPo()
      setIdPo(r.id_po)
      setPoForm({ no_po: '', customer: '', target: '' })
      setTambahPoMode(false)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Pilih Purchase Order (PO)</h1>
        <p className="text-sm font-semibold text-slate-600">Pilih nomor PO yang sedang dikerjakan hari ini, atau lewati jika order reguler.</p>
      </div>

      <button
        onClick={() => setIdPo(null)}
        className="flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-slate-400 bg-white p-4 text-left font-black text-slate-700 shadow-xs hover:border-slate-600 active:bg-slate-50 transition-colors"
      >
        <span className="text-base">⏭️ Lewati (Tanpa PO / Order Reguler)</span>
        <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">PILIH →</span>
      </button>

      <div className="space-y-3">
        {poList.map((p) => {
          const penuh = p.target_qty > 0 && p.achieved_qty >= p.target_qty
          const terpilih = p.id_po === idPo
          return (
            <button
              key={p.id_po}
              onClick={() => setIdPo(p.id_po)}
              className={`w-full rounded-3xl border-2 p-4 text-left shadow-sm transition-all duration-150 active:scale-[0.98] ${
                terpilih
                  ? 'border-sky-600 bg-sky-50 text-slate-900 ring-2 ring-sky-500'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${terpilih ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-lg font-black tracking-tight">{p.no_po}</span>
                    {p.nama_customer && (
                      <span className="text-xs font-bold text-slate-500 block">
                        Customer: {p.nama_customer}
                      </span>
                    )}
                  </div>
                </div>
                {penuh && (
                  <span className="rounded-full px-3 py-1 text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ Target Tercapai
                  </span>
                )}
              </div>
              {p.target_qty > 0 ? (
                <div className="mt-3 pointer-events-none">
                  <PoProgress target={p.target_qty} achieved={p.achieved_qty} />
                </div>
              ) : (
                <div className="mt-2 text-xs font-bold text-slate-500">
                  {p.achieved_qty > 0 ? `${p.achieved_qty} pasang terinput` : 'Belum ada target'}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {poList.length === 0 && <p className="text-sm text-slate-500 font-semibold">Belum ada PO aktif.</p>}

      {/* Tambah PO Baru */}
      <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm space-y-3">
        {tambahPoMode ? (
          <form onSubmit={submitPo} className="space-y-3">
            <div className="text-base font-black text-slate-900">+ Tambah Nomor PO Baru</div>
            <input
              placeholder="No PO (cth: PO-2026-003)"
              value={poForm.no_po}
              onChange={(e) => setPoForm({ ...poForm, no_po: e.target.value })}
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
            <input
              placeholder="Customer (opsional)"
              value={poForm.customer}
              onChange={(e) => setPoForm({ ...poForm, customer: e.target.value })}
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
            <input
              placeholder="Target jumlah (pasang) — sesuai order"
              inputMode="numeric"
              value={poForm.target}
              onChange={(e) => setPoForm({ ...poForm, target: e.target.value.replace(/[^\d]/g, '') })}
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <BigButton
                variant="ghost"
                type="button"
                className="py-3 text-base font-bold"
                onClick={() => {
                  setTambahPoMode(false)
                  setError(null)
                }}
              >
                Batal
              </BigButton>
              <BigButton type="submit" variant="primary" className="py-3 text-base font-bold" disabled={saving}>
                {saving ? 'Menyimpan...' : '✓ SIMPAN PO'}
              </BigButton>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setTambahPoMode(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 border-2 border-blue-200 py-3 text-sm font-black text-blue-800 hover:bg-blue-100 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>+ TAMBAH NOMOR PO BARU</span>
          </button>
        )}
      </div>

      {error && <ErrorBox message={error} />}

      <BigButton variant="ghost" className="w-full py-4 text-base font-bold" onClick={onBack}>
        <ArrowLeft className="h-5 w-5 mr-1" />
        Kembali ke Form
      </BigButton>
    </div>
  )
}
