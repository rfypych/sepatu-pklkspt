import { useCallback, useEffect, useState } from 'react'
import {
  getProduksi,
  getProduksiRentang,
  hapusProduksi,
  replaceProduksiDetail,
  getPekerjaSemua,
  getUkuranSemua,
  getPoSemua,
  getCache,
  type ProduksiRow,
} from '../../lib/api'
import type { MasterPo, MasterUkuran, Pekerja } from '../../lib/types'
import {
  formatAngka,
  formatRupiah,
  formatTanggalPendek,
  tanggalAwalBulan,
  tanggalAwalTahun,
  tanggalHariIni,
  type PeriodRiwayat,
} from '../../lib/constants'
import {
  BigButton,
  Card,
  ConfirmModal,
  ErrorBox,
  ExportSuccessModal,
  FieldLabel,
  PillBadge,
  SelectInput,
  SkeletonTable,
} from '../../components/ui'
import { ViewToggle, Tabel, THead, Th, Td, type ViewMode } from '../../components/view'
import { buatBarisLaporan, exportLaporanHarian, shareLaporanHarian } from '../../lib/laporan'
import { Calendar, Download, Edit3, Trash2 } from 'lucide-react'

const PERIODE_LIST: { value: PeriodRiwayat; label: string }[] = [
  { value: 'hari', label: 'Harian' },
  { value: 'bulan', label: 'Bulanan' },
  { value: 'tahun', label: 'Tahunan' },
]

