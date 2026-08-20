import { useCallback, useEffect, useState } from 'react'
import { getDaftarPeriode, getRekapGaji, getCache } from '../../lib/api'
import type { RekapGajiRow } from '../../lib/types'
import { formatAngka, formatRupiah, labelPeriode } from '../../lib/constants'
import { Card, ErrorBox, ExportSuccessModal, Modal, SelectInput, SkeletonTable } from '../../components/ui'
import { ViewToggle, Tabel, THead, Th, Td, type ViewMode } from '../../components/view'
import { downloadExcelWorkbook, shareExcelWorkbook } from '../../lib/laporan'
import { Coins, Download, Printer, User } from 'lucide-react'

export default function Payroll() {
  const [periodeList, setPeriodeList] = useState<string[]>(() => getCache<string[]>('payroll_periods') ?? [])
  const [periode, setPeriode] = useState('')
  const [rows, setRows] = useState<RekapGajiRow[]>([])
  const [view, setView] = useState<ViewMode>('tabel')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportedName, setExportedName] = useState<string | null>(null)
  const [slipWorkerId, setSlipWorkerId] = useState<number | 'all' | null>(null)

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
    const cur = perPekerja.get(r.id_pekerja) ?? { nama: r.nama_pekerja, total_pasang: 0, total_gaji: 0 }
    cur.total_pasang += r.total_pasang
    cur.total_gaji += r.total_gaji
    perPekerja.set(r.id_pekerja, cur)
  }
  const grandTotal = Array.from(perPekerja.values()).reduce((a, p) => a + p.total_gaji, 0)
  const totalPasangSemua = rows.reduce((a, r) => a + r.total_pasang, 0)

  async function exportExcel() {
    if (rows.length === 0) return
    setExporting(true)
    const namaFile = `payroll-${periode || 'rekap'}.xlsx`
    try {
      const XLSX = await import('xlsx')
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
      downloadExcelWorkbook(XLSX, wb, namaFile)
      setExportedName(namaFile)
    } finally {
      setExporting(false)
    }
  }

  async function bagikanPayroll() {
    if (rows.length === 0) return
    const namaFile = exportedName || `payroll-${periode || 'rekap'}.xlsx`
    try {
      const XLSX = await import('xlsx')
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
      shareExcelWorkbook(XLSX, wb, namaFile)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Rekap Gaji (Payroll)</h1>
          <p className="text-xs font-semibold text-slate-500">Perhitungan upah kerja otomatis per periode cut-off.</p>
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <>
              <button
                onClick={() => setSlipWorkerId('all')}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <Printer className="h-3.5 w-3.5 text-slate-600" />
                <span>Cetak Slip</span>
              </button>
              <button
                onClick={exportExcel}
                disabled={exporting}
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
            </>
          )}
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {/* Periode Selector (M3 Card) */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SelectInput value={periode} onChange={(e) => setPeriode(e.target.value)} className="py-2.5 text-sm">
          {periodeList.length === 0 && <option value="">Belum ada data periode</option>}
          {periodeList.map((p) => (
            <option key={p} value={p}>
              Periode: {labelPeriode(p)}
            </option>
          ))}
        </SelectInput>
      </div>

      {error && <ErrorBox message={error} />}

      {loading && rows.length === 0 ? (
        <SkeletonTable rows={5} cols={4} />
      ) : rows.length === 0 ? (
        <Card className="py-12 text-center text-slate-500">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Coins className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">Belum ada data pada periode ini.</p>
          <p className="mt-0.5 text-xs text-slate-400">Pilih periode penggajian lain di atas.</p>
        </Card>
      ) : (
        <>
          {/* Summary Metric Cards (M3 Tonal Containers) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-blue-200/90 bg-blue-50/90 p-4.5 sm:p-5 text-blue-950 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Total Pasang Periode
              </div>
              <div className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-blue-950">
                {formatAngka(totalPasangSemua)}{' '}
                <span className="text-xs sm:text-sm font-bold text-blue-700">psg</span>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200/90 bg-emerald-50/90 p-4.5 sm:p-5 text-emerald-950 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Total Pengeluaran Gaji
              </div>
              <div className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-emerald-950">
                {formatRupiah(grandTotal)}
              </div>
            </div>
          </div>

          {view === 'tabel' ? (
            <Tabel>
              <THead>
                <Th>Pekerja</Th>
                <Th>Model</Th>
                <Th className="text-right">Total Pasang</Th>
                <Th className="text-right">Total Gaji</Th>
                <Th className="text-right w-24">Aksi</Th>
              </THead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <Td className="font-bold text-slate-900">{r.nama_pekerja}</Td>
                    <Td className="font-semibold text-slate-800">{r.nama_model}</Td>
                    <Td className="text-right font-black text-slate-900">{formatAngka(r.total_pasang)} psg</Td>
                    <Td className="text-right font-black text-emerald-700">{formatRupiah(r.total_gaji)}</Td>
                    <Td className="text-right">
                      <button
                        onClick={() => setSlipWorkerId(r.id_pekerja)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Cetak slip pekerja ini"
                      >
                        <Printer className="h-3 w-3" />
                        <span>Slip</span>
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                  <Td colSpan={2} className="font-black text-slate-900">GRAND TOTAL</Td>
                  <Td className="text-right font-black text-slate-900">{formatAngka(totalPasangSemua)} psg</Td>
                  <Td className="text-right font-black text-emerald-800">{formatRupiah(grandTotal)}</Td>
                  <Td />
                </tr>
              </tfoot>
            </Tabel>
          ) : (
            <div className="space-y-3">
              {Array.from(perPekerja.entries()).map(([idPekerja, p]) => {
                const itemPekerja = rows.filter((r) => r.id_pekerja === idPekerja)
                return (
                  <div key={idPekerja} className="rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-800 font-black">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-lg font-black text-slate-900 block leading-tight">
                            {p.nama}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            Total Produksi: {formatAngka(p.total_pasang)} pasang
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSlipWorkerId(idPekerja)}
                          className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
                          title="Cetak slip gaji"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 px-3.5 py-1.5 text-right font-black text-emerald-800 text-base shadow-xs">
                          {formatRupiah(p.total_gaji)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pl-2">
                      {itemPekerja.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                          <span>
                            • <b>{it.nama_model}</b> ({formatAngka(it.total_pasang)} psg)
                          </span>
                          <span className="font-bold text-slate-900">{formatRupiah(it.total_gaji)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Printable Slip Gaji Modal */}
      {slipWorkerId !== null && (
        <Modal isOpen={true} onClose={() => setSlipWorkerId(null)} title="Cetak Slip Gaji">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600">Pilih Pekerja:</label>
              <select
                value={slipWorkerId === 'all' ? 'all' : String(slipWorkerId)}
                onChange={(e) => setSlipWorkerId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="all">Semua Pekerja ({perPekerja.size} Orang)</option>
                {Array.from(perPekerja.entries()).map(([id, p]) => (
                  <option key={id} value={id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Print Container */}
            <div id="printable-slip-area" className="max-h-[60vh] overflow-y-auto space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {Array.from(perPekerja.entries())
                .filter(([id]) => slipWorkerId === 'all' || slipWorkerId === id)
                .map(([id, p]) => {
                  const itemPekerja = rows.filter((r) => r.id_pekerja === id)
                  return (
                    <div
                      key={id}
                      className="bg-white rounded-2xl border border-slate-300 p-5 shadow-xs text-slate-900 print:border-none print:shadow-none print:p-0 print:m-0"
                    >
                      {/* Kop Slip */}
                      <div className="border-b-2 border-slate-900 pb-3 text-center">
                        <h2 className="text-base font-black tracking-tight uppercase">SLIP GAJI BORONGAN</h2>
                        <p className="text-xs font-semibold text-slate-600">PKLK SPT - SISTEM PRODUKSI</p>
                      </div>

                      {/* Info Pekerja & Periode */}
                      <div className="grid grid-cols-2 gap-2 py-3 text-xs border-b border-slate-200">
                        <div>
                          <span className="text-slate-500 font-semibold block">Nama Pekerja:</span>
                          <span className="font-black text-sm text-slate-900">{p.nama}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 font-semibold block">Periode Gaji:</span>
                          <span className="font-bold text-slate-900">{labelPeriode(periode)}</span>
                        </div>
                      </div>

                      {/* Tabel Rincian */}
                      <table className="w-full text-xs mt-3 mb-4">
                        <thead>
                          <tr className="border-b border-slate-300 text-slate-600 font-bold">
                            <th className="text-left py-1.5">Model Sepatu</th>
                            <th className="text-right py-1.5">Pasang</th>
                            <th className="text-right py-1.5">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemPekerja.map((it, idx) => (
                            <tr key={idx} className="border-b border-slate-100">
                              <td className="py-1.5 font-semibold text-slate-800">{it.nama_model}</td>
                              <td className="py-1.5 text-right font-bold text-slate-700">{formatAngka(it.total_pasang)} psg</td>
                              <td className="py-1.5 text-right font-black text-slate-900">{formatRupiah(it.total_gaji)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-800 font-black text-sm bg-slate-50">
                            <td className="py-2">TOTAL DITERIMA</td>
                            <td className="py-2 text-right">{formatAngka(p.total_pasang)} psg</td>
                            <td className="py-2 text-right text-emerald-800">{formatRupiah(p.total_gaji)}</td>
                          </tr>
                        </tfoot>
                      </table>

                      {/* Tanda Tangan */}
                      <div className="grid grid-cols-2 gap-4 text-center text-xs pt-4 border-t border-slate-200">
                        <div>
                          <p className="text-slate-500 font-semibold mb-10">Penerima (Pekerja),</p>
                          <p className="font-bold border-t border-dashed border-slate-400 pt-1 mx-4">({p.nama})</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-semibold mb-10">Admin / Kasir,</p>
                          <p className="font-bold border-t border-dashed border-slate-400 pt-1 mx-4">(............................)</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSlipWorkerId(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak / Cetak PDF</span>
              </button>
            </div>
          </div>
        </Modal>
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
