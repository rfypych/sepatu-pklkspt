import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { MasterPo, MasterUkuran, Pekerja, TipeSepatu } from '../../lib/types'
import { formatRupiah } from '../../lib/constants'
import { BigButton, Card, ErrorBox, FieldLabel, Spinner, TextInput } from '../../components/ui'

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

function useList<T>(query: () => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const [list, setList] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data, error } = await query()
    if (!error) setList((data ?? []) as T[])
    setLoading(false)
  }, [query])
  useEffect(() => {
    load()
  }, [load])
  return { list, setList, loading, reload: load }
}

function TabPekerja({ setError }: { setError: (m: string | null) => void }) {
  const { list, setList, loading, reload } = useList<Pekerja>(() =>
    supabase.from('pekerja').select('*').order('nama'),
  )
  const [nama, setNama] = useState('')

  async function tambah(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim()) return
    const { error } = await supabase.from('pekerja').insert({ nama: nama.trim() })
    if (error) return setError(error.message)
    setNama('')
    reload()
  }
  async function toggle(p: Pekerja) {
    const { error } = await supabase
      .from('pekerja')
      .update({ status_aktif: !p.status_aktif })
      .eq('id_pekerja', p.id_pekerja)
    if (error) return setError(error.message)
    setList((prev) =>
      prev.map((x) => (x.id_pekerja === p.id_pekerja ? { ...x, status_aktif: !x.status_aktif } : x)),
    )
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
  const { list, setList, loading, reload } = useList<TipeSepatu>(() =>
    supabase.from('tipe_sepatu').select('*').order('nama_model'),
  )
  const [nama, setNama] = useState('')
  const [ongkos, setOngkos] = useState('')

  async function tambah(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim()) return
    const { error } = await supabase
      .from('tipe_sepatu')
      .insert({ nama_model: nama.trim(), ongkos_kerja: Number(ongkos) || 0 })
    if (error) return setError(error.message)
    setNama('')
    setOngkos('')
    reload()
  }
  async function simpanHarga(m: TipeSepatu) {
    const { error } = await supabase
      .from('tipe_sepatu')
      .update({ ongkos_kerja: m.ongkos_kerja })
      .eq('id_sepatu', m.id_sepatu)
    if (error) return setError(error.message)
    setError('Harga disimpan. Berlaku untuk data baru (periode lama tidak berubah).')
  }
  async function toggle(m: TipeSepatu) {
    const { error } = await supabase
      .from('tipe_sepatu')
      .update({ status_aktif: !m.status_aktif })
      .eq('id_sepatu', m.id_sepatu)
    if (error) return setError(error.message)
    setList((prev) =>
      prev.map((x) => (x.id_sepatu === m.id_sepatu ? { ...x, status_aktif: !x.status_aktif } : x)),
    )
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
  const { list, setList, loading, reload } = useList<MasterUkuran>(() =>
    supabase.from('master_ukuran').select('*').order('urutan'),
  )
  const [label, setLabel] = useState('')

  async function tambah(e: FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    const maxUrutan = list.reduce((a, u) => Math.max(a, u.urutan), 0)
    const { error } = await supabase
      .from('master_ukuran')
      .insert({ label_ukuran: label.trim(), urutan: maxUrutan + 1 })
    if (error) return setError(error.message)
    setLabel('')
    reload()
  }
  async function toggle(u: MasterUkuran) {
    const { error } = await supabase
      .from('master_ukuran')
      .update({ status_aktif: !u.status_aktif })
      .eq('id_ukuran', u.id_ukuran)
    if (error) return setError(error.message)
    setList((prev) =>
      prev.map((x) => (x.id_ukuran === u.id_ukuran ? { ...x, status_aktif: !x.status_aktif } : x)),
    )
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
  const { list, setList, loading, reload } = useList<MasterPo>(() =>
    supabase.from('master_po').select('*').order('no_po'),
  )
  const [noPo, setNoPo] = useState('')
  const [customer, setCustomer] = useState('')

  async function tambah(e: FormEvent) {
    e.preventDefault()
    if (!noPo.trim()) return
    const { error } = await supabase
      .from('master_po')
      .insert({ no_po: noPo.trim(), nama_customer: customer.trim() || null })
    if (error) return setError(error.message)
    setNoPo('')
    setCustomer('')
    reload()
  }
  async function toggle(p: MasterPo) {
    const { error } = await supabase
      .from('master_po')
      .update({ status_aktif: !p.status_aktif })
      .eq('id_po', p.id_po)
    if (error) return setError(error.message)
    setList((prev) =>
      prev.map((x) => (x.id_po === p.id_po ? { ...x, status_aktif: !x.status_aktif } : x)),
    )
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
          <BigButton type="submit" className="w-full py-2.5">+ Tambah</BigButton>
        </form>
      </Card>

      {list.map((p) => (
        <Card key={p.id_po} className="flex items-center justify-between">
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
        </Card>
      ))}
    </div>
  )
}