export default function DataProduksi() {
  const [periode, setPeriode] = useState<PeriodRiwayat>('hari')
  const [tanggal, setTanggal] = useState(tanggalHariIni())
  const [idPekerja, setIdPekerja] = useState('')
  const [rows, setRows] = useState<ProduksiRow[]>(() => getCache<ProduksiRow[]>('produksi_hari_ini') ?? [])
  const [pekerjaList, setPekerjaList] = useState<Pekerja[]>(() => getCache<Pekerja[]>('pekerja_semua') ?? [])
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>(() => getCache<MasterUkuran[]>('ukuran_semua') ?? [])
  const [poList, setPoList] = useState<MasterPo[]>(() => getCache<MasterPo[]>('po_semua') ?? [])
  const [view, setView] = useState<ViewMode>('tabel')
  const [loading, setLoading] = useState(() => !getCache('produksi_hari_ini'))
  const [error, setError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [hapusTarget, setHapusTarget] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportedName, setExportedName] = useState<string | null>(null)

  const muat = useCallback(async () => {
    try {
      const [prod, pekerja, ukuran, po] = await Promise.all([
        periode === 'hari'
          ? getProduksi(tanggal, idPekerja || undefined)
          : getProduksiRentang(
              periode === 'bulan' ? tanggalAwalBulan() : tanggalAwalTahun(),
              tanggalHariIni(),
              idPekerja || undefined,
            ),
        getPekerjaSemua(),
        getUkuranSemua(),
        getPoSemua(),
      ])
      setRows(prod)
      setPekerjaList(pekerja)
      setUkuranList(ukuran)
      setPoList(po)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [periode, tanggal, idPekerja])

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

  async function exportExcel() {
    setExporting(true)
    const nama =
      periode === 'hari'
        ? `laporan-harian-${tanggal}.xlsx`
        : periode === 'bulan'
          ? `laporan-bulanan-${tanggalHariIni().slice(0, 7)}.xlsx`
          : `laporan-tahunan-${tanggalHariIni().slice(0, 4)}.xlsx`
    try {
      await exportLaporanHarian(rows, poList, ukuranList, nama)
      setExportedName(nama)
    } finally {
      setExporting(false)
    }
  }

  const baris = buatBarisLaporan(rows, poList, ukuranList)
  const totalPasangSemua = baris.reduce((a, b) => a + b.pasang, 0)
  const totalGajiSemua = baris.reduce((a, b) => a + b.subtotal, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Data Produksi</h1>
          <p className="text-xs font-semibold text-slate-500">
            {periode === 'hari'
              ? `Data ${formatTanggalPendek(tanggal)} · Kontrol penuh input produksi seluruh pekerja.`
              : 'Semua data periode berjalan.'}
          </p>
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
      <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-white p-4.5 sm:p-5 shadow-xs">
        {/* Segmented Period Tabs */}
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1">
          {PERIODE_LIST.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriode(p.value)}
              className={`rounded-xl py-2 text-xs font-bold tracking-tight transition-all ${
                periode === p.value
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {periode === 'hari' && (
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
          )}
          <div className={periode !== 'hari' ? 'sm:col-span-2' : ''}>
            <FieldLabel>Filter Pekerja</FieldLabel>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border-2 border-blue-700 bg-blue-600 p-4 text-white shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-100">Total Pasang</div>
          <div className="mt-1 text-2xl font-black tracking-tight text-white">
            {formatAngka(totalPasangSemua)} <span className="text-xs font-bold text-blue-200">psg</span>
          </div>
        </div>
        <div className="rounded-3xl border-2 border-emerald-800 bg-emerald-700 p-4 text-white shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">Estimasi Upah</div>
          <div className="mt-1 text-2xl font-black tracking-tight text-white">
            {formatRupiah(totalGajiSemua)}
          </div>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <SkeletonTable rows={5} cols={6} />
      ) : rows.length === 0 ? (
        <Card className="py-12 text-center text-slate-500">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Calendar className="h-6 w-6" />
          </div>
          <p className="text-base font-bold text-slate-700">Belum ada data produksi di periode ini.</p>
          <p className="mt-0.5 text-xs text-slate-500">Pilih periode atau filter pekerja lain.</p>
        </Card>
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

          {view === 'tabel' ? (
            <Tabel>
              <THead>
                <Th>Pekerja</Th>
                <Th>Tanggal</Th>
                <Th>Model</Th>
                <Th>PO</Th>
                <Th className="text-right">Target</Th>
                <Th>Rincian Size</Th>
                <Th>Ongkos × Pasang</Th>
                <Th className="text-right">Subtotal</Th>
                <Th>Progress PO</Th>
                <Th className="text-right">Aksi</Th>
              </THead>
              <tbody>
                {baris.map((b) => (
                  <tr key={b.row.id_produksi} className="hover:bg-slate-50/80 transition-colors">
                    <Td className="font-black text-slate-900">{b.row.nama_pekerja}</Td>
                    <Td className="text-slate-500 font-semibold">{formatTanggalPendek(b.row.tanggal)}</Td>
                    <Td className="font-bold text-slate-800">{b.row.nama_model}</Td>
                    <Td>
                      {b.row.no_po ? (
                        <PillBadge color="neutral">{b.row.no_po}</PillBadge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </Td>
                    <Td className="text-right font-bold text-slate-700">{b.target != null ? formatAngka(b.target) : '—'}</Td>
                    <Td className="text-xs font-semibold text-slate-600">{b.rincianSize}</Td>
                    <Td className="text-slate-600 font-semibold">
                      {formatAngka(b.ongkos)} × {b.pasang}
                    </Td>
                    <Td className="text-right font-black text-slate-900">{formatRupiah(b.subtotal)}</Td>
                    <Td className="text-slate-600 font-semibold">
                      {b.row.id_po != null && b.target ? `${b.harianProgress}/${formatAngka(b.target)}` : '—'}
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => mulaiEdit(b.row)}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setHapusTarget(b.row.id_produksi)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-black">
                  <Td className="font-black text-slate-900">TOTAL</Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                  <Td className="font-black text-slate-900">{formatAngka(totalPasangSemua)} psg</Td>
                  <Td></Td>
                  <Td className="text-right font-black text-slate-900">{formatRupiah(totalGajiSemua)}</Td>
                  <Td></Td>
                  <Td></Td>
                </tr>
              </tfoot>
            </Tabel>
          ) : (
            <div className="space-y-3">
              {baris.map((b) => (
                <Card key={b.row.id_produksi}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-black text-slate-900">{b.row.nama_pekerja}</div>
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 font-semibold">
                        <span>{b.row.nama_model}</span>
                        {b.row.no_po && (
                          <>
                            <span>·</span>
                            <PillBadge color="neutral">{b.row.no_po}</PillBadge>
                          </>
                        )}
                        {b.row.shift && (
                          <>
                            <span>·</span>
                            <PillBadge color={b.row.shift === 1 ? 'neutral' : 'emerald'}>
                              {b.row.shift === 1 ? 'Shift 1' : 'Shift 2'}
                            </PillBadge>
                          </>
                        )}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        {b.rincianSize}
                      </div>
                      <div className="mt-1.5 text-[11px] font-semibold text-slate-400">
                        {formatTanggalPendek(b.row.tanggal)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-slate-900">{formatAngka(b.pasang)} psg</div>
                      <div className="text-xs font-bold text-slate-600">{formatRupiah(b.subtotal)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                    <BigButton variant="ghost" className="flex-1 py-2 text-xs" onClick={() => mulaiEdit(b.row)}>
                      <Edit3 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </BigButton>
                    <BigButton variant="danger" className="flex-1 py-2 text-xs" onClick={() => setHapusTarget(b.row.id_produksi)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Hapus
                    </BigButton>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
        onShare={() => shareLaporanHarian(rows, poList, ukuranList, exportedName || `laporan-harian-${tanggal}.xlsx`)}
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
