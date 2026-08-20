import { useCallback, useEffect, useState } from 'react'
import {
  getProduksi,
  getProduksiRentang,
  hapusProduksi,
  replaceProduksiDetail,
  getUkuranSemua,
  getPoSemua,
  getCache,
  type ProduksiRow,
} from '../../lib/api'
import type { MasterPo, MasterUkuran } from '../../lib/types'
import {
  formatAngka,
  formatBulanTahun,
  formatRupiah,
  formatTanggalPendek,
  bulanHariIni,
  rentangBulan,
  rentangTahun,
  tahunHariIni,
  tanggalHariIni,
  type PeriodRiwayat,
} from '../../lib/constants'
import { BigButton, Card, ConfirmModal, ErrorBox, ExportSuccessModal, FieldLabel, PillBadge, SelectInput, SkeletonTable } from '../../components/ui'
import { Tabel, THead, Th, Td } from '../../components/view'
import { buatBarisLaporan, exportLaporanHarian, shareLaporanHarian } from '../../lib/laporan'
import { Calendar, Download, Edit3, Lock, Trash2 } from 'lucide-react'

const PERIODE_LIST: { value: PeriodRiwayat; label: string }[] = [
  { value: 'hari', label: 'Harian' },
  { value: 'bulan', label: 'Bulanan' },
  { value: 'tahun', label: 'Tahunan' },
]

export default function Riwayat() {
  const [periode, setPeriode] = useState<PeriodRiwayat>('hari')
  const [tanggal, setTanggal] = useState(tanggalHariIni())
  const [bulan, setBulan] = useState(bulanHariIni())
  const [tahun, setTahun] = useState(tahunHariIni())
  const [rows, setRows] = useState<ProduksiRow[]>(() => getCache<ProduksiRow[]>('produksi_hari_ini') ?? [])
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>(() => getCache<MasterUkuran[]>('ukuran_semua') ?? [])
  const [poList, setPoList] = useState<MasterPo[]>(() => getCache<MasterPo[]>('po_semua') ?? [])
  const [loading, setLoading] = useState(() => !getCache('produksi_hari_ini'))
  const [error, setError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportedName, setExportedName] = useState<string | null>(null)

  const muat = useCallback(async () => {
    try {
      let prodPromise: Promise<ProduksiRow[]>
      if (periode === 'hari') {
        prodPromise = getProduksi(tanggal)
      } else if (periode === 'bulan') {
        const { dari, sampai } = rentangBulan(bulan)
        prodPromise = getProduksiRentang(dari, sampai)
      } else {
        const { dari, sampai } = rentangTahun(tahun)
        prodPromise = getProduksiRentang(dari, sampai)
      }

      const [prod, ukuran, po] = await Promise.all([
        prodPromise,
        getUkuranSemua(),
        getPoSemua(),
      ])
      setRows(prod)
      setUkuranList(ukuran)
      setPoList(po)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [periode, tanggal, bulan, tahun])

  useEffect(() => {
    muat()
    const timer = setInterval(() => {
      // Hanya auto-refresh jika user tidak sedang membuka dialog edit
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

  const today = tanggalHariIni()
  const bisaUbah = (row: ProduksiRow) => String(row.tanggal).slice(0, 10) === today

  function mulaiEdit(r: ProduksiRow) {
    setEditId(r.id_produksi)
    setQty(Object.fromEntries(r.detail.map((d) => [String(d.id_ukuran), d.qty])))
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

  const [hapusTarget, setHapusTarget] = useState<number | null>(null)

  function onHapus(idProduksi: number) {
    setHapusTarget(idProduksi)
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
          ? `laporan-bulanan-${bulan}.xlsx`
          : `laporan-tahunan-${tahun}.xlsx`
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
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Riwayat Produksi</h1>
          <p className="text-xs font-semibold text-slate-500">
            {periode === 'hari'
              ? `Data ${formatTanggalPendek(tanggal)} · Hanya data hari ini yang bisa diedit.`
              : periode === 'bulan'
                ? `Data Bulan ${formatBulanTahun(bulan)} · Rekapitulasi produksi bulanan.`
                : `Data Tahun ${tahun} · Rekapitulasi produksi tahunan.`}
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
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="space-y-3 rounded-3xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-neutral-100 p-1">
          {PERIODE_LIST.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriode(p.value)}
              className={`rounded-xl py-2 text-xs font-bold tracking-tight transition-all ${
                periode === p.value
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="pt-1">
          {periode === 'hari' && (
            <div>
              <FieldLabel>Pilih Tanggal</FieldLabel>
              <div className="relative">
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-300 bg-neutral-50/70 px-3.5 py-2.5 text-sm font-bold text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {periode === 'bulan' && (
            <div>
              <FieldLabel>Pilih Bulan & Tahun</FieldLabel>
              <div className="relative">
                <input
                  type="month"
                  value={bulan}
                  onChange={(e) => setBulan(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-300 bg-neutral-50/70 px-3.5 py-2.5 text-sm font-bold text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {periode === 'tahun' && (
            <div>
              <FieldLabel>Pilih Tahun</FieldLabel>
              <SelectInput
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="py-2.5 text-sm font-bold"
              >
                {Array.from({ length: 6 }, (_, i) => {
                  const y = String(new Date().getFullYear() - 3 + i)
                  return (
                    <option key={y} value={y}>
                      Tahun {y}
                    </option>
                  )
                })}
              </SelectInput>
            </div>
          )}
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
          <p className="mt-0.5 text-xs text-slate-500">Pilih periode atau tanggal lain.</p>
        </Card>
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
                <tr key={b.row.id_produksi} className="hover:bg-neutral-50/80 transition-colors">
                  <Td className="font-semibold text-neutral-900">{b.row.nama_pekerja}</Td>
                  <Td className="text-neutral-500">{formatTanggalPendek(b.row.tanggal)}</Td>
                  <Td className="font-medium text-neutral-800">{b.row.nama_model}</Td>
                  <Td>
                    {b.row.no_po ? (
                      <PillBadge color="neutral">{b.row.no_po}</PillBadge>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </Td>
                  <Td className="text-right text-neutral-700">{b.target != null ? formatAngka(b.target) : '—'}</Td>
                  <Td className="text-xs text-neutral-600">{b.rincianSize}</Td>
                  <Td className="text-neutral-600">
                    {formatAngka(b.ongkos)} × {b.pasang}
                  </Td>
                  <Td className="text-right font-semibold text-neutral-900">{formatRupiah(b.subtotal)}</Td>
                  <Td className="text-neutral-600">
                    {b.row.id_po != null && b.target ? `${b.harianProgress}/${formatAngka(b.target)}` : '—'}
                  </Td>
                  <Td className="text-right">
                    {bisaUbah(b.row) ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => mulaiEdit(b.row)}
                          className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onHapus(b.row.id_produksi)}
                          className="rounded-lg p-1 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400">
                        <Lock className="h-3 w-3" />
                        <span>Terkunci</span>
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-neutral-200 bg-neutral-50 font-bold">
                <Td className="font-bold text-neutral-900">TOTAL</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td className="font-semibold text-neutral-900">{formatAngka(totalPasangSemua)} psg</Td>
                <Td></Td>
                <Td className="text-right font-bold text-neutral-900">{formatRupiah(totalGajiSemua)}</Td>
                <Td></Td>
                <Td></Td>
              </tr>
            </tfoot>
          </Tabel>
        </>
      )}

      <ConfirmModal
        isOpen={hapusTarget !== null}
        title="Hapus Catatan Produksi?"
        message="Yakin ingin menghapus baris produksi ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Data"
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
