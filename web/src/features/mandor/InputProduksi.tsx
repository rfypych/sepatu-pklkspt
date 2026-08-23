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
import { addOfflineQueue } from '../../lib/offline'
import {
  BigButton,
  ConfirmModal,
  EmptyState,
  ErrorBox,
  FieldLabel,
  HintBox,
  Modal,
  NumberStepper,
  PageTitle,
  PillBadge,
  Skeleton,
  SkeletonCard,
  Spinner,
  StepCard,
  SuccessBox,
  TextInput,
} from '../../components/ui'
import PoProgress from '../../components/PoProgress'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Layers,
  Package,
  Plus,
  RotateCw,
  Save,
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
  const [info, setInfo] = useState<string | null>(null)
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
    async (workerId: number, shiftVal: 1 | 2) => {
      try {
        setLoadingSaved(true)
        const rows = await getProduksiHariIni()
        const forThisWorker = rows.filter(
          (r) => Number(r.id_pekerja) === workerId && Number(r.shift) === shiftVal,
        )
        setSavedList(forThisWorker)
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
        if (row.id_po != null && po.some((x) => x.id_po === Number(row.id_po))) {
          dbPoMap[row.id_pekerja] = Number(row.id_po)
        }
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
        let resolvedPo =
          restoredPoMap[restored.idPekerja] !== undefined
            ? restoredPoMap[restored.idPekerja]
            : (dbPoMap[restored.idPekerja] ?? restored.idPo ?? restoredLastPo ?? null)

        if (resolvedPo != null && !po.some((x) => x.id_po === resolvedPo)) {
          resolvedPo = null
        }

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

  // Realtime background sync (5 detik) antar perangkat secara live
  useEffect(() => {
    let active = true
    async function syncRealtime() {
      try {
        const [todayProd, pos] = await Promise.all([
          getProduksiHariIni(),
          getPoAktif(),
        ])
        if (!active) return

        setPoList(pos)
        setCache('po_semua', pos)

        // Validasi: jika PO yang sedang dipilih dinonaktifkan admin, batalkan pilihan PO secara otomatis
        setIdPo((curPo) => {
          if (curPo != null && !pos.some((p) => p.id_po === curPo)) {
            return null
          }
          return curPo
        })

        const dbShiftMap: Record<number, 1 | 2> = {}
        for (const r of todayProd) {
          const pid = Number(r.id_pekerja)
          if (!dbShiftMap[pid] && r.shift) {
            dbShiftMap[pid] = Number(r.shift) as 1 | 2
          }
        }
        setShiftMap((prev) => ({ ...prev, ...dbShiftMap }))
        setPoMap((prev) => {
          const updated = { ...prev }
          for (const [k, v] of Object.entries(updated)) {
            if (v != null && !pos.some((p) => p.id_po === v)) {
              updated[Number(k)] = null
            }
          }
          return updated
        })

        if (idPekerja) {
          const forThisWorker = todayProd.filter(
            (r) => Number(r.id_pekerja) === idPekerja && Number(r.shift) === shift,
          )
          setSavedList(forThisWorker)
        }
      } catch {
        // Silent in background
      }
    }

    const timer = setInterval(syncRealtime, 5000)
    const onFocus = () => syncRealtime()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [idPekerja, shift])

  // simpan lembar kerja ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ tanggal: today, idPekerja, shift, idPo }))
    } catch {
      // abaikan
    }
  }, [today, idPekerja, shift, idPo])

  // Muat draft newItems saat pekerja / shift dipilih
  useEffect(() => {
    if (!idPekerja) return
    try {
      const draftKey = `mandor_draft_${today}_${idPekerja}_${shift}`
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNewItems(parsed)
        }
      }
    } catch {
      // abaikan
    }
  }, [idPekerja, shift, today])

  // Simpan draft newItems secara realtime ke localStorage
  useEffect(() => {
    if (!idPekerja) return
    try {
      const draftKey = `mandor_draft_${today}_${idPekerja}_${shift}`
      if (newItems.length > 0) {
        localStorage.setItem(draftKey, JSON.stringify(newItems))
      } else {
        localStorage.removeItem(draftKey)
      }
    } catch {
      // abaikan
    }
  }, [newItems, idPekerja, shift, today])

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
          reloadSaved(idPekerja, shift),
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
        title: 'Perubahan Belum Disimpan',
        message: 'Terdapat isian data yang belum disimpan. Jika berpindah pekerja sekarang, data yang belum disimpan akan hilang.',
        confirmLabel: 'Ganti Pekerja',
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
    let targetPo = poMap[id] !== undefined ? poMap[id] : (idPo ?? lastPoId ?? null)
    if (targetPo != null && !poList.some((p) => p.id_po === targetPo)) {
      targetPo = null
    }

    setIdPekerja(id)
    setShift(s)
    setIdPo(targetPo)
    setNewItems([])
    setError(null)
    void reloadSaved(id, s)
  }

  function gantiShift(s: 1 | 2) {
    const hasUnsaved = newItems.some((it) => Object.values(it.qty).some((q) => q > 0))
    if (hasUnsaved) {
      requestConfirm({
        title: 'Perubahan Belum Disimpan',
        message: 'Terdapat isian data yang belum disimpan. Jika mengganti shift sekarang, data yang belum disimpan akan hilang.',
        confirmLabel: 'Ganti Shift',
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
    if (idPekerja) void reloadSaved(idPekerja, s)
  }

  function handlePilihPo(selectedId: number | null) {
    const resolvedId = selectedId != null && poList.some((p) => p.id_po === selectedId) ? selectedId : null
    setIdPo(resolvedId)
    setLastPoId(resolvedId)
    if (idPekerja) {
      setPoMap((prev) => ({ ...prev, [idPekerja]: resolvedId }))
    }
    setPilihPo(false)
  }

  function hapusLocked(r: ProduksiRow) {
    requestConfirm({
      title: 'Hapus Catatan Produksi?',
      message: `Hapus catatan hasil kerja ${r.nama_model ?? 'item'} ini? Data yang telah dihapus tidak dapat dikembalikan.`,
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
          for (const row of updatedToday) {
            if (row.shift) dbShiftMap[row.id_pekerja] = row.shift
          }
          setShiftMap((prev) => ({ ...prev, ...dbShiftMap }))
          setError(null)
        } catch (e) {
          setError((e as Error).message)
        }
      },
    })
  }

  function simpanKeOffline(
    validPoId: number | null,
    payloadItems: { id_sepatu: number; qtyPerUkuran: { id_ukuran: string; qty: number }[] }[],
  ) {
    if (!idPekerja) return

    const formattedItems = payloadItems.map((it) => {
      const model = modelList.find((m) => m.id_sepatu === it.id_sepatu)
      return {
        id_sepatu: it.id_sepatu,
        nama_model: model?.nama_model,
        qtyPerUkuran: it.qtyPerUkuran.map((d) => {
          const uk = ukuranList.find((u) => String(u.id_ukuran) === d.id_ukuran)
          return {
            id_ukuran: d.id_ukuran,
            label_ukuran: uk?.label_ukuran,
            qty: d.qty,
          }
        }),
      }
    })

    addOfflineQueue({
      tanggal: today,
      shift,
      id_pekerja: idPekerja,
      id_po: validPoId,
      nama_pekerja: pekerja?.nama,
      nama_po: selectedPo?.no_po,
      items: formattedItems,
    })

    const offlineEntries: ProduksiRow[] = payloadItems.map((it, i) => {
      const model = modelList.find((m) => m.id_sepatu === it.id_sepatu)
      return {
        id_produksi: -1 * (Date.now() + i),
        tanggal: today,
        shift,
        id_pekerja: idPekerja,
        id_sepatu: it.id_sepatu,
        id_po: validPoId,
        catatan: 'offline',
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        nama_pekerja: pekerja?.nama ?? '',
        nama_model: model?.nama_model ?? 'Model',
        no_po: selectedPo?.no_po ?? null,
        detail: it.qtyPerUkuran.map((d, dIdx) => ({
          id_detail: -1 * (Date.now() + i * 100 + dIdx),
          id_produksi: -1 * (Date.now() + i),
          id_ukuran: Number(d.id_ukuran),
          qty: d.qty,
          ongkos_kerja_saat_ini: model?.ongkos_kerja ?? 0,
        })),
      }
    })

    setSavedList((prev) => [...prev, ...offlineEntries])
    setNewItems([])
    try {
      localStorage.removeItem(`mandor_draft_${today}_${idPekerja}_${shift}`)
    } catch {
      // ignore
    }
    setLastPoId(validPoId)
    setPoMap((prev) => ({ ...prev, [idPekerja]: validPoId }))
    setInfo(
      '📶 Data tersimpan di memori HP (Mode Offline). Data otomatis terkirim ke server begitu sinyal/internet aktif kembali.',
    )
    setError(null)
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
    setInfo(null)
    const validPoId = idPo != null && poList.some((p) => p.id_po === idPo) ? idPo : null

    // Jika sedang offline murni: langsung simpan ke antrean lokal HP
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      simpanKeOffline(validPoId, payloadItems)
      setSaving(false)
      return
    }

    try {
      await simpanProduksiBatch({
        tanggal: today,
        shift,
        id_pekerja: idPekerja,
        id_po: validPoId,
        items: payloadItems,
      })
      setNewItems([])
      try {
        localStorage.removeItem(`mandor_draft_${today}_${idPekerja}_${shift}`)
      } catch {
        // ignore
      }
      setLastPoId(validPoId)
      setPoMap((prev) => ({ ...prev, [idPekerja]: validPoId }))
      setInfo('Data hasil kerja berhasil disimpan ke server.')

      const [updatedToday] = await Promise.all([
        getProduksiHariIni(),
        reloadSaved(idPekerja, shift),
        reloadPo(),
      ])
      const dbShiftMap: Record<number, 1 | 2> = {}
      for (const row of updatedToday) {
        if (row.shift) dbShiftMap[row.id_pekerja] = row.shift
      }
      setShiftMap((prev) => ({ ...prev, ...dbShiftMap }))
    } catch (e) {
      const errMsg = (e as Error).message || ''
      const looksLikeNetworkFail =
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        errMsg.toLowerCase().includes('failed to fetch') ||
        errMsg.toLowerCase().includes('network') ||
        errMsg.toLowerCase().includes('load failed') ||
        errMsg.toLowerCase().includes('abort')

      if (looksLikeNetworkFail) {
        simpanKeOffline(validPoId, payloadItems)
      } else {
        setError(errMsg)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading && pekerjaList.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border-2 border-slate-300 bg-white p-5 shadow-sm">
          <Skeleton className="mb-3 h-7 w-40 rounded-full" />
          <Skeleton className="mb-2 h-9 w-64" />
          <Skeleton className="h-5 w-full" />
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
        <PageTitle
          icon={<User className="h-6 w-6" />}
          title="Pilih Nama Pekerja"
          subtitle="Ketuk nama pekerja untuk mulai mencatat hasil kerjanya hari ini."
          badge={
            <PillBadge color="emerald">
              <Calendar className="h-4 w-4" />
              {labelTanggalHariIni()}
            </PillBadge>
          }
        />

        {error && <ErrorBox message={error} onRetry={() => muatData()} />}

        <div className="space-y-3">
          {pekerjaList.map((p) => {
            const workerPoId = poMap[p.id_pekerja]
            const workerPo = workerPoId ? poList.find((po) => po.id_po === workerPoId) : null
            const hasShift = shiftMap[p.id_pekerja] !== undefined
            return (
              <button
                key={p.id_pekerja}
                onClick={() => pilihPekerja(p.id_pekerja)}
                className="flex w-full items-center justify-between gap-3 rounded-3xl border-2 border-slate-300 bg-white p-4 text-left shadow-sm transition-colors active:bg-emerald-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-emerald-100 text-emerald-800">
                    <User className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xl font-extrabold leading-tight tracking-tight text-slate-900">
                      {p.nama}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                      {hasShift && (
                        <PillBadge color={shiftMap[p.id_pekerja] === 1 ? 'amber' : 'indigo'}>
                          {shiftMap[p.id_pekerja] === 1 ? '☀️ Shift 1' : '🌙 Shift 2'}
                        </PillBadge>
                      )}
                      {workerPo && (
                        <PillBadge color="blue">
                          <Package className="h-4 w-4" />
                          {workerPo.no_po}
                        </PillBadge>
                      )}
                      {!hasShift && !workerPo && (
                        <span className="text-sm font-medium text-slate-500">
                          Belum ada catatan hari ini
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-700 bg-emerald-700 text-white">
                  <ChevronRight className="h-7 w-7" />
                </span>
              </button>
            )
          })}
        </div>

        {!loading && pekerjaList.length === 0 && !error && (
          <EmptyState
            icon={<User className="h-8 w-8" />}
            title="Belum ada nama pekerja"
            description="Minta admin pabrik menambahkan nama pekerja lewat menu Master Data terlebih dahulu."
            action={
              <BigButton variant="ghost" onClick={() => muatData()}>
                <RotateCw className="h-5 w-5" />
                Muat Ulang
              </BigButton>
            }
          />
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
        <PageTitle
          icon={<Layers className="h-6 w-6" />}
          title="Pilih Model Sepatu"
          subtitle="Pilih model sepatu yang dikerjakan. Setelah dipilih, Anda bisa mengisi jumlahnya."
        />

        {error && <ErrorBox message={error} />}

        <div className="space-y-3">
          {modelList.map((m) => (
            <button
              key={m.id_sepatu}
              onClick={() => onTambahItem(m.id_sepatu)}
              className="flex w-full items-center justify-between gap-3 rounded-3xl border-2 border-slate-300 bg-white p-4 text-left shadow-sm transition-colors active:bg-emerald-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-blue-300 bg-blue-100 text-blue-800">
                  <Layers className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xl font-extrabold leading-tight tracking-tight text-slate-900">
                    {m.nama_model}
                  </div>
                  <div className="text-base font-semibold text-slate-600">
                    Upah {formatRupiah(m.ongkos_kerja)} / pasang
                  </div>
                </div>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-700 bg-emerald-700 text-white">
                <Plus className="h-7 w-7" />
              </span>
            </button>
          ))}
        </div>

        {modelList.length === 0 && (
          <EmptyState
            icon={<Layers className="h-8 w-8" />}
            title="Belum ada model sepatu"
            description="Minta admin menambahkan model sepatu beserta upah per pasang di menu Master Data."
          />
        )}

        <BigButton variant="ghost" size="lg" className="w-full" onClick={() => setPilihModel(false)}>
          <ArrowLeft className="h-6 w-6" />
          Kembali
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
      {/* ---------- Pekerja yang sedang diisi ---------- */}
      <div className="flex items-center justify-between gap-3 rounded-3xl border-2 border-slate-950 bg-slate-900 p-4 text-white shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-2xl text-slate-900">
            👤
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-amber-300">Sedang mengisi data:</div>
            <h1 className="truncate text-xl font-extrabold leading-tight tracking-tight">
              {pekerja?.nama}
            </h1>
          </div>
        </div>
        <button
          onClick={() => {
            const hasUnsaved = newItems.some((it) => Object.values(it.qty).some((q) => q > 0))
            if (hasUnsaved) {
              requestConfirm({
                title: 'Data belum disimpan',
                message:
                  'Ada jumlah yang sudah Anda ketik tapi belum ditekan Simpan. Kalau kembali sekarang, isian itu akan hilang.',
                confirmLabel: 'Kembali, Hapus Isian',
                cancelLabel: 'Batal, Lanjut Mengisi',
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
          className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-2xl border-2 border-slate-600 bg-slate-800 px-3.5 text-base font-bold text-white active:bg-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
          Ganti
        </button>
      </div>

      {/* ---------- Langkah 1: Shift ---------- */}
      <StepCard step={1} title="Pilih Shift Kerja" hint="Pagi atau malam?" done>
        <div className="grid grid-cols-2 gap-3">
          {SHIFTS.map((s) => {
            const isShift1 = s.value === 1
            const isSelected = shift === s.value
            return (
              <button
                key={s.value}
                onClick={() => gantiShift(s.value)}
                aria-pressed={isSelected}
                className={`min-h-20 rounded-2xl border-2 p-3 text-center transition-colors ${
                  isSelected
                    ? isShift1
                      ? 'border-amber-600 bg-amber-400 text-slate-950'
                      : 'border-indigo-800 bg-indigo-700 text-white'
                    : 'border-slate-300 bg-white text-slate-700 active:bg-slate-100'
                }`}
              >
                <div className="text-lg font-extrabold tracking-tight">
                  {isShift1 ? '☀️ ' : '🌙 '}
                  {s.label}
                </div>
                <div
                  className={`mt-0.5 text-base font-semibold ${
                    isSelected ? 'opacity-80' : 'text-slate-500'
                  }`}
                >
                  {s.sub}
                </div>
                {isSelected && (
                  <div className="mt-1 text-sm font-extrabold">✓ Dipilih</div>
                )}
              </button>
            )
          })}
        </div>
      </StepCard>

      {/* ---------- Langkah 2: PO ---------- */}
      <StepCard
        step={2}
        title="Nomor Pesanan (PO)"
        hint={selectedPo ? 'Sudah dipilih' : 'Boleh dilewati jika pekerjaan biasa'}
        done={Boolean(selectedPo)}
      >
        {selectedPo ? (
          <div className="space-y-3 rounded-2xl border-2 border-sky-300 bg-sky-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Package className="h-6 w-6 shrink-0 text-sky-700" />
                <div className="min-w-0">
                  <div className="truncate text-xl font-extrabold text-sky-950">
                    {selectedPo.no_po}
                  </div>
                  {selectedPo.nama_customer && (
                    <div className="truncate text-base font-semibold text-sky-800">
                      {selectedPo.nama_customer}
                    </div>
                  )}
                </div>
              </div>
              <BigButton variant="blue" size="sm" onClick={() => setPilihPo(true)}>
                Ganti
              </BigButton>
            </div>
            {selectedPo.target_qty > 0 && (
              <div className="space-y-2 border-t-2 border-sky-200 pt-3">
                <PoProgress target={selectedPo.target_qty} achieved={poProjected} />
                {newTotal > 0 && (
                  <PillBadge color="emerald">+{newTotal} pasang belum disimpan</PillBadge>
                )}
                {poProjected > selectedPo.target_qty && (
                  <HintBox>
                    Jumlah yang diisi <b>melebihi target PO</b> sebanyak{' '}
                    <b>{poProjected - selectedPo.target_qty} pasang</b>. Mohon periksa lagi
                    angkanya.
                  </HintBox>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setPilihPo(true)}
            className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-sky-500 bg-sky-50 p-4 text-left active:bg-sky-100"
          >
            <span className="flex items-center gap-2.5">
              <Package className="h-6 w-6 shrink-0 text-sky-700" />
              <span className="text-base font-bold text-sky-950">
                Belum pilih PO — ketuk di sini
              </span>
            </span>
            <ChevronRight className="h-6 w-6 shrink-0 text-sky-700" />
          </button>
        )}
      </StepCard>

      {/* ---------- Data yang sudah tersimpan ---------- */}
      {savedList.length > 0 && (
        <section className="rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-extrabold uppercase tracking-wide text-emerald-900">
            <CheckCircle2 className="h-5 w-5" />
            Sudah tersimpan ({savedList.length} model)
          </h2>
          {loadingSaved ? (
            <Spinner />
          ) : (
            <div className="mt-3 space-y-2.5">
              {savedList.map((r) => {
                const model = modelList.find((m) => m.id_sepatu === Number(r.id_sepatu))
                const sum = (r.detail ?? []).reduce((x, d) => x + Number(d.qty), 0)
                const ringkas = (r.detail ?? [])
                  .filter((d) => Number(d.qty) > 0)
                  .map(
                    (d) =>
                      `No ${
                        ukuranList.find((u) => u.id_ukuran === Number(d.id_ukuran))?.label_ukuran ??
                        '?'
                      }: ${d.qty}`,
                  )
                  .join('  ·  ')
                return (
                  <div
                    key={r.id_produksi}
                    className="rounded-2xl border-2 border-slate-300 bg-white p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-lg font-extrabold text-slate-900">
                          {model?.nama_model ?? '?'}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <PillBadge color="emerald">{sum} pasang</PillBadge>
                          {r.no_po && <PillBadge color="blue">{r.no_po}</PillBadge>}
                          {r.id_produksi < 0 && (
                            <PillBadge color="amber">🟡 Menunggu Sinyal (Offline)</PillBadge>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {r.id_produksi > 0 && (
                          <button
                            onClick={() => bukaEdit(r)}
                            className="flex min-h-12 items-center gap-1.5 rounded-2xl border-2 border-blue-400 bg-blue-50 px-3.5 text-base font-bold text-blue-900 active:bg-blue-200"
                          >
                            <Edit3 className="h-5 w-5" />
                            Ubah
                          </button>
                        )}
                        <button
                          onClick={() => hapusLocked(r)}
                          aria-label="Hapus catatan ini"
                          className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-rose-400 bg-rose-50 text-rose-700 active:bg-rose-200"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    {ringkas && (
                      <div className="mt-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 p-2.5 text-base font-semibold text-slate-700">
                        {ringkas}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ---------- Langkah 3: Isi jumlah ---------- */}
      <StepCard
        step={3}
        title="Isi Jumlah Sepatu"
        hint="Isi jumlah pasang sesuai nomor ukuran"
        done={newTotal > 0}
        action={
          <BigButton variant="secondary" size="sm" onClick={() => setPilihModel(true)}>
            <Plus className="h-5 w-5" />
            Tambah Model
          </BigButton>
        }
      >
        {newItems.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-8 w-8" />}
            title="Belum ada model sepatu"
            description="Ketuk tombol biru “Tambah Model” di atas, lalu pilih model sepatu yang dikerjakan."
          />
        ) : (
          <div className="space-y-4">
            {newItems.map((it, idx) => {
              const model = modelList.find((m) => m.id_sepatu === it.id_sepatu)
              const subTotal = ukuranList.reduce(
                (x, u) => x + (it.qty[String(u.id_ukuran)] ?? 0),
                0,
              )
              return (
                <div
                  key={it.localId}
                  className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-emerald-200 pb-3">
                    <div className="min-w-0">
                      <div className="truncate text-lg font-extrabold text-slate-900">
                        {model?.nama_model ?? '?'}
                      </div>
                      <div className="text-base font-semibold text-emerald-800">
                        {model ? `${formatRupiah(model.ongkos_kerja)} / pasang` : ''}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-2xl border-2 border-emerald-800 bg-emerald-700 px-3 py-1.5 text-base font-extrabold text-white">
                        {subTotal} psg
                      </span>
                      <button
                        onClick={() =>
                          setNewItems((prev) => prev.filter((x) => x.localId !== it.localId))
                        }
                        aria-label="Hapus model ini dari isian"
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-rose-400 bg-white text-rose-700 active:bg-rose-200"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {ukuranList.map((u) => (
                      <NumberStepper
                        key={u.id_ukuran}
                        label={`No ${u.label_ukuran}`}
                        value={it.qty[String(u.id_ukuran)] ?? 0}
                        onChange={(val) =>
                          setNewItems((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? { ...x, qty: { ...x.qty, [String(u.id_ukuran)]: val } }
                                : x,
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </StepCard>

      {info && <SuccessBox message={info} />}
      {error && <ErrorBox message={error} />}

      {/* ---------- Ringkasan + Tombol Simpan ---------- */}
      <div className="space-y-3 rounded-3xl border-2 border-slate-950 bg-slate-900 p-4 sm:p-5 text-white shadow-md">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-base font-bold uppercase tracking-wide text-slate-300">
            Total hari ini
          </span>
          <span className="text-3xl font-extrabold leading-none text-emerald-400">
            {totalPasang}
            <span className="ml-1 text-base font-bold text-slate-300">pasang</span>
          </span>
        </div>
        {newTotal > 0 && (
          <div className="rounded-xl border-2 border-amber-500 bg-amber-400/15 p-2.5 text-base font-bold text-amber-200">
            {savedTotal} sudah tersimpan + {newTotal} pasang{' '}
            <span className="underline">belum disimpan</span>
          </div>
        )}
        <BigButton
          disabled={saving || newTotal <= 0}
          variant={newTotal > 0 ? 'primary' : 'ghost'}
          size="lg"
          onClick={simpan}
          className="w-full"
        >
          {saving ? (
            'MENYIMPAN...'
          ) : newTotal > 0 ? (
            <>
              <Save className="h-6 w-6" />
              SIMPAN ({jumlahBaruTerisi} MODEL)
            </>
          ) : (
            <>
              <CheckCircle2 className="h-6 w-6" />
              SEMUA SUDAH TERSIMPAN
            </>
          )}
        </BigButton>
      </div>

      {/* Modal Edit Item Tersimpan */}
      {editingRow && (
        <Modal
          isOpen={true}
          onClose={() => setEditingRow(null)}
          title={`Ubah: ${editingRow.nama_model ?? 'Model'}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <PillBadge color="neutral">👤 {pekerja?.nama}</PillBadge>
              <PillBadge color={editingRow.shift === 1 ? 'amber' : 'indigo'}>
                {editingRow.shift === 1 ? '☀️ Shift 1' : '🌙 Shift 2'}
              </PillBadge>
              {editingRow.no_po && <PillBadge color="blue">📦 {editingRow.no_po}</PillBadge>}
            </div>

            <div>
              <div className="mb-2 text-base font-bold text-slate-900">
                Ubah jumlah per nomor ukuran:
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {ukuranList.map((u) => (
                  <NumberStepper
                    key={u.id_ukuran}
                    label={`No ${u.label_ukuran}`}
                    value={editQty[String(u.id_ukuran)] || 0}
                    onChange={(val) =>
                      setEditQty((prev) => ({ ...prev, [String(u.id_ukuran)]: val }))
                    }
                  />
                ))}
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-3 rounded-2xl border-2 border-slate-950 bg-slate-900 px-4 py-3 text-white">
              <span className="text-base font-bold uppercase tracking-wide text-slate-300">
                Total
              </span>
              <span className="text-2xl font-extrabold text-emerald-400">
                {Object.values(editQty).reduce((a, b) => a + (Number(b) || 0), 0)} pasang
              </span>
            </div>

            {editError && <ErrorBox message={editError} />}

            <div className="space-y-2.5 pt-1">
              <BigButton
                variant="primary"
                type="button"
                className="w-full"
                onClick={simpanEdit}
                disabled={savingEdit}
              >
                {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </BigButton>
              <BigButton
                variant="ghost"
                type="button"
                className="w-full"
                onClick={() => setEditingRow(null)}
                disabled={savingEdit}
              >
                Batal
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
      <PageTitle
        icon={<Package className="h-6 w-6" />}
        title="Pilih Nomor Pesanan (PO)"
        subtitle="Pilih PO yang sedang dikerjakan. Jika pekerjaan biasa tanpa PO, ketuk tombol Lewati."
      />

      {error && <ErrorBox message={error} />}

      <button
        onClick={() => setIdPo(null)}
        className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-slate-500 bg-white p-4 text-left active:bg-slate-100"
      >
        <span className="text-lg font-bold text-slate-800">Lewati — tanpa nomor PO</span>
        <ChevronRight className="h-6 w-6 shrink-0 text-slate-600" />
      </button>

      <div className="space-y-3">
        {poList.map((p) => {
          const penuh = p.target_qty > 0 && p.achieved_qty >= p.target_qty
          const terpilih = p.id_po === idPo
          return (
            <button
              key={p.id_po}
              onClick={() => setIdPo(p.id_po)}
              aria-pressed={terpilih}
              className={`w-full rounded-3xl border-2 p-4 text-left shadow-sm transition-colors ${
                terpilih
                  ? 'border-sky-700 bg-sky-50 ring-4 ring-sky-300'
                  : 'border-slate-300 bg-white active:bg-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 ${
                      terpilih
                        ? 'border-sky-800 bg-sky-700 text-white'
                        : 'border-slate-300 bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xl font-extrabold tracking-tight text-slate-900">
                      {p.no_po}
                    </div>
                    {p.nama_customer && (
                      <div className="truncate text-base font-semibold text-slate-600">
                        {p.nama_customer}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {terpilih && <PillBadge color="blue">✓ Dipilih</PillBadge>}
                  {penuh && <PillBadge color="emerald">Target tercapai</PillBadge>}
                </div>
              </div>
              {p.target_qty > 0 ? (
                <div className="pointer-events-none mt-3 border-t-2 border-slate-100 pt-3">
                  <PoProgress target={p.target_qty} achieved={p.achieved_qty} />
                </div>
              ) : (
                <div className="mt-2 text-base font-semibold text-slate-600">
                  {p.achieved_qty > 0
                    ? `${p.achieved_qty} pasang sudah dicatat`
                    : 'Belum ada target jumlah'}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {poList.length === 0 && (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Belum ada nomor PO"
          description="Anda bisa menambahkan nomor PO baru lewat tombol di bawah, atau ketuk Lewati."
        />
      )}

      {/* Tambah PO Baru */}
      <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm">
        {tambahPoMode ? (
          <form onSubmit={submitPo} className="space-y-3">
            <div className="text-lg font-extrabold text-slate-900">Tambah Nomor PO Baru</div>
            <div>
              <FieldLabel htmlFor="po-nomor">Nomor PO</FieldLabel>
              <TextInput
                id="po-nomor"
                placeholder="contoh: PO-2026-003"
                value={poForm.no_po}
                onChange={(e) => setPoForm({ ...poForm, no_po: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel htmlFor="po-customer">Nama Customer (boleh dikosongkan)</FieldLabel>
              <TextInput
                id="po-customer"
                placeholder="contoh: Toko Maju"
                value={poForm.customer}
                onChange={(e) => setPoForm({ ...poForm, customer: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel htmlFor="po-target">Target Jumlah (pasang)</FieldLabel>
              <TextInput
                id="po-target"
                placeholder="contoh: 500"
                inputMode="numeric"
                value={poForm.target}
                onChange={(e) =>
                  setPoForm({ ...poForm, target: e.target.value.replace(/[^\d]/g, '') })
                }
              />
            </div>
            <div className="space-y-2.5 pt-1">
              <BigButton type="submit" variant="primary" className="w-full" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan PO Baru'}
              </BigButton>
              <BigButton
                variant="ghost"
                type="button"
                className="w-full"
                onClick={() => {
                  setTambahPoMode(false)
                  setError(null)
                }}
              >
                Batal
              </BigButton>
            </div>
          </form>
        ) : (
          <BigButton variant="secondary" className="w-full" onClick={() => setTambahPoMode(true)}>
            <Plus className="h-6 w-6" />
            Tambah Nomor PO Baru
          </BigButton>
        )}
      </div>

      <BigButton variant="ghost" size="lg" className="w-full" onClick={onBack}>
        <ArrowLeft className="h-6 w-6" />
        Kembali
      </BigButton>
    </div>
  )
}
