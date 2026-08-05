import { useCallback, useEffect, useState } from 'react'
import {
  getProduksiHariIni,
  hapusProduksi,
  replaceProduksiDetail,
} from '../../lib/api'
import { supabase } from '../../lib/supabase'
import type { MasterUkuran, ProduksiDetail, ProduksiHarian, Pekerja, TipeSepatu } from '../../lib/types'
import { formatTanggalPendek, formatRupiah, tanggalHariIni } from '../../lib/constants'
import { BigButton, Card, ErrorBox, Spinner } from '../../components/ui'

interface Row extends ProduksiHarian {
  nama_pekerja: string
  nama_model: string
  detail: ProduksiDetail[]
}

export default function Riwayat() {
  const [rows, setRows] = useState<Row[]>([])
  const [pekerjaMap, setPekerjaMap] = useState<Record<string, string>>({})
  const [modelMap, setModelMap] = useState<Record<string, string>>({})
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  const muat = useCallback(async () => {
    setLoading(true)
    try {
      const [prod, pekerja, model, ukuran] = await Promise.all([
        getProduksiHariIni(),
        fetchPekerja(),
        fetchModel(),
        fetchUkuran(),
      ])
      setPekerjaMap(Object.fromEntries(pekerja.map((p) => [p.id_pekerja, p.nama])))
      setModelMap(Object.fromEntries(model.map((m) => [m.id_sepatu, m.nama_model])))
      setUkuranList(ukuran)

      const rowsWithDetail: Row[] = []
      for (const p of prod) {
        const d = await fetchDetail(p.id_produksi)
        rowsWithDetail.push({
          ...p,
          nama_pekerja: pekerjaMap[p.id_pekerja] ?? '?',
          nama_model: modelMap[p.id_sepatu] ?? '?',
          detail: d,
        })
      }
      setRows(rowsWithDetail)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    muat()
  }, [muat])

  async function fetchPekerja() {
    const { data, error } = await supabase
      .from('pekerja')
      .select('id_pekerja, nama')
      .eq('status_aktif', true)
    if (error) throw error
    return (data ?? []) as Pekerja[]
  }
  async function fetchModel() {
    const { data, error } = await supabase
      .from('tipe_sepatu')
      .select('id_sepatu, nama_model')
    if (error) throw error
    return (data ?? []) as TipeSepatu[]
  }
  async function fetchUkuran() {
    const { data, error } = await supabase
      .from('master_ukuran')
      .select('*')
      .eq('status_aktif', true)
      .order('urutan')
    if (error) throw error
    return (data ?? []) as MasterUkuran[]
  }
  async function fetchDetail(idProduksi: string) {
    const { data, error } = await supabase
      .from('produksi_detail')
      .select('*')
      .eq('id_produksi', idProduksi)
    if (error) throw error
    return (data ?? []) as ProduksiDetail[]
  }

  function totalPasang(row: Row): number {
    return row.detail.reduce((a, d) => a + d.qty, 0)
  }

  function totalGaji(row: Row): number {
    return row.detail.reduce((a, d) => a + d.qty * d.ongkos_kerja_saat_ini, 0)
  }

  function mulaiEdit(row: Row) {
    setEditId(row.id_produksi)
    setQty(Object.fromEntries(row.detail.map((d) => [d.id_ukuran, d.qty])))
  }

  async function onSimpanEdit(idProduksi: string) {
    setSaving(true)
    setError(null)
    try {
      await replaceProduksiDetail(idProduksi, ukuranList.map((u) => ({ id_ukuran: u.id_ukuran, qty: qty[u.id_ukuran] ?? 0 })))
      setEditId(null)
      await muat()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function onHapus(idProduksi: string) {
    if (!window.confirm('Hapus data ini?')) return
    try {
      await hapusProduksi(idProduksi)
      await muat()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  return (
    <div className="px-4 py-4">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-900">Riwayat Hari Ini</h1>
        <p className="text-sm text-slate-500">{formatTanggalPendek(tanggalHariIni())} · data tanggal hari ini bisa diubah, data lama terkunci.</p>
      </div>

      {rows.length === 0 ? (
        <Card className="text-center text-slate-500">
          <div className="text-4xl">📭</div>
          <p className="mt-2">Belum ada data hari ini.</p>
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
                  </div>
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
                        value={qty[u.id_ukuran] ?? 0}
                        onChange={(e) =>
                          setQty((prev) => ({
                            ...prev,
                            [u.id_ukuran]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                          }))
                        }
                        className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <BigButton variant="ghost" onClick={() => setEditId(null)} disabled={saving}>
                      Batal
                    </BigButton>
                    <BigButton onClick={() => onSimpanEdit(row.id_produksi)} disabled={saving}>
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
