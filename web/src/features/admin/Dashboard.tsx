import { useCallback, useEffect, useRef, useState } from 'react'
import { getDashboardToday, getCache, type TotalPerProduksi } from '../../lib/api'
import { formatAngka, formatRupiah } from '../../lib/constants'
import {
  EmptyState,
  ErrorBox,
  PageTitle,
  PillBadge,
  Skeleton,
  SkeletonTable,
  StatCard,
} from '../../components/ui'
import { ViewToggle, Tabel, THead, Th, Td, DataRow } from '../../components/view'
import { useViewMode } from '../../lib/useViewMode'
import { BarChart3, Coins, LayoutDashboard, Package, User } from 'lucide-react'

function labelTanggalPanjang(): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

export default function Dashboard() {
  const [rows, setRows] = useState<TotalPerProduksi[]>(
    () => getCache<TotalPerProduksi[]>('dashboard_today') ?? [],
  )
  const [view, setView] = useViewMode('dashboard')
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
      <PageTitle
        icon={<LayoutDashboard className="h-6 w-6" />}
        title="Hasil Kerja Hari Ini"
        subtitle={labelTanggalPanjang()}
        badge={
          <PillBadge color="emerald">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-600" />
            Otomatis diperbarui
          </PillBadge>
        }
        right={<ViewToggle value={view} onChange={setView} />}
      />

      {/* ---------- Angka besar ---------- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {loading && rows.length === 0 ? (
          <>
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
              <Skeleton className="mb-2 h-4 w-32" />
              <Skeleton className="h-10 w-36" />
            </div>
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
              <Skeleton className="mb-2 h-4 w-32" />
              <Skeleton className="h-10 w-40" />
            </div>
          </>
        ) : (
          <>
            <StatCard
              tone="blue"
              icon={<Package className="h-5 w-5" />}
              label="Sepatu Selesai Hari Ini"
              value={formatAngka(totalPasang)}
              unit="pasang"
            />
            <StatCard
              tone="emerald"
              icon={<Coins className="h-5 w-5" />}
              label="Perkiraan Upah Hari Ini"
              value={formatRupiah(totalGaji)}
              hint={`Dari ${rows.length} catatan kerja`}
            />
          </>
        )}
      </div>

      {error && <ErrorBox message={error} onRetry={muat} />}

      {loading && rows.length === 0 ? (
        <SkeletonTable rows={4} cols={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" />}
          title="Belum ada hasil kerja hari ini"
          description="Data akan muncul sendiri di halaman ini begitu mandor menyimpan catatan dari lapangan. Tidak perlu menekan tombol apa pun."
        />
      ) : view === 'tabel' ? (
        <Tabel>
          <THead>
            <Th>Pekerja</Th>
            <Th>Model</Th>
            <Th>Shift</Th>
            <Th className="text-right">Pasang</Th>
            <Th className="text-right">Upah / Pasang</Th>
            <Th className="text-right">Jumlah Upah</Th>
          </THead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="odd:bg-white even:bg-slate-50">
                <Td className="font-extrabold text-slate-900">{r.nama_pekerja}</Td>
                <Td>{r.nama_model}</Td>
                <Td>
                  <PillBadge color={r.shift === 1 ? 'amber' : 'indigo'}>
                    {r.shift === 1 ? '☀️ Shift 1' : '🌙 Shift 2'}
                  </PillBadge>
                </Td>
                <Td className="text-right font-extrabold text-slate-900">
                  {formatAngka(r.total_pasang)}
                </Td>
                <Td className="text-right text-slate-700">
                  {formatRupiah(r.total_pasang > 0 ? r.subtotal_gaji / r.total_pasang : 0)}
                </Td>
                <Td className="text-right font-extrabold text-emerald-800">
                  {formatRupiah(r.subtotal_gaji)}
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-4 border-slate-300 bg-slate-100">
              <Td className="text-lg font-extrabold text-slate-900">TOTAL</Td>
              <Td />
              <Td />
              <Td className="text-right text-lg font-extrabold text-slate-900">
                {formatAngka(totalPasang)}
              </Td>
              <Td />
              <Td className="text-right text-lg font-extrabold text-emerald-800">
                {formatRupiah(totalGaji)}
              </Td>
            </tr>
          </tfoot>
        </Tabel>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <article
              key={i}
              className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 border-b-2 border-slate-100 pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-blue-300 bg-blue-100 text-blue-800">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-extrabold leading-tight text-slate-900">
                      {r.nama_pekerja}
                    </div>
                    <div className="text-sm font-semibold text-slate-600">{r.nama_model}</div>
                  </div>
                </div>
                <PillBadge color={r.shift === 1 ? 'amber' : 'indigo'}>
                  {r.shift === 1 ? '☀️ Shift 1' : '🌙 Shift 2'}
                </PillBadge>
              </div>

              <div className="pt-2">
                <DataRow label="Jumlah selesai" value={`${formatAngka(r.total_pasang)} pasang`} />
                <DataRow label="Upah" value={formatRupiah(r.subtotal_gaji)} strong />
              </div>
            </article>
          ))}

          <div className="rounded-3xl border-2 border-slate-950 bg-slate-900 p-4 text-white shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-bold uppercase tracking-wide text-slate-300">
                Total semua
              </span>
              <span className="text-xl font-extrabold">{formatAngka(totalPasang)} pasang</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3 border-t-2 border-slate-700 pt-1.5">
              <span className="text-base font-bold uppercase tracking-wide text-slate-300">
                Total upah
              </span>
              <span className="text-2xl font-extrabold text-emerald-400">
                {formatRupiah(totalGaji)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
