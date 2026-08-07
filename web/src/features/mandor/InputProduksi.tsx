import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPekerjaAktif,
  getPoAktif,
  getTipeSepatuAktif,
  getUkuranAktif,
  simpanProduksiBatch,
  tambahPo,
} from '../../lib/api'
import type { MasterPo, MasterUkuran, Pekerja, TipeSepatu } from '../../lib/types'
import { SHIFTS, formatRupiah, tanggalHariIni } from '../../lib/constants'
import { BigButton, Card, ErrorBox, Spinner } from '../../components/ui'
import PoProgress from '../../components/PoProgress'

export default function InputProduksi() {
  const navigate = useNavigate()

  const [pekerjaList, setPekerjaList] = useState<Pekerja[]>([])
  const [modelList, setModelList] = useState<TipeSepatu[]>([])
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>([])
  const [poList, setPoList] = useState<MasterPo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [sukses, setSukses] = useState(false)
  const [suksesInfo, setSuksesInfo] = useState<string>('')
  const [suksesPo, setSuksesPo] = useState<{ no_po: string; achieved: number; target: number } | null>(null)

  // Satu alur: pekerja -> shift -> PO (opsional) -> tambah item berurutan -> SIMPAN
  const [idPekerja, setIdPekerja] = useState<number | null>(null)
  const [shift, setShift] = useState<1 | 2>(1)
  const [idPo, setIdPo] = useState<number | null>(null)
  const [items, setItems] = useState<{ id_sepatu: number; qty: Record<string, number> }[]>([])

  const reloadPo = useCallback(async () => {
    try {
      setPoList(await getPoAktif())
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

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
    setIdPekerja(null)
    setIdPo(null)
    setItems([])
    setSukses(false)
    setSuksesInfo('')
    setSuksesPo(null)
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
        {suksesPo && (
          <div className="mt-3 w-full max-w-xs rounded-2xl bg-white p-3 text-left shadow-sm">
            <div className="text-sm font-semibold text-slate-900">📦 {suksesPo.no_po}</div>
            <PoProgress target={suksesPo.target} achieved={suksesPo.achieved} />
          </div>
        )}
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
      {error && (
        <div className="mb-3">
          <ErrorBox message={error} />
        </div>
      )}

      <FormInput
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
          const totalPasang = payload.items.reduce((a, it) => a + it.qtyPerUkuran.reduce((x, d) => x + d.qty, 0), 0)
          setSuksesInfo(`${r.jumlah} item · ${totalPasang} pasang`)
          const po = poList.find((p) => p.id_po === idPo)
          if (po) {
            setSuksesPo({ no_po: po.no_po, achieved: po.achieved_qty + totalPasang, target: po.target_qty })
          } else {
            setSuksesPo(null)
          }
          void reloadPo()
        }}
        reloadPo={reloadPo}
      />
    </div>
  )
}

