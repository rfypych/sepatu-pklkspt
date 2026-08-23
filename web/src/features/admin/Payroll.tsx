import { useCallback, useEffect, useState } from 'react'
import { getDaftarPeriode, getRekapGaji, getCache } from '../../lib/api'
import type { RekapGajiRow } from '../../lib/types'
import { formatAngka, formatRupiah, labelPeriode } from '../../lib/constants'
import {
  BigButton,
  EmptyState,
  ErrorBox,
  ExportSuccessModal,
  FieldLabel,
  PageTitle,
  SelectInput,
  SkeletonTable,
  StatCard,
} from '../../components/ui'
import { ViewToggle, Tabel, THead, Th, Td } from '../../components/view'
import { useViewMode } from '../../lib/useViewMode'
import { downloadExcelWorkbook, shareExcelWorkbook } from '../../lib/laporan'
import { Coins, Download, Package, User } from 'lucide-react'

export default function Payroll() {
  const [periodeList, setPeriodeList] = useState<string[]>(
    () => getCache<string[]>('payroll_periods') ?? [],
  )
  const [periode, setPeriode] = useState('')
  const [rows, setRows] = useState<RekapGajiRow[]>([])
  const [view, setView] = useViewMode('payroll')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportedName, setExportedName] = useState<string | null>(null)

  const muatPeriode = useCallback(async () => {
    try {
      const list = await getDaftarPeriode()
      setPeriodeList(list)
      if (list.length > 0) {
        setPeriode((prev) => prev || list[0])
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    muatPeriode()
  }, [muatPeriode])

  useEffect(() => {
    if (!periode) return
    const cached = getCache<RekapGajiRow[]>(`payroll_${periode}`)
    if (cached) {
      setRows(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    getRekapGaji(periode)
      .then((data) => {
        setRows(data)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [periode])

  // Kelompokkan per pekerja
  const perPekerja = new Map<number, { nama: string; total_pasang: number; total_gaji: number }>()
  for (const r of rows) {
    const cur =
      perPekerja.get(r.id_pekerja) ?? { nama: r.nama_pekerja, total_pasang: 0, total_gaji: 0 }
    cur.total_pasang += r.total_pasang
    cur.total_gaji += r.total_gaji
    perPekerja.set(r.id_pekerja, cur)
  }
  const grandTotal = Array.from(perPekerja.values()).reduce((a, p) => a + p.total_gaji, 0)
  const totalPasangSemua = rows.reduce((a, r) => a + r.total_pasang, 0)

  function buatWorkbook(XLSX: typeof import('xlsx')) {
    const dataRows = rows.map((r) => ({
      'Nama Pekerja': r.nama_pekerja,
      Model: r.nama_model,
      'Total Pasang': r.total_pasang,
      'Total Gaji (Rp)': r.total_gaji,
    }))
    dataRows.push({
      'Nama Pekerja': 'GRAND TOTAL',
      Model: '',
      'Total Pasang': totalPasangSemua,
      'Total Gaji (Rp)': grandTotal,
    })
    const ws = XLSX.utils.json_to_sheet(dataRows)
    ws['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 18 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Gaji')
    return wb
  }

  async function exportExcel() {
    if (rows.length === 0) return
    setExporting(true)
    const namaFile = `rekap-gaji-${periode || 'semua'}.xlsx`
    try {
      const XLSX = await import('xlsx')
      downloadExcelWorkbook(XLSX, buatWorkbook(XLSX), namaFile)
      setExportedName(namaFile)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  async function bagikanPayroll() {
    if (rows.length === 0) return
    const namaFile = exportedName || `rekap-gaji-${periode || 'semua'}.xlsx`
    try {
      const XLSX = await import('xlsx')
      shareExcelWorkbook(XLSX, buatWorkbook(XLSX), namaFile)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <PageTitle
        icon={<Coins className="h-6 w-6" />}
        title="Rekap Gaji"
        subtitle="Upah dihitung otomatis dari hasil kerja yang sudah dicatat mandor."
        right={
          <>
            {rows.length > 0 && (
              <BigButton variant="dark" size="sm" onClick={exportExcel} disabled={exporting}>
                <Download className="h-5 w-5" />
                {exporting ? 'Menyiapkan file...' : 'Simpan ke Excel'}
              </BigButton>
            )}
            <ViewToggle value={view} onChange={setView} />
          </>
        }
      />

      {/* ---------- Pilih periode ---------- */}
      <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm sm:p-5">
        <FieldLabel htmlFor="periode-gaji">Pilih periode gaji</FieldLabel>
        <SelectInput
          id="periode-gaji"
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
        >
          {periodeList.length === 0 && <option value="">Belum ada periode</option>}
          {periodeList.map((p) => (
            <option key={p} value={p}>
              {labelPeriode(p)}
            </option>
          ))}
        </SelectInput>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Gaji dibagi 2 kali sebulan: tanggal 1–15 dan tanggal 16 sampai akhir bulan.
        </p>
      </div>

      {error && <ErrorBox message={error} />}

      {loading && rows.length === 0 ? (
        <SkeletonTable rows={5} cols={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Coins className="h-8 w-8" />}
          title="Belum ada data gaji di periode ini"
          description="Pilih periode lain di kotak di atas, atau tunggu sampai mandor menyimpan hasil kerja."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard
              tone="blue"
              icon={<Package className="h-5 w-5" />}
              label="Sepatu Selesai Periode Ini"
              value={formatAngka(totalPasangSemua)}
              unit="pasang"
            />
            <StatCard
              tone="emerald"
              icon={<Coins className="h-5 w-5" />}
              label="Total Gaji Dibayar"
              value={formatRupiah(grandTotal)}
              hint={`Untuk ${perPekerja.size} pekerja`}
            />
          </div>

          {view === 'tabel' ? (
            <Tabel>
              <THead>
                <Th>Pekerja</Th>
                <Th>Model</Th>
                <Th className="text-right">Pasang</Th>
                <Th className="text-right">Jumlah Gaji</Th>
              </THead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50">
                    <Td className="font-extrabold text-slate-900">{r.nama_pekerja}</Td>
                    <Td>{r.nama_model}</Td>
                    <Td className="text-right font-extrabold text-slate-900">
                      {formatAngka(r.total_pasang)}
                    </Td>
                    <Td className="text-right font-extrabold text-emerald-800">
                      {formatRupiah(r.total_gaji)}
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-4 border-slate-300 bg-slate-100">
                  <Td colSpan={2} className="text-lg font-extrabold text-slate-900">
                    TOTAL SEMUA
                  </Td>
                  <Td className="text-right text-lg font-extrabold text-slate-900">
                    {formatAngka(totalPasangSemua)}
                  </Td>
                  <Td className="text-right text-lg font-extrabold text-emerald-800">
                    {formatRupiah(grandTotal)}
                  </Td>
                </tr>
              </tfoot>
            </Tabel>
          ) : (
            <div className="space-y-3">
              {Array.from(perPekerja.entries()).map(([idPekerja, p]) => {
                const itemPekerja = rows.filter((r) => r.id_pekerja === idPekerja)
                return (
                  <article
                    key={idPekerja}
                    className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 border-b-2 border-slate-100 pb-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-blue-300 bg-blue-100 text-blue-800">
                          <User className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-lg font-extrabold leading-tight text-slate-900">
                            {p.nama}
                          </div>
                          <div className="text-sm font-semibold text-slate-600">
                            {formatAngka(p.total_pasang)} pasang selesai
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-3 py-2 text-right">
                        <div className="text-xs font-bold uppercase text-emerald-800">Gaji</div>
                        <div className="text-lg font-extrabold leading-tight text-emerald-900">
                          {formatRupiah(p.total_gaji)}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
                        Rincian model
                      </div>
                      {itemPekerja.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0"
                        >
                          <span className="text-base font-semibold text-slate-700">
                            {it.nama_model}
                            <span className="ml-1 text-sm font-medium text-slate-500">
                              ({formatAngka(it.total_pasang)} psg)
                            </span>
                          </span>
                          <span className="text-base font-extrabold text-slate-900">
                            {formatRupiah(it.total_gaji)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                )
              })}

              <div className="rounded-3xl border-2 border-slate-950 bg-slate-900 p-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-bold uppercase tracking-wide text-slate-300">
                    Total gaji periode ini
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-400">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <ExportSuccessModal
        isOpen={exportedName !== null}
        onClose={() => setExportedName(null)}
        filename={exportedName ?? ''}
        onShare={bagikanPayroll}
      />
    </div>
  )
}
