import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPekerjaAktif,
  getPoAktif,
  getTipeSepatuAktif,
  getUkuranAktif,
  simpanProduksiBatch,
} from '../../lib/api'
import type { MasterPo, MasterUkuran, Pekerja, TipeSepatu } from '../../lib/types'
import { SHIFTS, tanggalHariIni } from '../../lib/constants'
import { BigButton, Card, ErrorBox, Spinner } from '../../components/ui'

interface Baris {
  key: number
  id_pekerja: number | null
  shift: 1 | 2
  id_sepatu: number | null
  qty: Record<string, number>
}

let counter = 1

function barisBaru(): Baris {
  return { key: counter++, id_pekerja: null, shift: 1, id_sepatu: null, qty: {} }
}

export default function InputProduksi() {
  const navigate = useNavigate()

  const [rows, setRows] = useState<Baris[]>([barisBaru()])
  const [idPo, setIdPo] = useState<number | null>(null)
  const [pekerjaList, setPekerjaList] = useState<Pekerja[]>([])
  const [modelList, setModelList] = useState<TipeSepatu[]>([])
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>([])
  const [poList, setPoList] = useState<MasterPo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sukses, setSukses] = useState(false)

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

  function reset() {
    setRows([barisBaru()])
    setIdPo(null)
    setError(null)
    setSukses(false)
  }

  function updateRow(key: number, patch: Partial<Baris>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function updateQty(key: number, idUkuran: string, val: number) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, qty: { ...r.qty, [idUkuran]: val } } : r)),
    )
  }

  function removeRow(key: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev))
  }

  function totalBaris(r: Baris): number {
    return ukuranList.reduce((acc, u) => acc + (r.qty[String(u.id_ukuran)] ?? 0), 0)
  }

  const totalSemua = rows.reduce((acc, r) => acc + totalBaris(r), 0)

  async function onSimpan() {
    setError(null)
    const isi = rows.filter((r) => totalBaris(r) > 0)
    if (isi.length === 0) {
      setError('Belum ada angka yang diisi. Isi jumlah pasang di kolom ukuran.')
      return
    }
    const kurangLengkap = isi.find((r) => !r.id_pekerja || !r.id_sepatu)
    if (kurangLengkap) {
      setError('Ada baris yang belum pilih Nama Pekerja / Model Sepatu.')
      return
    }

    setSaving(true)
    try {
      await simpanProduksiBatch(
        isi.map((r) => ({
          tanggal: tanggalHariIni(),
          shift: r.shift,
          id_pekerja: r.id_pekerja as number,
          id_sepatu: r.id_sepatu as number,
          id_po: idPo,
          qtyPerUkuran: ukuranList.map((u) => ({
            id_ukuran: String(u.id_ukuran),
            qty: r.qty[String(u.id_ukuran)] ?? 0,
          })),
        })),
      )
      setSukses(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  if (error && ukuranList.length === 0) return <ErrorBox message={error} />

  if (sukses) {
    const namaBaris = rows.filter((r) => totalBaris(r) > 0)
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl">✅</div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Data Tersimpan!</h2>
        <p className="mt-1 text-sm text-slate-500">
          {namaBaris.length} baris · {totalSemua} pasang
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
          <BigButton onClick={reset} className="w-full">
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
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-900">Input Produksi</h1>
        <p className="text-sm text-slate-500">
          Isi satu baris per pekerjaan. Jumlah semua ukuran & simpan sekaligus.
        </p>
      </div>

      {error && (
        <div className="mb-3">
          <ErrorBox message={error} />
        </div>
      )}

      {/* Pilih PO (opsional, berlaku untuk semua baris) */}
      <Card className="mb-3">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm font-semibold text-slate-600">PO:</span>
          <select
            value={idPo ?? ''}
            onChange={(e) => setIdPo(e.target.value ? Number(e.target.value) : null)}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tanpa PO</option>
            {poList.map((p) => (
              <option key={p.id_po} value={p.id_po}>
                {p.no_po}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Tabel input */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-left text-white">
              <th className="sticky left-0 z-10 w-36 min-w-36 bg-slate-900 px-3 py-2 text-xs font-semibold">
                Nama Pekerja
              </th>
              <th className="sticky left-36 z-10 w-24 min-w-24 bg-slate-900 px-2 py-2 text-xs font-semibold">
                Shift
              </th>
              <th className="sticky left-60 z-10 w-32 min-w-32 bg-slate-900 px-3 py-2 text-xs font-semibold">
                Model
              </th>
              {ukuranList.map((u) => (
                <th
                  key={u.id_ukuran}
                  className="px-2 py-2 text-center text-xs font-semibold"
                >
                  {u.label_ukuran}
                </th>
              ))}
              <th className="px-2 py-2 text-right text-xs font-semibold">Total</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const total = totalBaris(r)
              return (
                <tr key={r.key} className="border-t border-slate-100 align-middle">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2">
                    <select
                      value={r.id_pekerja ?? ''}
                      onChange={(e) =>
                        updateRow(r.key, {
                          id_pekerja: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Pilih…</option>
                      {pekerjaList.map((p) => (
                        <option key={p.id_pekerja} value={p.id_pekerja}>
                          {p.nama}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="sticky left-36 z-10 bg-white px-2 py-2">
                    <select
                      value={r.shift}
                      onChange={(e) => updateRow(r.key, { shift: Number(e.target.value) as 1 | 2 })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-1 py-2 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {SHIFTS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="sticky left-60 z-10 bg-white px-3 py-2">
                    <select
                      value={r.id_sepatu ?? ''}
                      onChange={(e) =>
                        updateRow(r.key, {
                          id_sepatu: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Pilih…</option>
                      {modelList.map((m) => (
                        <option key={m.id_sepatu} value={m.id_sepatu}>
                          {m.nama_model}
                        </option>
                      ))}
                    </select>
                  </td>
                  {ukuranList.map((u) => (
                    <td key={u.id_ukuran} className="px-1 py-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="0"
                        value={r.qty[String(u.id_ukuran)] ?? ''}
                        onChange={(e) =>
                          updateQty(
                            r.key,
                            String(u.id_ukuran),
                            Math.max(0, Math.floor(Number(e.target.value) || 0)),
                          )
                        }
                        className="w-14 rounded-lg border border-slate-300 px-1 py-2 text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2 text-right font-bold text-emerald-700">{total}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => removeRow(r.key)}
                      disabled={rows.length <= 1}
                      className="rounded-lg px-2 py-1 text-sm font-bold text-rose-600 disabled:text-slate-300"
                      aria-label="Hapus baris"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <BigButton variant="ghost" className="flex-1 py-2.5 text-sm" onClick={() => setRows((p) => [...p, barisBaru()])}>
          + Tambah Baris
        </BigButton>
      </div>

      <Card className="mt-3 flex items-center justify-between">
        <span className="font-semibold">Total Pasang</span>
        <span className="text-xl font-bold text-emerald-700">{totalSemua}</span>
      </Card>

      <div className="mt-3">
        <BigButton onClick={onSimpan} disabled={saving} className="w-full py-4 text-lg">
          {saving ? 'Menyimpan...' : `SIMPAN SEMUA (${totalSemua} pasang)`}
        </BigButton>
      </div>
    </div>
  )
}
