import { useCallback, useEffect, useState } from 'react'
import {
  getProduksi,
  hapusProduksi,
  replaceProduksiDetail,
  getPekerjaSemua,
  getUkuranSemua,
  getPoSemua,
  getCache,
  type ProduksiRow,
} from '../../lib/api'
import type { MasterPo, MasterUkuran, Pekerja } from '../../lib/types'
import { formatAngka, formatRupiah, formatTanggalPendek } from '../../lib/constants'
import { BigButton, Card, ConfirmModal, ErrorBox, ExportSuccessModal, FieldLabel, PillBadge, SelectInput, SkeletonTable } from '../../components/ui'
import { ViewToggle, Tabel, THead, Th, Td, type ViewMode } from '../../components/view'
import { exportLaporanHarian } from '../../lib/laporan'
import { Calendar, Download, Edit3, Trash2 } from 'lucide-react'

export default function DataProduksi() {
  const [rows, setRows] = useState<ProduksiRow[]>(() => getCache<ProduksiRow[]>('produksi_all_all') ?? [])
  const [pekerjaList, setPekerjaList] = useState<Pekerja[]>(() => getCache<Pekerja[]>('pekerja_semua') ?? [])
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>(() => getCache<MasterUkuran[]>('ukuran_semua') ?? [])
  const [poList, setPoList] = useState<MasterPo[]>(() => getCache<MasterPo[]>('po_semua') ?? [])
  const [tanggal, setTanggal] = useState('')
  const [idPekerja, setIdPekerja] = useState('')
  const [view, setView] = useState<ViewMode>('tabel')
  const [loading, setLoading] = useState(() => !getCache('produksi_all_all'))
  const [error, setError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [hapusTarget, setHapusTarget] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportedName, setExportedName] = useState<string | null>(null)

  const muat = useCallback(async () => {
    try {
      const [produksi, pekerja, ukuran, po] = await Promise.all([
        getProduksi(tanggal || undefined, idPekerja || undefined),
        getPekerjaSemua(),
        getUkuranSemua(),
        getPoSemua(),
      ])
      setRows(produksi)
      setPekerjaList(pekerja)
      setUkuranList(ukuran)
      setPoList(po)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [tanggal, idPekerja])

  useEffect(() => {
    muat()
    const timer = setInterval(() => {
      if (editId === null) {
        muat()
      }
    }, 5000)

    const onFocus = () => {
      if (editId === null) muat()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [muat, editId])

  function totalPasang(row: ProduksiRow) {
    return row.detail.reduce((a, d) => a + d.qty, 0)
  }
  function totalGaji(row: ProduksiRow) {
    return row.detail.reduce((a, d) => a + d.qty * d.ongkos_kerja_saat_ini, 0)
  }

  async function exportExcel() {
    setExporting(true)
    const nama = `laporan-harian-${tanggal || 'semua-tanggal'}.xlsx`
    try {
      await exportLaporanHarian(rows, poList, ukuranList, nama)
      setExportedName(nama)
    } finally {
      setExporting(false)
    }
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

  async function eksekusiHapus() {
    if (!hapusTarget) return
    const id = hapusTarget
    setHapusTarget(null)
    try {
      await hapusProduksi(id)
      await muat()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Data Produksi</h1>
          <p className="text-xs font-semibold text-slate-500">Kelola dan koreksi seluruh data input produksi pabrik.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            disabled={rows.length === 0 || exporting}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
          >
            {exporting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Menyiapkan File...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Ekspor Excel</span>
              </>
            )}
          </button>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {/* Filter Card (M3 Elevated) */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4.5 sm:p-5 shadow-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Pilih Tanggal</FieldLabel>
            <div className="relative">
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50/70 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-800 focus:outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <FieldLabel>Pilih Pekerja</FieldLabel>
            <SelectInput value={idPekerja} onChange={(e) => setIdPekerja(e.target.value)} className="py-2.5 text-sm">
              <option value="">Semua Pekerja</option>
              {pekerjaList.map((p) => (
                <option key={p.id_pekerja} value={p.id_pekerja}>
                  {p.nama}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {loading && rows.length === 0 ? (
        <SkeletonTable rows={5} cols={6} />
      ) : rows.length === 0 ? (
        <Card className="py-12 text-center text-neutral-500">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
            <Calendar className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-neutral-700">Tidak ada data sesuai filter.</p>
          <p className="mt-0.5 text-xs text-neutral-400">Coba ganti filter tanggal atau nama pekerja di atas.</p>
        </Card>
      ) : view === 'tabel' ? (
        <>
          {editId !== null && (
            <EditorProduksi
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
              <Th>Tanggal</Th>
              <Th>Pekerja</Th>
              <Th>Model</Th>
              <Th>Shift</Th>
              <Th>PO</Th>
              <Th className="text-right">Pasang</Th>
              <Th className="text-right">Gaji</Th>
              <Th className="text-right">Aksi</Th>
            </THead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id_produksi} className="hover:bg-neutral-50/80 transition-colors">
                  <Td className="text-neutral-500">{formatTanggalPendek(row.tanggal)}</Td>
                  <Td className="font-semibold text-neutral-900">{row.nama_pekerja}</Td>
                  <Td className="font-medium text-neutral-800">{row.nama_model}</Td>
                  <Td>
                    <PillBadge color={row.shift === 1 ? 'neutral' : 'emerald'}>
                      {row.shift === 1 ? 'Shift 1' : 'Shift 2'}
                    </PillBadge>
                  </Td>
                  <Td>
                    {row.no_po ? (
                      <PillBadge color="neutral">{row.no_po}</PillBadge>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </Td>
                  <Td className="text-right font-bold text-neutral-900">{formatAngka(totalPasang(row))} psg</Td>
                  <Td className="text-right font-semibold text-neutral-900">{formatRupiah(totalGaji(row))}</Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => mulaiEdit(row)}
                        className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setHapusTarget(row.id_produksi)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabel>
        </>
      ) : (
        <>
          {editId !== null && (
            <EditorProduksi
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
                    <div className="text-base font-bold text-slate-900">{row.nama_pekerja}</div>
                    <div className="flex items-center gap-2 pt-0.5 text-xs text-slate-500">
                      <span>{row.nama_model}</span>
                      <span>·</span>
                      <PillBadge color={row.shift === 1 ? 'neutral' : 'emerald'}>
                        {row.shift === 1 ? 'Shift 1' : 'Shift 2'}
                      </PillBadge>
                      {row.no_po && (
                        <PillBadge color="neutral">
                          {row.no_po}
                        </PillBadge>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-slate-400">{formatTanggalPendek(row.tanggal)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900">{formatAngka(totalPasang(row))} psg</div>
                    <div className="text-xs font-bold text-slate-600">{formatRupiah(totalGaji(row))}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  <BigButton variant="ghost" className="flex-1 py-2 text-xs" onClick={() => mulaiEdit(row)}>
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </BigButton>
                  <BigButton variant="danger" className="flex-1 py-2 text-xs" onClick={() => setHapusTarget(row.id_produksi)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Hapus
                  </BigButton>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* In-App M3 Confirmation Dialog */}
      <ConfirmModal
        isOpen={hapusTarget !== null}
        title="Hapus Catatan Produksi?"
        message="Hapus data produksi ini? Rekap gaji dan total pasang akan otomatis disesuaikan kembali."
        confirmLabel="Ya, Hapus Data"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={eksekusiHapus}
        onCancel={() => setHapusTarget(null)}
      />

      <ExportSuccessModal
        isOpen={exportedName !== null}
        onClose={() => setExportedName(null)}
        filename={exportedName ?? ''}
      />
    </div>
  )
}

function EditorProduksi({
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
    <Card className="border-neutral-900">
      <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2">
        <div className="font-semibold text-neutral-900">✏️ Edit Jumlah per Ukuran</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {ukuranList.map((u) => (
          <div key={u.id_ukuran}>
            <div className="mb-1 text-center text-xs font-semibold text-neutral-500">{u.label_ukuran}</div>
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
              className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-2 py-2 text-center text-base font-bold text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none"
            />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <BigButton variant="ghost" onClick={onBatal} disabled={saving}>
          Batal
        </BigButton>
        <BigButton onClick={onSimpan} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </BigButton>
      </div>
    </Card>
  )
}
