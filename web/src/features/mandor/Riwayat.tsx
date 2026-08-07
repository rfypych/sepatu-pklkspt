import { useCallback, useEffect, useState } from 'react'
import {
  getProduksiHariIni,
  hapusProduksi,
  replaceProduksiDetail,
  getUkuranAktif,
  type ProduksiRow,
} from '../../lib/api'
import type { MasterUkuran } from '../../lib/types'
import { formatTanggalPendek, formatRupiah, tanggalHariIni } from '../../lib/constants'
import { BigButton, Card, ErrorBox, Spinner } from '../../components/ui'
import { ViewToggle, Tabel, THead, Th, Td, type ViewMode } from '../../components/view'

export default function Riwayat() {
  const [rows, setRows] = useState<ProduksiRow[]>([])
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>([])
  const [view, setView] = useState<ViewMode>('kartu')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  const muat = useCallback(async () => {
    setLoading(true)
    try {
      const [prod, ukuran] = await Promise.all([getProduksiHariIni(), getUkuranAktif()])
      setRows(prod)
      setUkuranList(ukuran)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

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
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Riwayat Hari Ini</h1>
          <p className="text-sm text-slate-500">
            {formatTanggalPendek(tanggalHariIni())} · data tanggal hari ini bisa diubah, data lama terkunci.
          </p>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {rows.length === 0 ? (
        <Card className="text-center text-slate-500">
          <div className="text-4xl">📭</div>
          <p className="mt-2">Belum ada data hari ini.</p>
        </Card>
      ) : view === 'tabel' ? (
        <>
          {editId !== null && (
            <EditorRiwayat
              ukuranList={ukuranList}
              qty={qty}
              setQty={setQty}
              saving={saving}
              onSimpan={() => onSimpanEdit(editId)}
              onBatal={() => setEditId(null)}
            />
          )}
          <Tabel>
            <THead>
              <Th>Pekerja</Th>
              <Th>Model</Th>
              <Th>Shift</Th>
              <Th className="text-right">Pasang</Th>
              <Th className="text-right">Gaji</Th>
              <Th className="text-right">Aksi</Th>
            </THead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id_produksi} className="hover:bg-slate-50">
                  <Td className="font-semibold text-slate-900">{row.nama_pekerja}</Td>
                  <Td>{row.nama_model}</Td>
                  <Td>{row.shift === 1 ? 'Shift 1' : 'Shift 2'}</Td>
                  <Td className="text-right font-semibold">{totalPasang(row)}</Td>
                  <Td className="text-right font-semibold text-emerald-700">{formatRupiah(totalGaji(row))}</Td>
                  <Td className="text-right">
                    <button onClick={() => mulaiEdit(row)} className="mr-2 text-xs font-bold text-sky-600">
                      Edit
                    </button>
                    <button onClick={() => onHapus(row.id_produksi)} className="text-xs font-bold text-rose-600">
                      Hapus
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabel>
        </>
      ) : (
        <>
          {editId !== null && (
            <EditorRiwayat
              ukuranList={ukuranList}
              qty={qty}
              setQty={setQty}
              saving={saving}
              onSimpan={() => onSimpanEdit(editId)}
              onBatal={() => setEditId(null)}
            />
          )}
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
                <div className="mt-3 flex gap-2">
                  <BigButton variant="secondary" className="flex-1 py-2" onClick={() => mulaiEdit(row)}>
                    ✏️ Edit
                  </BigButton>
                  <BigButton variant="danger" className="flex-1 py-2" onClick={() => onHapus(row.id_produksi)}>
                    🗑 Hapus
                  </BigButton>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function EditorRiwayat({
  ukuranList,
  qty,
  setQty,
  saving,
  onSimpan,
  onBatal,
}: {
  ukuranList: MasterUkuran[]
  qty: Record<string, number>
  setQty: (fn: (prev: Record<string, number>) => Record<string, number>) => void
  saving: boolean
  onSimpan: () => void
  onBatal: () => void
}) {
  return (
    <Card className="mb-3 border-2 border-emerald-300">
      <div className="mb-2 font-bold text-slate-900">✏️ Edit Jumlah per Ukuran</div>
      <div className="grid grid-cols-3 gap-2">
        {ukuranList.map((u) => (
          <div key={u.id_ukuran}>
            <div className="text-center text-xs font-semibold text-slate-500">{u.label_ukuran}</div>
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <BigButton variant="ghost" onClick={onBatal} disabled={saving}>
          Batal
        </BigButton>
        <BigButton onClick={onSimpan} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </BigButton>
      </div>
    </Card>
  )
}
