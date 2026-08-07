import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPekerjaAktif,
  getPoAktif,
  getTipeSepatuAktif,
  getUkuranAktif,
  simpanProduksiBatch,
  simpanProduksi,
} from '../../lib/api'
import type { MasterPo, MasterUkuran, Pekerja, TipeSepatu } from '../../lib/types'
import { SHIFTS, formatRupiah, tanggalHariIni } from '../../lib/constants'
import { BigButton, Card, ErrorBox, Spinner } from '../../components/ui'

// Mode input:
//  - 'bertahap': wizard lama (pekerja -> shift -> satu model -> qty per ukuran)
//  - 'tabel': satu layar, tambah banyak item berurutan, satu SIMPAN (seperti kertas)
type Mode = 'bertahap' | 'tabel'

export default function InputProduksi() {
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('tabel')
  const [pekerjaList, setPekerjaList] = useState<Pekerja[]>([])
  const [modelList, setModelList] = useState<TipeSepatu[]>([])
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>([])
  const [poList, setPoList] = useState<MasterPo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [sukses, setSukses] = useState(false)
  const [suksesInfo, setSuksesInfo] = useState<string>('')

  // State dipakai kedua mode
  const [idPekerja, setIdPekerja] = useState<number | null>(null)
  const [shift, setShift] = useState<1 | 2>(1)
  const [idPo, setIdPo] = useState<number | null>(null)

  // Mode bertahap (wizard lama)
  const [step, setStep] = useState<'pekerja' | 'shift' | 'model' | 'po' | 'qty' | 'ringkas'>('pekerja')
  const [idSepatu, setIdSepatu] = useState<number | null>(null)
  const [qty, setQty] = useState<Record<string, number>>({})

  // Mode tabel: daftar item yang sudah ditambahkan
  const [items, setItems] = useState<{ id_sepatu: number; qty: Record<string, number> }[]>([])

  useEffect(() => {
    Promise.all([getPekerjaAktif(), getTipeSepatuAktif(), getUkuranAktif(), getPoAktif()])
      .then(([p, m, u, po]) => {
        setPekerjaList(p)
        setModelList(m)
        setUkuranList(u)
        setPoList(po)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function resetBaru() {
    // Selesai simpan: kembali ke pilih pekerja (pertahankan mode)
    setIdPekerja(null)
    setIdPo(null)
    setIdSepatu(null)
    setQty({})
    setItems([])
    setStep('pekerja')
    setSukses(false)
    setSuksesInfo('')
    setError(null)
  }

  if (loading) return <Spinner />

  const pekerja = pekerjaList.find((p) => p.id_pekerja === idPekerja)

  if (sukses) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl">✅</div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Data Tersimpan!</h2>
        <p className="mt-1 text-sm text-slate-500">
          {pekerja?.nama} · {shift === 1 ? 'Shift 1' : 'Shift 2'} · {suksesInfo}
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
          <BigButton onClick={resetBaru} className="w-full">
            Input Lagi
          </BigButton>
          <BigButton variant="ghost" onClick={() => navigate('/mandor/riwayat')}>
            Lihat Riwayat Hari Ini
          </BigButton>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      {/* Pilih mode */}
      <div className="mb-4 flex gap-2">
        {(
          [
            { id: 'tabel', label: '📋 Tabel' },
            { id: 'bertahap', label: '🪜 Bertahap' },
          ] as { id: Mode; label: string }[]
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id)
              setError(null)
            }}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
              mode === m.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3">
          <ErrorBox message={error} />
        </div>
      )}

      {mode === 'tabel' ? (
        <InputTabel
          pekerjaList={pekerjaList}
          modelList={modelList}
          ukuranList={ukuranList}
          poList={poList}
          idPekerja={idPekerja}
          setIdPekerja={setIdPekerja}
          shift={shift}
          setShift={setShift}
          idPo={idPo}
          setIdPo={setIdPo}
          items={items}
          setItems={setItems}
          onSimpan={async (payload) => {
            const r = await simpanProduksiBatch(payload)
            setSuksesInfo(
              `${r.jumlah} item · ${payload.items.reduce((a, it) => a + it.qtyPerUkuran.reduce((x, d) => x + d.qty, 0), 0)} pasang`,
            )
          }}
        />
      ) : (
        <InputBertahap
          pekerjaList={pekerjaList}
          modelList={modelList}
          ukuranList={ukuranList}
          poList={poList}
          idPekerja={idPekerja}
          setIdPekerja={setIdPekerja}
          shift={shift}
          setShift={setShift}
          idPo={idPo}
          setIdPo={setIdPo}
          step={step}
          setStep={setStep}
          idSepatu={idSepatu}
          setIdSepatu={setIdSepatu}
          qty={qty}
          setQty={setQty}
          onSimpan={async () => {
            const r = await simpanProduksi({
              tanggal: tanggalHariIni(),
              shift,
              id_pekerja: idPekerja ?? 0,
              id_sepatu: idSepatu ?? 0,
              id_po: idPo,
              qtyPerUkuran: ukuranList.map((u) => ({
                id_ukuran: String(u.id_ukuran),
                qty: qty[String(u.id_ukuran)] ?? 0,
              })),
            })
            void r
            const total = ukuranList.reduce((a, u) => a + (qty[String(u.id_ukuran)] ?? 0), 0)
            const model = modelList.find((m) => m.id_sepatu === idSepatu)
            setSuksesInfo(`${model?.nama_model ?? ''} · ${total} pasang`)
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// MODE TABEL — tambah banyak item berurutan, simpan sekali
// ============================================================================
function InputTabel({
  pekerjaList,
  modelList,
  ukuranList,
  poList,
  idPekerja,
  setIdPekerja,
  shift,
  setShift,
  idPo,
  setIdPo,
  items,
  setItems,
  onSimpan,
}: {
  pekerjaList: Pekerja[]
  modelList: TipeSepatu[]
  ukuranList: MasterUkuran[]
  poList: MasterPo[]
  idPekerja: number | null
  setIdPekerja: (id: number) => void
  shift: 1 | 2
  setShift: (s: 1 | 2) => void
  idPo: number | null
  setIdPo: (id: number | null) => void
  items: { id_sepatu: number; qty: Record<string, number> }[]
  setItems: React.Dispatch<React.SetStateAction<{ id_sepatu: number; qty: Record<string, number> }[]>>
  onSimpan: (payload: import('../../lib/api').SimpanBatchInput) => Promise<void>
}) {
  const [pilihModel, setPilihModel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const totalPasang = items.reduce(
    (a, it) => a + ukuranList.reduce((x, u) => x + (it.qty[String(u.id_ukuran)] ?? 0), 0),
    0,
  )

  function hitungPerItem(it: { id_sepatu: number; qty: Record<string, number> }) {
    return ukuranList.reduce((x, u) => x + (it.qty[String(u.id_ukuran)] ?? 0), 0)
  }

  function onTambahItem(idSepatu: number) {
    if (items.some((it) => it.id_sepatu === idSepatu)) {
      setError('Item tersebut sudah ada. Edit jumlahnya di bawah.')
      setPilihModel(false)
      return
    }
    setItems((prev) => [...prev, { id_sepatu: idSepatu, qty: {} }])
    setPilihModel(false)
    setError(null)
  }

  function hapusItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function setItemQty(idx: number, idUkuran: string, val: number) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, qty: { ...it.qty, [idUkuran]: Math.max(0, Math.floor(val || 0)) } } : it,
      ),
    )
  }

  async function simpan() {
    if (!idPekerja) return
    const payloadItems = items
      .map((it) => ({
        id_sepatu: it.id_sepatu,
        qtyPerUkuran: ukuranList.map((u) => ({
          id_ukuran: String(u.id_ukuran),
          qty: it.qty[String(u.id_ukuran)] ?? 0,
        })),
      }))
      .filter((it) => it.qtyPerUkuran.some((d) => d.qty > 0))

    if (payloadItems.length === 0) {
      setError('Belum ada item yang diisi jumlahnya.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSimpan({
        tanggal: tanggalHariIni(),
        shift,
        id_pekerja: idPekerja,
        id_po: idPo,
        items: payloadItems,
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!idPekerja) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-bold text-slate-900">Pilih Pekerja</h1>
        {pekerjaList.map((p) => (
          <button
            key={p.id_pekerja}
            onClick={() => setIdPekerja(p.id_pekerja)}
            className="w-full rounded-2xl border-2 border-transparent bg-white p-4 text-left text-base font-semibold text-slate-800 shadow-sm transition-colors active:border-emerald-500 active:bg-emerald-50"
          >
            👤 {p.nama}
          </button>
        ))}
        {pekerjaList.length === 0 && <p className="text-sm text-slate-500">Belum ada pekerja aktif.</p>}
      </div>
    )
  }

  if (pilihModel) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-bold text-slate-900">Pilih Item</h1>
        {modelList.map((m) => (
          <button
            key={m.id_sepatu}
            onClick={() => onTambahItem(m.id_sepatu)}
            className="flex w-full items-center justify-between rounded-2xl border-2 border-transparent bg-white p-4 shadow-sm transition-colors active:border-emerald-500 active:bg-emerald-50"
          >
            <span className="text-base font-semibold text-slate-800">👟 {m.nama_model}</span>
            <span className="text-sm text-slate-500">{formatRupiah(m.ongkos_kerja)}/pasang</span>
          </button>
        ))}
        {error && (
          <div>
            <ErrorBox message={error} />
          </div>
        )}
        <BigButton variant="ghost" className="w-full" onClick={() => setPilihModel(false)}>
          ← Kembali
        </BigButton>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Input Produksi</h1>
        <div className="text-sm text-slate-500">{pekerjaList.find((p) => p.id_pekerja === idPekerja)?.nama}</div>
      </div>

      {/* Shift */}
      <div>
        <div className="mb-2 text-sm font-semibold text-slate-600">Shift</div>
        <div className="grid grid-cols-2 gap-2">
          {SHIFTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setShift(s.value)}
              className={`rounded-2xl p-3 text-center shadow-sm transition-colors ${
                shift === s.value
                  ? 'bg-emerald-600 text-white'
                  : 'border-2 border-transparent bg-white text-slate-800 active:bg-emerald-50'
              }`}
            >
              <div className="font-bold">{s.label}</div>
              <div className="text-xs opacity-80">{s.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* PO (opsional) */}
      <div>
        <div className="mb-2 text-sm font-semibold text-slate-600">PO (opsional)</div>
        <select
          value={idPo ?? ''}
          onChange={(e) => setIdPo(e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Lewati (tanpa PO)</option>
          {poList.map((p) => (
            <option key={p.id_po} value={p.id_po}>
              {p.no_po}
              {p.nama_customer ? ` — ${p.nama_customer}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Daftar item yang sudah ditambahkan */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-600">
            Item ({items.length}) <span className="font-normal text-slate-400">· isi jumlah per ukuran</span>
          </div>
          <BigButton variant="secondary" className="px-3 py-2 text-sm" onClick={() => setPilihModel(true)}>
            + Tambah Item
          </BigButton>
        </div>

        {items.length === 0 ? (
          <Card className="text-center text-slate-500">
            <div className="text-3xl">👟</div>
            <p className="mt-1 text-sm">
              Belum ada item. Tekan <b>+ Tambah Item</b> lalu pilih model yang keluar dari loker.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((it, idx) => {
              const model = modelList.find((m) => m.id_sepatu === it.id_sepatu)
              const subTotal = hitungPerItem(it)
              return (
                <Card key={idx}>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">👟 {model?.nama_model ?? '?'}</div>
                      <div className="text-xs text-slate-500">
                        {model ? `${formatRupiah(model.ongkos_kerja)}/pasang` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-700">{subTotal} psg</span>
                      <button onClick={() => hapusItem(idx)} className="rounded-lg px-2 py-1 text-xs font-bold text-rose-600">
                        🗑
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {ukuranList.map((u) => (
                      <div key={u.id_ukuran}>
                        <div className="text-center text-xs font-semibold text-slate-500">{u.label_ukuran}</div>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          placeholder="0"
                          value={it.qty[String(u.id_ukuran)] ?? ''}
                          onChange={(e) => setItemQty(idx, String(u.id_ukuran), Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-300 px-2 py-2.5 text-center text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {error && <ErrorBox message={error} />}

      <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
        <span className="font-semibold">Total Pasang</span>
        <span className="text-xl font-bold">{totalPasang}</span>
      </div>

      <BigButton disabled={saving || totalPasang <= 0} onClick={simpan} className="w-full py-4 text-lg">
        {saving ? 'Menyimpan...' : 'SIMPAN SEMUA'}
      </BigButton>
    </div>
  )
}

// ============================================================================
// MODE BERTAHAP — wizard lama (satu model per simpan)
// ============================================================================
function InputBertahap({
  pekerjaList,
  modelList,
  ukuranList,
  poList,
  idPekerja,
  setIdPekerja,
  shift,
  setShift,
  idPo,
  setIdPo,
  step,
  setStep,
  idSepatu,
  setIdSepatu,
  qty,
  setQty,
  onSimpan,
}: {
  pekerjaList: Pekerja[]
  modelList: TipeSepatu[]
  ukuranList: MasterUkuran[]
  poList: MasterPo[]
  idPekerja: number | null
  setIdPekerja: (id: number) => void
  shift: 1 | 2
  setShift: (s: 1 | 2) => void
  idPo: number | null
  setIdPo: (id: number | null) => void
  step: 'pekerja' | 'shift' | 'model' | 'po' | 'qty' | 'ringkas'
  setStep: (s: 'pekerja' | 'shift' | 'model' | 'po' | 'qty' | 'ringkas') => void
  idSepatu: number | null
  setIdSepatu: (id: number) => void
  qty: Record<string, number>
  setQty: React.Dispatch<React.SetStateAction<Record<string, number>>>
  onSimpan: () => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPasang = ukuranList.reduce((acc, u) => acc + (qty[String(u.id_ukuran)] ?? 0), 0)
  const pekerja = pekerjaList.find((p) => p.id_pekerja === idPekerja)
  const model = modelList.find((m) => m.id_sepatu === idSepatu)
  const po = poList.find((p) => p.id_po === idPo)

  async function simpan() {
    setSaving(true)
    setError(null)
    try {
      await onSimpan()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const stepTitles: Record<typeof step, string> = {
    pekerja: 'Pilih Pekerja',
    shift: 'Pilih Shift',
    model: 'Pilih Model Sepatu',
    po: 'PO (Opsional)',
    qty: 'Isi Jumlah per Ukuran',
    ringkas: 'Cek & Simpan',
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">{stepTitles[step]}</h1>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
          <span>Langkah</span>
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-white">
            {['pekerja', 'shift', 'model', 'po', 'qty', 'ringkas'].indexOf(step) + 1}/6
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-3">
          <ErrorBox message={error} />
        </div>
      )}

      {step === 'pekerja' && (
        <div className="space-y-3">
          {pekerjaList.map((p) => (
            <button
              key={p.id_pekerja}
              onClick={() => {
                setIdPekerja(p.id_pekerja)
                setStep('shift')
              }}
              className="w-full rounded-2xl border-2 border-transparent bg-white p-4 text-left text-base font-semibold text-slate-800 shadow-sm transition-colors active:border-emerald-500 active:bg-emerald-50"
            >
              👤 {p.nama}
            </button>
          ))}
          {pekerjaList.length === 0 && <p className="text-sm text-slate-500">Belum ada pekerja aktif.</p>}
        </div>
      )}

      {step === 'shift' && (
        <div className="space-y-3">
          {SHIFTS.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setShift(s.value)
                setStep('model')
              }}
              className="w-full rounded-2xl border-2 border-transparent bg-white p-5 text-center shadow-sm transition-colors active:border-emerald-500 active:bg-emerald-50"
            >
              <div className="text-xl font-bold text-slate-900">{s.label}</div>
              <div className="text-sm text-slate-500">{s.sub}</div>
            </button>
          ))}
          <BigButton variant="ghost" className="w-full" onClick={() => setStep('pekerja')}>
            ← Kembali
          </BigButton>
        </div>
      )}

      {step === 'model' && (
        <div className="space-y-3">
          {modelList.map((m) => (
            <button
              key={m.id_sepatu}
              onClick={() => {
                setIdSepatu(m.id_sepatu)
                setStep('po')
              }}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-transparent bg-white p-4 shadow-sm transition-colors active:border-emerald-500 active:bg-emerald-50"
            >
              <span className="text-base font-semibold text-slate-800">👟 {m.nama_model}</span>
              <span className="text-sm text-slate-500">{formatRupiah(m.ongkos_kerja)}/pasang</span>
            </button>
          ))}
          {modelList.length === 0 && <p className="text-sm text-slate-500">Belum ada model sepatu aktif.</p>}
          <BigButton variant="ghost" className="w-full" onClick={() => setStep('shift')}>
            ← Kembali
          </BigButton>
        </div>
      )}

      {step === 'po' && (
        <div className="space-y-3">
          <button
            onClick={() => setStep('qty')}
            className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-base font-semibold text-slate-500"
          >
            Lewati (tanpa PO)
          </button>
          {poList.map((p) => (
            <button
              key={p.id_po}
              onClick={() => {
                setIdPo(p.id_po)
                setStep('qty')
              }}
              className="w-full rounded-2xl border-2 border-transparent bg-white p-4 text-left shadow-sm transition-colors active:border-emerald-500 active:bg-emerald-50"
            >
              <div className="font-semibold text-slate-800">📦 {p.no_po}</div>
              {p.nama_customer && <div className="text-sm text-slate-500">Customer: {p.nama_customer}</div>}
            </button>
          ))}
          {poList.length === 0 && <p className="text-sm text-slate-500">Belum ada PO. Pilih "Lewati".</p>}
          <BigButton variant="ghost" className="w-full" onClick={() => setStep('model')}>
            ← Kembali
          </BigButton>
        </div>
      )}

      {step === 'qty' && (
        <div className="space-y-3">
          {ukuranList.map((u) => (
            <div key={u.id_ukuran} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
              <span className="text-lg font-bold text-slate-800">{u.label_ukuran}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                value={qty[String(u.id_ukuran)] ?? ''}
                onChange={(e) =>
                  setQty((prev) => ({
                    ...prev,
                    [String(u.id_ukuran)]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  }))
                }
                className="w-24 rounded-xl border border-slate-300 px-4 py-3 text-center text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ))}
          {ukuranList.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada ukuran aktif. Atur di Master Data.</p>
          )}

          <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
            <span className="font-semibold">Total Pasang</span>
            <span className="text-xl font-bold">{totalPasang}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <BigButton variant="ghost" onClick={() => setStep('po')}>
              ← Kembali
            </BigButton>
            <BigButton disabled={totalPasang <= 0} onClick={() => setStep('ringkas')}>
              Lanjut →
            </BigButton>
          </div>
        </div>
      )}

      {step === 'ringkas' && (
        <Card>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Pekerja</dt>
              <dd className="font-semibold text-slate-900">{pekerja?.nama}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Shift</dt>
              <dd className="font-semibold text-slate-900">
                {shift === 1 ? 'Shift 1 (Pagi)' : 'Shift 2 (Siang/Malam)'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Model</dt>
              <dd className="font-semibold text-slate-900">{model?.nama_model}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Ongkos</dt>
              <dd className="font-semibold text-slate-900">
                {model ? formatRupiah(model.ongkos_kerja) : '-'}/pasang
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">PO</dt>
              <dd className="font-semibold text-slate-900">{po?.no_po ?? '—'}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <dt className="text-slate-500">Total Pasang</dt>
              <dd className="text-lg font-bold text-emerald-700">{totalPasang}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Perkiraan Gaji</dt>
              <dd className="text-lg font-bold text-emerald-700">
                {model ? formatRupiah(totalPasang * model.ongkos_kerja) : '-'}
              </dd>
            </div>
          </dl>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <BigButton variant="ghost" onClick={() => setStep('qty')}>
              ← Edit
            </BigButton>
            <BigButton onClick={simpan} disabled={saving}>
              {saving ? 'Menyimpan...' : 'SIMPAN'}
            </BigButton>
          </div>
        </Card>
      )}
    </div>
  )
}
