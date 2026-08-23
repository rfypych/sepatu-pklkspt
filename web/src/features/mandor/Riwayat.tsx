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
import {
  BigButton,
  ConfirmModal,
  EmptyState,
  ErrorBox,
  ExportSuccessModal,
  NumberStepper,
  PageTitle,
  PillBadge,
  SkeletonTable,
  StatCard,
} from '../../components/ui'
import { Tabel, THead, Th, Td, DataRow, ViewToggle } from '../../components/view'
import { useViewMode } from '../../lib/useViewMode'
import PeriodeFilter from '../../components/PeriodeFilter'
import { buatBarisLaporan, exportLaporanHarian, shareLaporanHarian } from '../../lib/laporan'
import { Calendar, Clock, Coins, Download, Edit3, Lock, Package, Trash2 } from 'lucide-react'

export default function Riwayat() {
  const [periode, setPeriode] = useState<PeriodRiwayat>('hari')
  const [tanggal, setTanggal] = useState(tanggalHariIni())
  const [bulan, setBulan] = useState(bulanHariIni())
  const [tahun, setTahun] = useState(tahunHariIni())
  const [rows, setRows] = useState<ProduksiRow[]>(() => getCache<ProduksiRow[]>('produksi_hari_ini') ?? [])
  const [ukuranList, setUkuranList] = useState<MasterUkuran[]>(() => getCache<MasterUkuran[]>('ukuran_semua') ?? [])
  const [poList, setPoList] = useState<MasterPo[]>(() => getCache<MasterPo[]>('po_semua') ?? [])
  const [view, setView] = useViewMode('riwayat')
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
      <PageTitle
        icon={<Clock className="h-6 w-6" />}
        title="Riwayat Hasil Kerja"
        subtitle={
          periode === 'hari'
            ? `Tanggal ${formatTanggalPendek(tanggal)}. Hanya data hari ini yang bisa diubah.`
            : periode === 'bulan'
              ? `Bulan ${formatBulanTahun(bulan)}.`
              : `Tahun ${tahun}.`
        }
        right={
          <>
            <BigButton
              variant="dark"
              size="sm"
              onClick={exportExcel}
              disabled={rows.length === 0 || exporting}
            >
              <Download className="h-5 w-5" />
              {exporting ? 'Menyiapkan file...' : 'Simpan ke Excel'}
            </BigButton>
            <ViewToggle value={view} onChange={setView} />
          </>
        }
      />

      <PeriodeFilter
        periode={periode}
        setPeriode={setPeriode}
        tanggal={tanggal}
        setTanggal={setTanggal}
        bulan={bulan}
        setBulan={setBulan}
        tahun={tahun}
        setTahun={setTahun}
      />

      {error && <ErrorBox message={error} onRetry={muat} />}

      {/* ---------- Angka besar ---------- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          tone="blue"
          icon={<Package className="h-5 w-5" />}
          label="Sepatu Selesai"
          value={formatAngka(totalPasangSemua)}
          unit="pasang"
        />
        <StatCard
          tone="emerald"
          icon={<Coins className="h-5 w-5" />}
          label="Perkiraan Upah"
          value={formatRupiah(totalGajiSemua)}
        />
      </div>

      {loading && rows.length === 0 ? (
        <SkeletonTable rows={5} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="Belum ada data di periode ini"
          description="Coba pilih tanggal, bulan, atau tahun yang lain di kotak filter di atas."
        />
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

          {/* ---------- Tampilan Kartu (opsional) ---------- */}
          {view === 'kartu' && (
          <div className="space-y-3">
            {baris.map((b) => (
              <article
                key={b.row.id_produksi}
                className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 border-b-2 border-slate-100 pb-3">
                  <div className="min-w-0">
                    <div className="truncate text-lg font-extrabold leading-tight text-slate-900">
                      {b.row.nama_pekerja}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <PillBadge color="neutral">{b.row.nama_model}</PillBadge>
                      {b.row.no_po && <PillBadge color="blue">{b.row.no_po}</PillBadge>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-extrabold text-slate-900">
                      {formatAngka(b.pasang)} psg
                    </div>
                    <div className="text-base font-bold text-emerald-800">
                      {formatRupiah(b.subtotal)}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <DataRow label="Tanggal" value={formatTanggalPendek(b.row.tanggal)} />
                  <DataRow label="Rincian ukuran" value={b.rincianSize} />
                  <DataRow
                    label="Upah per pasang"
                    value={`${formatRupiah(b.ongkos)} × ${b.pasang}`}
                  />
                </div>

                <div className="mt-3 border-t-2 border-slate-100 pt-3">
                  {bisaUbah(b.row) ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <BigButton variant="ghost" onClick={() => mulaiEdit(b.row)}>
                        <Edit3 className="h-5 w-5" />
                        Ubah
                      </BigButton>
                      <BigButton variant="danger" onClick={() => onHapus(b.row.id_produksi)}>
                        <Trash2 className="h-5 w-5" />
                        Hapus
                      </BigButton>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-100 py-3 text-base font-bold text-slate-600">
                      <Lock className="h-5 w-5" />
                      Data lama — tidak bisa diubah
                    </div>
                  )}
                </div>
              </article>
            ))}

            <div className="rounded-3xl border-2 border-slate-950 bg-slate-900 p-4 text-white shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-bold uppercase tracking-wide text-slate-300">
                  Total
                </span>
                <span className="text-xl font-extrabold">
                  {formatAngka(totalPasangSemua)} pasang
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3 border-t-2 border-slate-700 pt-1.5">
                <span className="text-base font-bold uppercase tracking-wide text-slate-300">
                  Upah
                </span>
                <span className="text-2xl font-extrabold text-emerald-400">
                  {formatRupiah(totalGajiSemua)}
                </span>
              </div>
            </div>
          </div>
          )}

          {/* ---------- Tampilan Tabel (default) ---------- */}
          {view === 'tabel' && (
          <div>
            <Tabel>
              <THead>
                <Th>Pekerja</Th>
                <Th>Tanggal</Th>
                <Th>Model</Th>
                <Th>PO</Th>
                <Th>Rincian Ukuran</Th>
                <Th className="text-right">Pasang</Th>
                <Th className="text-right">Upah</Th>
                <Th className="text-right">Aksi</Th>
              </THead>
              <tbody>
                {baris.map((b) => (
                  <tr key={b.row.id_produksi} className="odd:bg-white even:bg-slate-50">
                    <Td className="font-extrabold text-slate-900">{b.row.nama_pekerja}</Td>
                    <Td>{formatTanggalPendek(b.row.tanggal)}</Td>
                    <Td>{b.row.nama_model}</Td>
                    <Td>
                      {b.row.no_po ? (
                        <PillBadge color="blue">{b.row.no_po}</PillBadge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </Td>
                    <Td className="whitespace-normal text-sm">{b.rincianSize}</Td>
                    <Td className="text-right font-extrabold text-slate-900">
                      {formatAngka(b.pasang)}
                    </Td>
                    <Td className="text-right font-extrabold text-emerald-800">
                      {formatRupiah(b.subtotal)}
                    </Td>
                    <Td className="text-right">
                      {bisaUbah(b.row) ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => mulaiEdit(b.row)}
                            aria-label="Ubah"
                            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-blue-400 bg-blue-50 text-blue-800 active:bg-blue-200"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => onHapus(b.row.id_produksi)}
                            aria-label="Hapus"
                            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-rose-400 bg-rose-50 text-rose-700 active:bg-rose-200"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-500">
                          <Lock className="h-4 w-4" />
                          Terkunci
                        </span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-4 border-slate-300 bg-slate-100">
                  <Td colSpan={5} className="text-lg font-extrabold text-slate-900">
                    TOTAL
                  </Td>
                  <Td className="text-right text-lg font-extrabold text-slate-900">
                    {formatAngka(totalPasangSemua)}
                  </Td>
                  <Td className="text-right text-lg font-extrabold text-emerald-800">
                    {formatRupiah(totalGajiSemua)}
                  </Td>
                  <Td />
                </tr>
              </tfoot>
            </Tabel>
          </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={hapusTarget !== null}
        title="Hapus catatan ini?"
        message="Catatan hasil kerja ini akan dihapus dan tidak bisa dikembalikan. Total upah akan menyesuaikan otomatis."
        confirmLabel="Ya, Hapus"
        cancelLabel="Tidak, Batal"
        isDestructive
        onConfirm={eksekusiHapus}
        onCancel={() => setHapusTarget(null)}
      />

      <ExportSuccessModal
        isOpen={exportedName !== null}
        onClose={() => setExportedName(null)}
        filename={exportedName ?? ''}
        onShare={() =>
          shareLaporanHarian(
            rows,
            poList,
            ukuranList,
            exportedName || `laporan-harian-${tanggal}.xlsx`,
          )
        }
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
  const total = ukuranList.reduce((a, u) => a + (qty[String(u.id_ukuran)] ?? 0), 0)
  return (
    <div className="space-y-3 rounded-3xl border-2 border-slate-950 bg-white p-4 shadow-md sm:p-5">
      <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
        Ubah Jumlah per Ukuran
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {ukuranList.map((u) => (
          <NumberStepper
            key={u.id_ukuran}
            label={`No ${u.label_ukuran}`}
            value={qty[String(u.id_ukuran)] ?? 0}
            onChange={(val) => setQty((prev) => ({ ...prev, [String(u.id_ukuran)]: val }))}
          />
        ))}
      </div>
      <div className="flex items-baseline justify-between gap-3 rounded-2xl border-2 border-slate-950 bg-slate-900 px-4 py-3 text-white">
        <span className="text-base font-bold uppercase tracking-wide text-slate-300">Total</span>
        <span className="text-2xl font-extrabold text-emerald-400">{total} pasang</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <BigButton variant="primary" onClick={onSimpan} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </BigButton>
        <BigButton variant="ghost" onClick={onBatal} disabled={saving}>
          Batal
        </BigButton>
      </div>
    </div>
  )
}
