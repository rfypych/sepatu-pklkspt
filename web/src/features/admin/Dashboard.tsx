import { useCallback, useEffect, useRef, useState } from 'react'
import { getDashboardToday, type TotalPerProduksi } from '../../lib/api'
import { formatAngka, formatRupiah, tanggalHariIni } from '../../lib/constants'
import { Card, ErrorBox, PillBadge, Spinner } from '../../components/ui'
import { ViewToggle, Tabel, THead, Th, Td, type ViewMode } from '../../components/view'
import { BarChart3, User } from 'lucide-react'

export default function Dashboard() {
  const [rows, setRows] = useState<TotalPerProduksi[]>([])
  const [view, setView] = useState<ViewMode>('kartu')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const muat = useCallback(async () => {
    try {
      const data = await getDashboardToday()
      setRows(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    muat()
    timer.current = setInterval(muat, 5000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [muat])

  const totalPasang = rows.reduce((a, r) => a + r.total_pasang, 0)
  const totalGaji = rows.reduce((a, r) => a + r.subtotal_gaji, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-700">Live Realtime (5s)</span>
          </div>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-neutral-900">
            Dashboard Produksi
          </h1>
          <p className="text-xs text-neutral-500">
            Ringkasan harian pabrik · {tanggalHariIni()}
          </p>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border-2 border-blue-700 bg-blue-600 p-4 text-white shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-100">
            Total Pasang Hari Ini
          </div>
          <div className="mt-1 text-3xl font-black tracking-tight text-white">
            {formatAngka(totalPasang)}{' '}
            <span className="text-sm font-bold text-blue-200">psg</span>
          </div>
        </div>

        <div className="rounded-3xl border-2 border-emerald-800 bg-emerald-700 p-4 text-white shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">
            Estimasi Gaji Hari Ini
          </div>
          <div className="mt-1 text-3xl font-black tracking-tight text-white">
            {formatRupiah(totalGaji)}
          </div>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <Spinner label="Memperbarui data realtime..." />
      ) : rows.length === 0 ? (
        <Card className="py-12 text-center text-slate-500">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <p className="text-base font-bold text-slate-700">Belum ada aktivitas produksi hari ini.</p>
          <p className="mt-0.5 text-xs text-slate-500">Data akan muncul otomatis begitu mandor menyimpan catatan di lapangan.</p>
        </Card>
      ) : view === 'tabel' ? (
        <Tabel>
          <THead>
            <Th>Pekerja</Th>
            <Th>Model</Th>
            <Th>Shift</Th>
            <Th className="text-right">Pasang</Th>
            <Th className="text-right">Ongkos</Th>
            <Th className="text-right">Subtotal</Th>
          </THead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                <Td className="font-bold text-slate-900">{r.nama_pekerja}</Td>
                <Td className="font-semibold text-slate-800">{r.nama_model}</Td>
                <Td>
                  <PillBadge color={r.shift === 1 ? 'amber' : 'blue'}>
                    {r.shift === 1 ? '☀️ Shift 1' : '🌙 Shift 2'}
                  </PillBadge>
                </Td>
                <Td className="text-right font-black text-slate-900">{formatAngka(r.total_pasang)}</Td>
                <Td className="text-right text-slate-600">
                  {formatRupiah(r.total_pasang > 0 ? r.subtotal_gaji / r.total_pasang : 0)}
                </Td>
                <Td className="text-right font-black text-emerald-700">{formatRupiah(r.subtotal_gaji)}</Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
              <Td className="font-black text-slate-900">TOTAL</Td>
              <Td></Td>
              <Td></Td>
              <Td className="text-right font-black text-slate-900">{formatAngka(totalPasang)} psg</Td>
              <Td></Td>
              <Td className="text-right font-black text-emerald-800">{formatRupiah(totalGaji)}</Td>
            </tr>
          </tfoot>
        </Tabel>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-800 font-black">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-lg font-black text-slate-900 block leading-tight">
                      {r.nama_pekerja}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Model: {r.nama_model}
                    </span>
                  </div>
                </div>
                <PillBadge color={r.shift === 1 ? 'amber' : 'blue'}>
                  {r.shift === 1 ? '☀️ Shift 1' : '🌙 Shift 2'}
                </PillBadge>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-sm font-bold text-slate-600">
                  Jumlah: <b className="text-slate-900 text-base">{r.total_pasang}</b> pasang
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-300 px-3.5 py-1.5 text-right font-black text-emerald-800 text-base">
                  {formatRupiah(r.subtotal_gaji)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