// ============================================================================
// FORM INPUT — satu alur multi-item (mandor dapat item acak dari loker)
// ============================================================================
function FormInput({
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
  reloadPo,
}: {
  pekerjaList: Pekerja[]
  modelList: TipeSepatu[]
  ukuranList: MasterUkuran[]
  poList: MasterPo[]
  idPekerja: number | null
  setIdPekerja: (id: number | null) => void
  shift: 1 | 2
  setShift: (s: 1 | 2) => void
  idPo: number | null
  setIdPo: (id: number | null) => void
  items: { id_sepatu: number; qty: Record<string, number> }[]
  setItems: React.Dispatch<React.SetStateAction<{ id_sepatu: number; qty: Record<string, number> }[]>>
  onSimpan: (payload: import('../../lib/api').SimpanBatchInput) => Promise<void>
  reloadPo: () => Promise<void>
}) {
  const [pilihModel, setPilihModel] = useState(false)
  const [pilihPo, setPilihPo] = useState(false)
  const [tambahPoMode, setTambahPoMode] = useState(false)
  const [poForm, setPoForm] = useState({ no_po: '', customer: '', target: '' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const totalPasang = items.reduce(
    (a, it) => a + ukuranList.reduce((x, u) => x + (it.qty[String(u.id_ukuran)] ?? 0), 0),
    0,
  )
  const selectedPo = poList.find((p) => p.id_po === idPo)

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

  async function submitPo(e: React.FormEvent) {
    e.preventDefault()
    if (!poForm.no_po.trim()) {
      setError('No PO wajib diisi.')
      return
    }
    try {
      const r = await tambahPo(poForm.no_po.trim(), poForm.customer.trim(), Number(poForm.target) || 0)
      await reloadPo()
      setIdPo(r.id_po)
      setPoForm({ no_po: '', customer: '', target: '' })
      setTambahPoMode(false)
      setPilihPo(false)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
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

  if (pilihPo) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-bold text-slate-900">Pilih PO</h1>
        <button
          onClick={() => {
            setIdPo(null)
            setPilihPo(false)
          }}
          className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-base font-semibold text-slate-500"
        >
          ⏭️ Lewati (tanpa PO)
        </button>
        {poList.map((p) => {
          const penuh = p.target_qty > 0 && p.achieved_qty >= p.target_qty
          return (
            <button
              key={p.id_po}
              onClick={() => {
                setIdPo(p.id_po)
                setPilihPo(false)
              }}
              disabled={penuh}
              className={`w-full rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition-colors ${
                penuh
                  ? 'cursor-not-allowed border-slate-200 opacity-60'
                  : 'border-transparent active:border-emerald-500 active:bg-emerald-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">📦 {p.no_po}</span>
                {p.nama_customer && <span className="text-sm text-slate-500">{p.nama_customer}</span>}
              </div>
              {p.target_qty > 0 ? (
                <div className="pointer-events-none">
                  <PoProgress target={p.target_qty} achieved={p.achieved_qty} />
                </div>
              ) : (
                <div className="mt-1 text-xs text-slate-400">
                  {p.achieved_qty > 0 ? `${p.achieved_qty} pasang terinput` : 'Belum ada target / produksi'}
                </div>
              )}
            </button>
          )
        })}
        {poList.length === 0 && <p className="text-sm text-slate-500">Belum ada PO. Buat PO baru di bawah.</p>}

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
          {tambahPoMode ? (
            <form onSubmit={submitPo} className="space-y-2">
              <div className="text-sm font-bold text-slate-700">➕ PO Baru</div>
              <input
                placeholder="No PO (cth: PO-2026-003)"
                value={poForm.no_po}
                onChange={(e) => setPoForm((f) => ({ ...f, no_po: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                placeholder="Customer (opsional)"
                value={poForm.customer}
                onChange={(e) => setPoForm((f) => ({ ...f, customer: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                placeholder="Target jumlah (pasang) — dari qty PO customer"
                inputMode="numeric"
                value={poForm.target}
                onChange={(e) => setPoForm((f) => ({ ...f, target: e.target.value.replace(/[^\d]/g, '') }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <BigButton
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setTambahPoMode(false)
                    setError(null)
                  }}
                >
                  Batal
                </BigButton>
                <BigButton type="submit" disabled={saving}>
                  Simpan PO
                </BigButton>
              </div>
            </form>
          ) : (
            <BigButton variant="secondary" className="w-full" onClick={() => setTambahPoMode(true)}>
              ＋ Tambah PO Baru
            </BigButton>
          )}
        </div>

        {error && <ErrorBox message={error} />}

        <BigButton variant="ghost" className="w-full" onClick={() => setPilihPo(false)}>
          ← Kembali
        </BigButton>
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
        <button
          onClick={() => setIdPekerja(null)}
          className="text-sm font-semibold text-slate-500 underline"
        >
          {pekerjaList.find((p) => p.id_pekerja === idPekerja)?.nama} ✕
        </button>
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
        <div className="mb-2 text-sm font-semibold text-slate-600">PO</div>
        {selectedPo ? (
          <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900">📦 {selectedPo.no_po}</div>
              <button onClick={() => setPilihPo(true)} className="text-xs font-bold text-emerald-700 underline">
                Ganti
              </button>
            </div>
            {selectedPo.nama_customer && (
              <div className="text-xs text-slate-500">{selectedPo.nama_customer}</div>
            )}
            {selectedPo.target_qty > 0 && (
              <div className="pointer-events-none">
                <PoProgress target={selectedPo.target_qty} achieved={selectedPo.achieved_qty} />
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setPilihPo(true)}
            className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-3 text-sm font-semibold text-slate-500"
          >
            📦 Pilih PO (opsional)
          </button>
        )}
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
              const subTotal = ukuranList.reduce((x, u) => x + (it.qty[String(u.id_ukuran)] ?? 0), 0)
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
