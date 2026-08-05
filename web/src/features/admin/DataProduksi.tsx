import { useCallback, useEffect, useState } from 'react'
import {
  getProduksi,
  hapusProduksi,
  replaceProduksiDetail,
  getPekerjaSemua,
  getUkuranAktif,
  type ProduksiRow,
} from '../../lib/api'
import type { MasterUkuran, Pekerja } from '../../lib/types'
import { formatRupiah, formatTanggalPendek } from '../../lib/constants'
import { BigButton, Card, ErrorBox, FieldLabel, SelectInput, Spinner } from '../../components/ui'

export default function DataProduksi() {
  const [rows, setRows] = useState<ProduksiRow[]>([])
  const [pekerjaList, setPekerjaList] = useState<Pekerja[]>([])
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>([])
  const [tanggal, setTanggal] = useState('')
  const [idPekerja, setIdPekerja] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  const muat = useCallback(async () => {
    setLoading(true)
    try {
      const [produksi, pekerja, ukuran] = await Promise.all([
        getProduksi(tanggal || undefined, idPekerja || undefined),
        getPekerjaSemua(),
        getUkuranAktif(),
      ])
      setRows(produksi)
      setPekerjaList(pekerja)
      setUkuranList(ukuran)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [tanggal, idPekerja])

  useEffect(() => {
    muat()
  }, [muat])

  function totalPasang(row: ProduksiRow) {
    return row.detail.reduce((a, d) => a + d.qty, 0)
  }
  function totalGaji(row: ProduksiRow) {
    return row.detail.reduce((a, d) => a + d.qty * d.ongkos_kerja_saat_ini, 0)
  }

  function mulaiEdit(row: ProduksiRow) {
    setEditId(row.id_produksi)
    setQty(Object.fromEntries(row.detail.map((d) => [String(d.id_ukuran), d.qty])))
  }

  async function onSimpanEdit(idProduksi: number) {
    setSaving(true)
    setError(null)
    try {
      await replaceProduksiDetail(
        idProduksi,
        ukuranList.map((u) => ({ id_ukuran: String(u.id_ukuran), qty: qty[String(u.id_ukuran)] ?? 0 })),
      )
      setEditId(null)
      await muat()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function onHapus(idProduksi: number) {
    if (!window.confirm('Hapus data produksi ini? Rekap gaji akan ikut berubah.')) return
    try {
      await hapusProduksi(idProduksi)
      await muat()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Data Produksi</h1>
        <p className="text-sm text-slate-500">Edit/hapus kapan saja — untuk koreksi salah input.</p>
      </div>

      <Card className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Tanggal</FieldLabel>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <FieldLabel>Pekerja</FieldLabel>
            <SelectInput value={idPekerja} onChange={(e) => setIdPekerja(e.target.value)}>
              <option value="">Semua</option>
              {pekerjaList.map((p) => (
                <option key={p.id_pekerja} value={p.id_pekerja}>
                  {p.nama}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>
      </Card>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Card className="text-center text-slate-500">
          <div className="text-4xl">📭</div>
          <p className="mt-2">Tidak ada data sesuai filter.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.id_produksi}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900">{row.nama_pekerja}</div>
                  <div className="text-sm text-slate-500">
                    {row.nama_model} · {row.shift === 1 ? 'Shift 1' : 'Shift 2'}
                    {row.no_po ? ` · PO ${row.no_po}` : ''}
                  </div>
                  <div className="text-xs text-slate-400">{formatTanggalPendek(row.tanggal)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-700">{totalPasang(row)} pasang</div>
                  <div className="text-sm text-slate-500">{formatRupiah(totalGaji(row))}</div>
                </div>
              </div>

              {editId === row.id_produksi ? (
                <div className="mt-3 space-y-2">
                  {ukuranList.map((u) => (
                    <div key={u.id_ukuran} className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{u.label_ukuran}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={qty[String(u.id_ukuran)] ?? 0}
                        onChange={(e) =>
                          setQty((prev) => ({
                            ...prev,
                            [String(u.id_ukuran)]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                          }))
                        }
                        className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-center font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <BigButton variant="ghost" onClick={() => setEditId(null)} disabled={saving}>
                      Batal
                    </BigButton>
                    <BigButton variant="secondary" onClick={() => onSimpanEdit(row.id_produksi)} disabled={saving}>
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </BigButton>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <BigButton variant="secondary" className="flex-1 py-2" onClick={() => mulaiEdit(row)}>
                    ✏️ Edit
                  </BigButton>
                  <BigButton variant="danger" className="flex-1 py-2" onClick={() => onHapus(row.id_produksi)}>
                    🗑 Hapus
                  </BigButton>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
