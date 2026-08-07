import { useCallback, useEffect, useState } from 'react'
import {
  getPekerjaAktif,
  getPoAktif,
  getProduksiHariIni,
  getTipeSepatuAktif,
  getUkuranAktif,
  hapusProduksi,
  simpanProduksiBatch,
  tambahPo,
  type ProduksiRow,
} from '../../lib/api'
import type { MasterPo, MasterUkuran, Pekerja, TipeSepatu } from '../../lib/types'
import { SHIFTS, formatRupiah, formatTanggalPendek, tanggalHariIni } from '../../lib/constants'
import { BigButton, Card, ErrorBox, Spinner } from '../../components/ui'
import PoProgress from '../../components/PoProgress'

type ItemKosong = { id_sepatu: number; qty: Record<string, number> }
type Screen = 'pekerja' | 'form' | 'po' | 'item'

export default function InputProduksi() {
  // ---- Data master & tersimpan hari ini ----
  const [pekerjaList, setPekerjaList] = useState<Pekerja[]>([])
  const [modelList, setModelList] = useState<TipeSepatu[]>([])
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>([])
  const [poList, setPoList] = useState<MasterPo[]>([])
  const [savedRows, setSavedRows] = useState<ProduksiRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // ---- State input (alur mengalir: mengetik -> total & PO update langsung) ----
  const [screen, setScreen] = useState<Screen>('pekerja')
  const [idPekerja, setIdPekerja] = useState<number | null>(null)
  const [shift, setShift] = useState<1 | 2>(1)
  const [idPo, setIdPo] = useState<number | null>(null)
  const [items, setItems] = useState<ItemKosong[]>([])
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // ---- Tambah PO baru ----
  const [showTambahPo, setShowTambahPo] = useState(false)
  const [poForm, setPoForm] = useState({ no_po: '', customer: '', target: '' })

  const reloadPo = useCallback(async () => {
    try {
      setPoList(await getPoAktif())
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const refreshSaved = useCallback(async () => {
    try {
      setSavedRows(await getProduksiHariIni())
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    Promise.all([getPekerjaAktif(), getTipeSepatuAktif(), getUkuranAktif(), getPoAktif(), getProduksiHariIni()])
      .then(([p, m, u, po, saved]) => {
        setPekerjaList(p)
        setModelList(m)
        setUkuranList(u)
        setPoList(po)
        setSavedRows(saved)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // ---- Streaming: total langsung terisi saat mengetik qty ukuran ----
  const itemSubtotal = (it: ItemKosong) => ukuranList.reduce((x, u) => x + (it.qty[String(u.id_ukuran)] ?? 0), 0)
  const entryTotal = items.reduce((a, it) => a + itemSubtotal(it), 0)
  const selectedPo = poList.find((p) => p.id_po === idPo) ?? null
  const proyeksiPo = selectedPo ? selectedPo.achieved_qty + entryTotal : 0

  const totalToday = savedRows.reduce((a, r) => a + r.detail.reduce((x, d) => x + d.qty, 0), 0)

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
      const r = await simpanProduksiBatch({
        tanggal: tanggalHariIni(),
        shift,
        id_pekerja: idPekerja,
        id_po: idPo,
        items: payloadItems,
      })
      setItems([]) // terkunci: jadi baris tersimpan seharian
      setToast(`✓ Tersimpan: ${r.jumlah} item · ${entryTotal} pasang`)
      await Promise.all([refreshSaved(), reloadPo()])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function hapus(id: number) {
    if (!window.confirm('Hapus data ini? Gaji akan ikut berubah.')) return
    setDeletingId(id)
    setError(null)
    try {
      await hapusProduksi(id)
      setToast('🗑 Data dihapus')
      await Promise.all([refreshSaved(), reloadPo()])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setDeletingId(null)
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
      setShowTambahPo(false)
      setScreen('form')
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) return <Spinner />

  const pekerja = pekerjaList.find((p) => p.id_pekerja === idPekerja)

  return (
    <div className="space-y-4 px-4 py-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Input Produksi</h1>
        <p className="text-sm text-slate-500">
          {formatTanggalPendek(tanggalHariIni())} · data tersimpan utuh seharian, hanya bisa dihapus
        </p>
      </div>

      {toast && (
        <div className="rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white shadow">
          {toast}
        </div>
      )}
      {error && <ErrorBox message={error} />}

      {screen === 'po' ? (
        <PilihPo
          poList={poList}
          entryTotal={entryTotal}
          showTambahPo={showTambahPo}
          setShowTambahPo={setShowTambahPo}
          poForm={poForm}
          setPoForm={setPoForm}
          submitPo={submitPo}
          onPilih={(id) => {
            setIdPo(id)
            setScreen('form')
          }}
          onLewati={() => {
            setIdPo(null)
            setScreen('form')
          }}
          onBatal={() => setScreen('form')}
        />
      ) : screen === 'item' ? (
        <PilihItem
          modelList={modelList}
          onPilih={(id) => {
            if (items.some((it) => it.id_sepatu === id)) {
              setError('Item tersebut sudah ada. Edit jumlahnya di bawah.')
              return
            }
            setItems((prev) => [...prev, { id_sepatu: id, qty: {} }])
            setError(null)
            setScreen('form')
          }}
          onBatal={() => setScreen('form')}
        />
      ) : screen === 'form' && pekerja ? (
        <FormUtama
          pekerjaNama={pekerja.nama}
          gantiPekerja={() => {
            setIdPekerja(null)
            setIdPo(null)
            setItems([])
            setScreen('pekerja')
          }}
          modelList={modelList}
          ukuranList={ukuranList}
          shift={shift}
          setShift={setShift}
          selectedPo={selectedPo}
          proyeksiPo={proyeksiPo}
          entryTotal={entryTotal}
          bukaPo={() => setScreen('po')}
          items={items}
          setItems={setItems}
          itemSubtotal={itemSubtotal}
          bukaItem={() => setScreen('item')}
          hapusItem={(i) => setItems((prev) => prev.filter((_, x) => x !== i))}
          onSimpan={simpan}
          saving={saving}
        />
      ) : (
        <PilihPekerja
          pekerjaList={pekerjaList}
          onPilih={(id) => {
            setIdPekerja(id)
            setScreen('form')
          }}
        />
      )}

      <TersimpanHariIni rows={savedRows} deletingId={deletingId} onHapus={hapus} totalToday={totalToday} />
    </div>
  )
}

function PilihPekerja({ pekerjaList, onPilih }: { pekerjaList: Pekerja[]; onPilih: (id: number) => void }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-slate-900">Pilih Pekerja</h2>
      {pekerjaList.map((p) => (
        <button
          key={p.id_pekerja}
          onClick={() => onPilih(p.id_pekerja)}
          className="w-full rounded-2xl border-2 border-transparent bg-white p-4 text-left text-base font-semibold text-slate-800 shadow-sm transition-colors active:border-emerald-500 active:bg-emerald-50"
        >
          👤 {p.nama}
        </button>
      ))}
      {pekerjaList.length === 0 && <p className="text-sm text-slate-500">Belum ada pekerja aktif.</p>}
    </div>
  )
}

function PilihItem({
  modelList,
  onPilih,
  onBatal,
}: {
  modelList: TipeSepatu[]
  onPilih: (id: number) => void
  onBatal: () => void
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-slate-900">Pilih Item</h2>
      {modelList.map((m) => (
        <button
          key={m.id_sepatu}
          onClick={() => onPilih(m.id_sepatu)}
          className="flex w-full items-center justify-between rounded-2xl border-2 border-transparent bg-white p-4 shadow-sm transition-colors active:border-emerald-500 active:bg-emerald-50"
        >
          <span className="text-base font-semibold text-slate-800">👟 {m.nama_model}</span>
          <span className="text-sm text-slate-500">{formatRupiah(m.ongkos_kerja)}/pasang</span>
        </button>
      ))}
      <BigButton variant="ghost" className="w-full" onClick={onBatal}>
        ← Kembali
      </BigButton>
    </div>
  )
}

function PilihPo({
  poList,
  entryTotal,
  showTambahPo,
  setShowTambahPo,
  poForm,
  setPoForm,
  submitPo,
  onPilih,
  onLewati,
  onBatal,
}: {
  poList: MasterPo[]
  entryTotal: number
  showTambahPo: boolean
  setShowTambahPo: (b: boolean) => void
  poForm: { no_po: string; customer: string; target: string }
  setPoForm: (f: { no_po: string; customer: string; target: string }) => void
  submitPo: (e: React.FormEvent) => Promise<void>
  onPilih: (id: number) => void
  onLewati: () => void
  onBatal: () => void
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-slate-900">Pilih PO</h2>
      <button
        onClick={onLewati}
        className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-base font-semibold text-slate-500"
      >
        ⏭️ Lewati (tanpa PO)
      </button>

      {poList.map((p) => {
        const penuh = p.target_qty > 0 && p.achieved_qty >= p.target_qty
        return (
          <button
            key={p.id_po}
            onClick={() => onPilih(p.id_po)}
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
                <PoProgress target={p.target_qty} achieved={p.achieved_qty + entryTotal} />
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
        {showTambahPo ? (
          <form onSubmit={submitPo} className="space-y-2">
            <div className="text-sm font-bold text-slate-700">➕ PO Baru</div>
            <input
              placeholder="No PO (cth: PO-2026-003)"
              value={poForm.no_po}
              onChange={(e) => setPoForm({ ...poForm, no_po: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              placeholder="Customer (opsional)"
              value={poForm.customer}
              onChange={(e) => setPoForm({ ...poForm, customer: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              placeholder="Target jumlah (pasang) — dari qty PO customer"
              inputMode="numeric"
              value={poForm.target}
              onChange={(e) => setPoForm({ ...poForm, target: e.target.value.replace(/[^\d]/g, '') })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <BigButton variant="ghost" type="button" onClick={() => setShowTambahPo(false)}>
                Batal
              </BigButton>
              <BigButton type="submit">Simpan PO</BigButton>
            </div>
          </form>
        ) : (
          <BigButton variant="secondary" className="w-full" onClick={() => setShowTambahPo(true)}>
            ＋ Tambah PO Baru
          </BigButton>
        )}
      </div>

      <BigButton variant="ghost" className="w-full" onClick={onBatal}>
        ← Kembali
      </BigButton>
    </div>
  )
}

function FormUtama({
  pekerjaNama,
  gantiPekerja,
  modelList,
  ukuranList,
  shift,
  setShift,
  selectedPo,
  proyeksiPo,
  entryTotal,
  bukaPo,
  items,
  setItems,
  itemSubtotal,
  bukaItem,
  hapusItem,
  onSimpan,
  saving,
}: {
  pekerjaNama: string
  gantiPekerja: () => void
  modelList: TipeSepatu[]
  ukuranList: MasterUkuran[]
  shift: 1 | 2
  setShift: (s: 1 | 2) => void
  selectedPo: MasterPo | null
  proyeksiPo: number
  entryTotal: number
  bukaPo: () => void
  items: ItemKosong[]
  setItems: React.Dispatch<React.SetStateAction<ItemKosong[]>>
  itemSubtotal: (it: ItemKosong) => number
  bukaItem: () => void
  hapusItem: (i: number) => void
  onSimpan: () => Promise<void>
  saving: boolean
}) {
  function ubahQty(i: number, idUkuran: string, val: number) {
    setItems((prev) =>
      prev.map((it, x) =>
        x === i ? { ...it, qty: { ...it.qty, [idUkuran]: Math.max(0, Math.floor(val || 0)) } } : it,
      ),
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
        <div>
          <div className="font-bold">👤 {pekerjaNama}</div>
          <div className="text-xs text-slate-300">{shift === 1 ? 'Shift 1 (Pagi)' : 'Shift 2 (Siang/Malam)'}</div>
        </div>
        <button onClick={gantiPekerja} className="text-xs font-bold text-slate-300 underline">
          Ganti Pekerja
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

      {/* PO */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
          <span>PO</span>
          <button onClick={bukaPo} className="text-sky-600 underline">
            {selectedPo ? 'Ganti' : 'Pilih'}
          </button>
        </div>
        {selectedPo ? (
          <Card className="border-2 border-emerald-300">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900">📦 {selectedPo.no_po}</div>
              {selectedPo.nama_customer && <div className="text-xs text-slate-500">{selectedPo.nama_customer}</div>}
            </div>
            <div className="mt-1">
              <PoProgress target={selectedPo.target_qty} achieved={proyeksiPo} />
              <p className="mt-1 text-[11px] text-slate-400">
                Proyeksi seiring ketik: {entryTotal.toLocaleString('id-ID')} pasang ditambahkan live
              </p>
            </div>
          </Card>
        ) : (
          <button
            onClick={bukaPo}
            className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-3 text-sm font-semibold text-slate-500"
          >
            📦 Pilih PO (opsional)
          </button>
        )}
      </div>

      {/* Item yang sedang diisi */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-600">
            Item ({items.length}) <span className="font-normal text-slate-400">· ketik = langsung terhitung</span>
          </div>
          <button onClick={bukaItem} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white">
            + Tambah Item
          </button>
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
                      <span className="text-sm font-bold text-emerald-700">{itemSubtotal(it)} psg</span>
                      <button
                        onClick={() => hapusItem(idx)}
                        className="rounded-lg px-2 py-1 text-xs font-bold text-rose-600"
                      >
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
                          onChange={(e) => ubahQty(idx, String(u.id_ukuran), Number(e.target.value))}
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

      <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total (akan disimpan)</span>
          <span className="text-2xl font-bold tabular-nums">{entryTotal.toLocaleString('id-ID')}</span>
        </div>
        {selectedPo && (
          <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
            <span>Progress PO (dengan yang diketik)</span>
            <span className="font-bold tabular-nums">
              {proyeksiPo.toLocaleString('id-ID')} / {selectedPo.target_qty.toLocaleString('id-ID')}
            </span>
          </div>
        )}
      </div>

      <BigButton disabled={saving || entryTotal <= 0} onClick={onSimpan} className="w-full py-4 text-lg">
        {saving ? 'Menyimpan...' : 'SIMPAN SEKARANG'}
      </BigButton>
    </div>
  )
}

function TersimpanHariIni({
  rows,
  deletingId,
  onHapus,
  totalToday,
}: {
  rows: ProduksiRow[]
  deletingId: number | null
  onHapus: (id: number) => void
  totalToday: number
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Tersimpan Hari Ini</h2>
        <span className="text-sm font-semibold text-slate-500">
          {(rows.length === 1 ? '1 transaksi' : `${rows.length} transaksi`)} · {totalToday.toLocaleString('id-ID')} pasang
        </span>
      </div>

      {rows.length === 0 ? (
        <Card className="text-center text-slate-500">
          <div className="text-3xl">📭</div>
          <p className="mt-1 text-sm">Belum ada data tersimpan hari ini.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const pasang = r.detail.reduce((a, d) => a + d.qty, 0)
            const gaji = r.detail.reduce((a, d) => a + d.qty * d.ongkos_kerja_saat_ini, 0)
            return (
              <Card key={r.id_produksi}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">
                      👟 {r.nama_model} <span className="text-slate-400">·</span> {r.nama_pekerja}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.shift === 1 ? 'Shift 1' : 'Shift 2'}
                      {r.no_po ? ` · 📦 ${r.no_po}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{pasang} pasang</div>
                    <div className="text-xs text-emerald-700">{formatRupiah(gaji)}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => onHapus(r.id_produksi)}
                    disabled={deletingId === r.id_produksi}
                    className="w-full rounded-xl bg-rose-50 py-2 text-xs font-bold text-rose-600 active:bg-rose-100"
                  >
                    {deletingId === r.id_produksi ? 'Menghapus...' : '🗑 Hapus item ini'}
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}