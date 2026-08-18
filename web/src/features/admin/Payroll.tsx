import { useCallback, useEffect, useState } from 'react'
import { getDaftarPeriode, getRekapGaji, getCache } from '../../lib/api'
import type { RekapGajiRow } from '../../lib/types'
import { formatAngka, formatRupiah, labelPeriode } from '../../lib/constants'
import { Card, ErrorBox, SelectInput, SkeletonTable } from '../../components/ui'
import { ViewToggle, Tabel, THead, Th, Td, type ViewMode } from '../../components/view'
import { downloadExcelWorkbook } from '../../lib/laporan'
import { Coins, Download, User } from 'lucide-react'

export default function Payroll() {
  const [periodeList, setPeriodeList] = useState<string[]>(() => getCache<string[]>('payroll_periods') ?? [])
  const [periode, setPeriode] = useState('')
  const [rows, setRows] = useState<RekapGajiRow[]>([])
  const [view, setView] = useState<ViewMode>('tabel')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    downloadExcelWorkbook(XLSX, wb, `payroll-${periode || 'rekap'}.xlsx`)
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
            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor Excel</span>
            </button>
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
              </THead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <Td className="font-bold text-slate-900">{r.nama_pekerja}</Td>
                    <Td className="font-semibold text-slate-800">{r.nama_model}</Td>
                    <Td className="text-right font-black text-slate-900">{formatAngka(r.total_pasang)} psg</Td>
                    <Td className="text-right font-black text-emerald-700">{formatRupiah(r.total_gaji)}</Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                  <Td colSpan={2} className="font-black text-slate-900">GRAND TOTAL</Td>
                  <Td className="text-right font-black text-slate-900">{formatAngka(totalPasangSemua)} psg</Td>
                  <Td className="text-right font-black text-emerald-800">{formatRupiah(grandTotal)}</Td>
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
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-300 px-3.5 py-1.5 text-right font-black text-emerald-800 text-base shadow-xs">
                        {formatRupiah(p.total_gaji)}
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
    </div>
  )
}
