import { useCallback, useEffect, useRef, useState } from 'react'
import { getDashboardToday, getCache, type TotalPerProduksi } from '../../lib/api'
import { formatAngka, formatRupiah, tanggalHariIni } from '../../lib/constants'
import { Card, ErrorBox, PillBadge, Skeleton, SkeletonTable } from '../../components/ui'
import { ViewToggle, Tabel, THead, Th, Td, type ViewMode } from '../../components/view'
import { BarChart3, User } from 'lucide-react'

export default function Dashboard() {
  const [rows, setRows] = useState<TotalPerProduksi[]>(() => getCache<TotalPerProduksi[]>('dashboard_today') ?? [])
  const [view, setView] = useState<ViewMode>('tabel')
  const [loading, setLoading] = useState(() => !getCache('dashboard_today'))
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
    const onFocus = () => muat()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      if (timer.current) clearInterval(timer.current)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-3 py-0.5 text-xs font-black text-emerald-900 border border-emerald-200/80">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Realtime (5s)
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Dashboard Produksi
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Ringkasan harian pabrik · {tanggalHariIni()}
          </p>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Metric Cards (M3 Tonal Containers) */}
      <div className="grid grid-cols-2 gap-3">
        {loading && rows.length === 0 ? (
          <>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <Skeleton className="h-3 w-28 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <Skeleton className="h-3 w-28 mb-2" />
              <Skeleton className="h-8 w-36" />
            </div>
          </>
        ) : (
          <>
            <div className="rounded-3xl border border-blue-200/90 bg-blue-50/90 p-4.5 sm:p-5 text-blue-950 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Total Pasang Hari Ini
              </div>
              <div className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-blue-950">
                {formatAngka(totalPasang)}{' '}
                <span className="text-xs sm:text-sm font-bold text-blue-700">psg</span>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200/90 bg-emerald-50/90 p-4.5 sm:p-5 text-emerald-950 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Estimasi Gaji Hari Ini
              </div>
              <div className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-emerald-950">
                {formatRupiah(totalGaji)}
              </div>
            </div>
          </>
        )}
      </div>

      {error && <ErrorBox message={error} />}

      {loading && rows.length === 0 ? (
        <SkeletonTable rows={4} cols={5} />
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
