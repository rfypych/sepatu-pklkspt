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
} from '../../lib/api'
import { formatRupiah } from '../../lib/constants'
import { BigButton, Card, ErrorBox, FieldLabel, Spinner, TextInput } from '../../components/ui'
import PoProgress from '../../components/PoProgress'

type Tab = 'pekerja' | 'model' | 'ukuran' | 'po'

export default function Master() {
  const [tab, setTab] = useState<Tab>('pekerja')
  const [error, setError] = useState<string | null>(null)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pekerja', label: 'Pekerja' },
    { id: 'model', label: 'Model & Ongkos' },
    { id: 'ukuran', label: 'Ukuran' },
    { id: 'po', label: 'PO' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Master Data</h1>
        <p className="text-sm text-slate-500">Semua bisa diubah tanpa bongkar kode.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              tab === t.id ? 'bg-sky-600 text-white' : 'text-slate-600 active:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <ErrorBox message={error} />}

      {tab === 'pekerja' && <TabPekerja setError={setError} />}
      {tab === 'model' && <TabModel setError={setError} />}
      {tab === 'ukuran' && <TabUkuran setError={setError} />}
      {tab === 'po' && <TabPo setError={setError} />}
    </div>
  )
}

function useList<T>(load: () => Promise<T[]>, setError: (m: string | null) => void) {
  const [list, setList] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    try {
      setList(await load())
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
  const { list, setList, loading, reload } = useList(getPekerjaSemua, setError)
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
      await ubahPekerja(p.id_pekerja, { status_aktif: !Boolean(p.status_aktif) })
      setList((prev) =>
        prev.map((x) => (x.id_pekerja === p.id_pekerja ? { ...x, status_aktif: !x.status_aktif } : x)),
      )
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) return <Spinner />
  return (
    <div className="space-y-3">
      <Card>
        <form onSubmit={tambah} className="space-y-2">
          <FieldLabel>Tambah Pekerja</FieldLabel>
          <div className="flex gap-2">
            <TextInput
              placeholder="Nama pekerja"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="flex-1 py-2.5"
            />
            <BigButton type="submit" className="py-2.5">+</BigButton>
          </div>
        </form>
      </Card>
      {list.map((p) => (
        <Card key={p.id_pekerja} className="flex items-center justify-between">
          <span className={`font-semibold ${p.status_aktif ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
            {p.nama}
          </span>
          <button
            onClick={() => toggle(p)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              p.status_aktif ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {p.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        </Card>
      ))}
    </div>
  )
}

function TabModel({ setError }: { setError: (m: string | null) => void }) {
  const { list, setList, loading, reload } = useList(getTipeSepatuSemua, setError)
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
      setError('Harga disimpan. Berlaku untuk data baru (periode lama tidak berubah).')
    } catch (err) {
      setError((err as Error).message)
    }
  }
  async function toggle(m: TipeSepatu) {
    try {
      await ubahTipeSepatu(m.id_sepatu, { status_aktif: !Boolean(m.status_aktif) })
      setList((prev) =>
        prev.map((x) => (x.id_sepatu === m.id_sepatu ? { ...x, status_aktif: !x.status_aktif } : x)),
      )
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) return <Spinner />
  return (
    <div className="space-y-3">
      <Card>
        <form onSubmit={tambah} className="space-y-2">
          <FieldLabel>Tambah Model Sepatu</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <TextInput placeholder="Nama model" value={nama} onChange={(e) => setNama(e.target.value)} />
            <TextInput
              placeholder="Ongkos (Rp/pasang)"
              inputMode="numeric"
              value={ongkos}
              onChange={(e) => setOngkos(e.target.value.replace(/[^\d]/g, ''))}
            />
          </div>
          <BigButton type="submit" className="w-full py-2.5">+ Tambah</BigButton>
        </form>
      </Card>

      {list.map((m) => (
        <Card key={m.id_sepatu}>
          <div className="flex items-center justify-between">
            <span className={`font-semibold ${m.status_aktif ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
              {m.nama_model}
            </span>
            <button
              onClick={() => toggle(m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                m.status_aktif ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {m.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
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
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span className="text-xs text-slate-500">= {formatRupiah(m.ongkos_kerja)}/pasang</span>
            <BigButton variant="secondary" className="py-2" onClick={() => simpanHarga(m)}>
              Simpan
            </BigButton>
          </div>
        </Card>
      ))}
    </div>
  )
}

function TabUkuran({ setError }: { setError: (m: string | null) => void }) {
  const { list, setList, loading, reload } = useList(getUkuranSemua, setError)
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
      await ubahUkuran(u.id_ukuran, !Boolean(u.status_aktif))
      setList((prev) =>
        prev.map((x) => (x.id_ukuran === u.id_ukuran ? { ...x, status_aktif: !x.status_aktif } : x)),
      )
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) return <Spinner />
  return (
    <div className="space-y-3">
      <Card>
        <form onSubmit={tambah} className="space-y-2">
          <FieldLabel>Tambah Ukuran</FieldLabel>
          <div className="flex gap-2">
            <TextInput
              placeholder="cth: 45"
              inputMode="numeric"
              value={label}
              onChange={(e) => setLabel(e.target.value.replace(/[^\d]/g, ''))}
              className="flex-1 py-2.5"
            />
            <BigButton type="submit" className="py-2.5">+</BigButton>
          </div>
        </form>
      </Card>
      <div className="flex flex-wrap gap-2">
        {list.map((u) => (
          <button
            key={u.id_ukuran}
            onClick={() => toggle(u)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              u.status_aktif ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400 line-through'
            }`}
          >
            {u.label_ukuran}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">Hijau = aktif (muncul di form mandor). Klik untuk menonaktifkan.</p>
    </div>
  )
}

function TabPo({ setError }: { setError: (m: string | null) => void }) {
  const { list, setList, loading, reload } = useList(getPoSemua, setError)
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
      await ubahPo(p.id_po, { status_aktif: !Boolean(p.status_aktif) })
      setList((prev) =>
        prev.map((x) => (x.id_po === p.id_po ? { ...x, status_aktif: !x.status_aktif } : x)),
      )
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) return <Spinner />
  return (
    <div className="space-y-3">
      <Card>
        <form onSubmit={tambah} className="space-y-2">
          <FieldLabel>Tambah PO</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <TextInput placeholder="No PO (cth: PO-2026-001)" value={noPo} onChange={(e) => setNoPo(e.target.value)} />
            <TextInput placeholder="Customer (opsional)" value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </div>
          <TextInput
            placeholder="Target jumlah (pasang), sesuai qty PO customer"
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ''))}
          />
          <BigButton type="submit" className="w-full py-2.5">+ Tambah</BigButton>
        </form>
      </Card>

      {list.map((p) => (
        <Card key={p.id_po}>
          <div className="flex items-start justify-between">
            <div>
              <div className={`font-semibold ${p.status_aktif ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                📦 {p.no_po}
              </div>
              {p.nama_customer && <div className="text-sm text-slate-500">{p.nama_customer}</div>}
            </div>
            <button
              onClick={() => toggle(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                p.status_aktif ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {p.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="shrink-0 text-xs text-slate-500">Target</span>
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
              className="w-24 rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span className="text-xs text-slate-500">pasang</span>
            <BigButton variant="secondary" className="py-1.5" onClick={() => simpanTarget(p)}>
              Simpan
            </BigButton>
          </div>

          <PoProgress target={p.target_qty} achieved={p.achieved_qty} />
        </Card>
      ))}
    </div>
  )
}
