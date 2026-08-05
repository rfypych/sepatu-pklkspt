import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatAngka, formatRupiah, tanggalHariIni } from '../../lib/constants'
import { Card, ErrorBox, Spinner } from '../../components/ui'

interface TotalRow {
  tanggal: string
  shift: 1 | 2
  nama_pekerja: string
  nama_model: string
  total_pasang: number
  subtotal_gaji: number
}

export default function Dashboard() {
  const [rows, setRows] = useState<TotalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const muat = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('v_total_per_produksi')
        .select('*')
        .eq('tanggal', tanggalHariIni())
        .order('shift')
      if (error) throw error
      setRows((data ?? []) as TotalRow[])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    muat()

    const channel = supabase
      .channel('dashboard-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produksi_harian' },
        () => muat(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produksi_detail' },
        () => muat(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [muat])

  const totalPasang = rows.reduce((a, r) => a + r.total_pasang, 0)
  const totalGaji = rows.reduce((a, r) => a + r.subtotal_gaji, 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Dashboard Produksi</h1>
        <p className="text-sm text-slate-500">Update otomatis (real-time) · {tanggalHariIni()}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-slate-900 text-white border-slate-900">
          <div className="text-xs text-slate-400">Total Pasang Hari Ini</div>
          <div className="mt-1 text-2xl font-bold">{formatAngka(totalPasang)}</div>
        </Card>
        <Card className="bg-emerald-600 text-white border-emerald-600">
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
          {rows.map((r, i) => (
            <Card key={i}>
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
