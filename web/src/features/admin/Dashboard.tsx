import { useCallback, useEffect, useRef, useState } from 'react'
import { getDashboardToday, type TotalPerProduksi } from '../../lib/api'
import { formatAngka, formatRupiah, tanggalHariIni } from '../../lib/constants'
import { Card, ErrorBox, Spinner } from '../../components/ui'

export default function Dashboard() {
  const [rows, setRows] = useState<TotalPerProduksi[]>([])
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
      <div>
        <h1 className="text-lg font-bold text-slate-900">Dashboard Produksi</h1>
        <p className="text-sm text-slate-500">
          Update otomatis tiap 5 detik · {tanggalHariIni()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card color="slate">
          <div className="text-xs text-slate-300">Total Pasang Hari Ini</div>
          <div className="mt-1 text-2xl font-bold">{formatAngka(totalPasang)}</div>
        </Card>
        <Card color="emerald">
          <div className="text-xs text-emerald-100">Perkiraan Gaji</div>
          <div className="mt-1 text-2xl font-bold">{formatRupiah(totalGaji)}</div>
        </Card>
      </div>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Card className="text-center text-slate-500">
          <div className="text-4xl">📊</div>
          <p className="mt-2">Belum ada data hari ini.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id_produksi}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{r.nama_pekerja}</div>
                  <div className="text-sm text-slate-500">
                    {r.nama_model} · {r.shift === 1 ? 'Shift 1' : 'Shift 2'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{formatAngka(r.total_pasang)} pasang</div>
                  <div className="text-sm text-emerald-700">{formatRupiah(r.subtotal_gaji)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
