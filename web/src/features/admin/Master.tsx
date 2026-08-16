import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { MasterPo, MasterUkuran, Pekerja, TipeSepatu } from '../../lib/types'
import {
  getPekerjaSemua,
  getTipeSepatuSemua,
  getUkuranSemua,
  getPoSemua,
  tambahPekerja,
  ubahPekerja,
  tambahModel,
  ubahTipeSepatu,
  tambahUkuran,
  ubahUkuran,
  tambahPo,
  ubahPo,
  hapusPo,
  getCache,
} from '../../lib/api'
import { formatAngka, formatRupiah, tanggalHariIni } from '../../lib/constants'
import { BigButton, Card, ErrorBox, FieldLabel, SkeletonCard, TextInput } from '../../components/ui'
import { downloadExcelWorkbook } from '../../lib/laporan'
import PoProgress from '../../components/PoProgress'
import { Download, Layers, Package, Plus, Ruler, Trash2, User } from 'lucide-react'

type Tab = 'pekerja' | 'model' | 'ukuran' | 'po'

export default function Master() {
  const [tab, setTab] = useState<Tab>('pekerja')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Master Data</h1>
        <p className="text-xs text-neutral-500">
          Kelola master pekerja, model sepatu & ongkos, ukuran, serta PO customer.
        </p>
      </div>

      {error && <ErrorBox message={error} />}

      {/* Segmented Tab */}
      <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-neutral-100 p-1.5 shadow-inner">
        <button
          onClick={() => setTab('pekerja')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            tab === 'pekerja' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>Pekerja</span>
        </button>
        <button
          onClick={() => setTab('model')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            tab === 'model' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Model</span>
        </button>
        <button
          onClick={() => setTab('ukuran')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            tab === 'ukuran' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Ruler className="h-3.5 w-3.5" />
          <span>Ukuran</span>
        </button>
        <button
          onClick={() => setTab('po')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            tab === 'po' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          <span>PO</span>
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'pekerja' && <TabPekerja setError={setError} />}
      {tab === 'model' && <TabModel setError={setError} />}
      {tab === 'ukuran' && <TabUkuran setError={setError} />}
      {tab === 'po' && <TabPo setError={setError} />}
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

function TabPekerja({ setError }: { setError: (m: string | null) => void }) {
  const { list, setList, loading, reload } = useList(getPekerjaSemua, setError, 'pekerja_semua')
  const [nama, setNama] = useState('')

  async function tambah(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim()) return
    try {
      await tambahPekerja(nama.trim())
      setNama('')
      await reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }
  async function toggle(p: Pekerja) {
    try {
      await ubahPekerja(p.id_pekerja, { status_aktif: !p.status_aktif })
      setList((prev) =>
        prev.map((x) => (x.id_pekerja === p.id_pekerja ? { ...x, status_aktif: !x.status_aktif } : x)),
      )
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <form onSubmit={tambah} className="space-y-2">
          <FieldLabel>Tambah Pekerja Baru</FieldLabel>
          <div className="flex gap-2">
            <TextInput
              placeholder="Ketik nama pekerja"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="flex-1 py-2.5"
            />
            <BigButton type="submit" className="py-2.5 px-4">
              <Plus className="h-4 w-4" />
            </BigButton>
          </div>
        </form>
      </Card>

      {loading && list.length === 0 ? (
        <div className="space-y-2.5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map((p) => (
            <Card key={p.id_pekerja}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className={`text-base font-semibold ${p.status_aktif ? 'text-neutral-900' : 'text-neutral-400 line-through'}`}>
                      {p.nama}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggle(p)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    p.status_aktif ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {p.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function TabModel({ setError }: { setError: (m: string | null) => void }) {
  const { list, setList, loading, reload } = useList(getTipeSepatuSemua, setError, 'tipe_sepatu_semua')
  const [nama, setNama] = useState('')
  const [ongkos, setOngkos] = useState('')

  async function tambah(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim()) return
    try {
      await tambahModel(nama.trim(), Number(ongkos) || 0)
      setNama('')
      setOngkos('')
      await reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }
  async function simpanHarga(m: TipeSepatu) {
    try {
      await ubahTipeSepatu(m.id_sepatu, { ongkos_kerja: m.ongkos_kerja })
      setError('Harga disimpan. Berlaku untuk data baru (periode lama tetap terkunci).')
    } catch (err) {
      setError((err as Error).message)
    }
  }
  async function toggle(m: TipeSepatu) {
    try {
      await ubahTipeSepatu(m.id_sepatu, { status_aktif: !m.status_aktif })
      setList((prev) =>
        prev.map((x) => (x.id_sepatu === m.id_sepatu ? { ...x, status_aktif: !x.status_aktif } : x)),
      )
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <form onSubmit={tambah} className="space-y-3">
          <FieldLabel>Tambah Model Sepatu & Tarif Upah</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <TextInput placeholder="Nama model (cth: Futsal)" value={nama} onChange={(e) => setNama(e.target.value)} />
            <TextInput
              placeholder="Ongkos (cth: 1200)"
              inputMode="numeric"
              value={ongkos}
              onChange={(e) => setOngkos(e.target.value.replace(/[^\d]/g, ''))}
            />
          </div>
          <BigButton type="submit" className="w-full py-2.5">
            + Tambah Model
          </BigButton>
        </form>
      </Card>

      {loading && list.length === 0 ? (
        <div className="space-y-2.5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map((m) => (
            <Card key={m.id_sepatu}>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                    <Layers className="h-4 w-4" />
                  </div>
                  <span className={`text-base font-semibold ${m.status_aktif ? 'text-neutral-900' : 'text-neutral-400 line-through'}`}>
                    {m.nama_model}
                  </span>
                </div>
                <button
                  onClick={() => toggle(m)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    m.status_aktif ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {m.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-500">Tarif:</span>
                <input
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
                  className="w-28 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm font-bold text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none"
                />
                <span className="text-xs text-neutral-500">= {formatRupiah(m.ongkos_kerja)}/psg</span>
                <button
                  className="ml-auto rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
                  onClick={() => simpanHarga(m)}
                >
                  Simpan
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function TabUkuran({ setError }: { setError: (m: string | null) => void }) {
  const { list, setList, loading, reload } = useList(getUkuranSemua, setError, 'ukuran_semua')
  const [label, setLabel] = useState('')

  async function tambah(e: FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    try {
      await tambahUkuran(label.trim())
      setLabel('')
      await reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }
  async function toggle(u: MasterUkuran) {
    try {
      await ubahUkuran(u.id_ukuran, !u.status_aktif)
      setList((prev) =>
        prev.map((x) => (x.id_ukuran === u.id_ukuran ? { ...x, status_aktif: !x.status_aktif } : x)),
      )
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <form onSubmit={tambah} className="space-y-2">
          <FieldLabel>Tambah Ukuran Baru</FieldLabel>
          <div className="flex gap-2">
            <TextInput
              placeholder="cth: 45"
              inputMode="numeric"
              value={label}
              onChange={(e) => setLabel(e.target.value.replace(/[^\d]/g, ''))}
              className="flex-1 py-2.5"
            />
            <BigButton type="submit" className="py-2.5 px-4">
              <Plus className="h-4 w-4" />
            </BigButton>
          </div>
        </form>
      </Card>

      {loading && list.length === 0 ? (
        <SkeletonCard />
      ) : (
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Daftar Ukuran Aktif
          </div>
          <div className="flex flex-wrap gap-2">
            {list.map((u) => (
              <button
                key={u.id_ukuran}
                onClick={() => toggle(u)}
                className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                  u.status_aktif
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-400 line-through'
                }`}
              >
                {u.label_ukuran}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            Hitam = aktif (muncul di form mandor). Ketuk nomor untuk menonaktifkan.
          </p>
        </div>
      )}
    </div>
  )
}

function TabPo({ setError }: { setError: (m: string | null) => void }) {
  const { list, setList, loading, reload } = useList(getPoSemua, setError, 'po_semua')
  const [noPo, setNoPo] = useState('')
  const [customer, setCustomer] = useState('')
  const [target, setTarget] = useState('')

  async function tambah(e: FormEvent) {
    e.preventDefault()
    if (!noPo.trim()) return
    try {
      await tambahPo(noPo.trim(), customer.trim(), Number(target) || 0)
      setNoPo('')
      setCustomer('')
      setTarget('')
      await reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }
  async function simpanTarget(p: MasterPo) {
    try {
      await ubahPo(p.id_po, { target_qty: p.target_qty })
      setError('Target PO disimpan.')
    } catch (err) {
      setError((err as Error).message)
    }
  }
  async function toggle(p: MasterPo) {
    try {
      await ubahPo(p.id_po, { status_aktif: !p.status_aktif })
      setList((prev) =>
        prev.map((x) => (x.id_po === p.id_po ? { ...x, status_aktif: !x.status_aktif } : x)),
      )
    } catch (err) {
      setError((err as Error).message)
    }
  }
  async function onHapusPo(p: MasterPo) {
    if (!window.confirm(`Hapus/arsipkan PO "${p.no_po}"?`)) return
    try {
      await hapusPo(p.id_po)
      await reload()
    } catch (err) {
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
      {/* Summary Card */}
      <div className="rounded-2xl bg-neutral-900 p-4 text-white shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Semua PO</div>
            <div className="mt-1 text-2xl font-bold tracking-tight">{list.length} PO</div>
            <div className="mt-1 text-xs text-neutral-300">
              Terisi{' '}
              <span className="font-bold text-emerald-400">
                {formatAngka(totalTerisi)} / {formatAngka(totalTarget)}
              </span>{' '}
              pasang
              {totalTarget > 0 && (
                <span className="ml-1">({Math.round((totalTerisi / totalTarget) * 100)}%)</span>
              )}
            </div>
          </div>
          {list.length > 0 && (
            <button
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
              onClick={exportExcel}
            >
              <Download className="h-3 w-3" />
              <span>Ekspor</span>
            </button>
          )}
        </div>
      </div>

      {/* Tambah PO Form */}
      <Card>
        <form onSubmit={tambah} className="space-y-3">
          <FieldLabel>Tambah Purchase Order (PO)</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <TextInput placeholder="No PO (cth: PO-2026-001)" value={noPo} onChange={(e) => setNoPo(e.target.value)} />
            <TextInput placeholder="Customer (opsional)" value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </div>
          <TextInput
            placeholder="Target jumlah (pasang), sesuai order customer"
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ''))}
          />
          <BigButton type="submit" className="w-full py-2.5">+ Tambah PO</BigButton>
        </form>
      </Card>

      {/* PO List */}
      {loading && list.length === 0 ? (
        <div className="space-y-2.5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map((p) => (
            <Card key={p.id_po}>
              <div className="flex items-start justify-between">
                <div>
                  <div className={`text-base font-semibold ${p.status_aktif ? 'text-neutral-900' : 'text-neutral-400 line-through'}`}>
                    📦 {p.no_po}
                  </div>
                  {p.nama_customer && <div className="text-xs text-neutral-500">{p.nama_customer}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggle(p)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      p.status_aktif ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {p.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => onHapusPo(p)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-700 transition-colors"
                    title="Hapus PO"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <span className="shrink-0 text-xs font-semibold text-neutral-500">Target</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={p.target_qty}
                  onChange={(e) =>
                    setList((prev) =>
                      prev.map((x) =>
                        x.id_po === p.id_po ? { ...x, target_qty: Number(e.target.value) || 0 } : x,
                      ),
                    )
                  }
                  className="w-24 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm font-bold text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none"
                />
                <span className="text-xs text-neutral-500">pasang</span>
                <button
                  className="ml-auto rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
                  onClick={() => simpanTarget(p)}
                >
                  Simpan
                </button>
              </div>

              <div className="mt-2">
                <PoProgress target={p.target_qty} achieved={p.achieved_qty} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
