import { useCallback, useEffect, useState } from 'react'
import { getDaftarPeriode, getRekapGaji } from '../../lib/api'
import type { RekapGajiRow } from '../../lib/types'
import { formatAngka, formatRupiah, labelPeriode } from '../../lib/constants'
import { BigButton, Card, ErrorBox, SelectInput, Spinner } from '../../components/ui'

export default function Payroll() {
  const [periodeList, setPeriodeList] = useState<string[]>([])
  const [periode, setPeriode] = useState('')
  const [rows, setRows] = useState<RekapGajiRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const muatPeriode = useCallback(async () => {
    try {
      const list = await getDaftarPeriode()
      setPeriodeList(list)
      if (list.length > 0) setPeriode((prev) => prev || list[0])
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
    setLoading(true)
    getRekapGaji(periode)
      .then(setRows)
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

  function exportCsv() {
    const header = ['Nama Pekerja', 'Model', 'Total Pasang', 'Total Gaji']
    const body = rows.map((r) => [
      r.nama_pekerja,
      r.nama_model,
      r.total_pasang,
      r.total_gaji.toFixed(0),
    ])
    const csv = [header, ...body]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-${periode}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Payroll</h1>
          <p className="text-sm text-slate-500">Rekap gaji otomatis per periode.</p>
        </div>
        {rows.length > 0 && (
          <BigButton variant="secondary" className="py-2" onClick={exportCsv}>
            ⬇ CSV
          </BigButton>
        )}
      </div>

      <Card>
        <SelectInput value={periode} onChange={(e) => setPeriode(e.target.value)}>
          {periodeList.length === 0 && <option value="">Belum ada data</option>}
          {periodeList.map((p) => (
            <option key={p} value={p}>
              {labelPeriode(p)}
            </option>
          ))}
        </SelectInput>
      </Card>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Card className="text-center text-slate-500">
          <div className="text-4xl">💰</div>
          <p className="mt-2">Belum ada data pada periode ini.</p>
        </Card>
      ) : (
        <>
          <Card className="bg-slate-900 text-white border-slate-900">
            <div className="text-xs text-slate-400">Total Gaji Periode</div>
            <div className="mt-1 text-2xl font-bold">{formatRupiah(grandTotal)}</div>
          </Card>

          <div className="space-y-3">
            {Array.from(perPekerja.entries()).map(([id, p]) => (
              <Card key={id}>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900">{p.nama}</div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-700">{formatRupiah(p.total_gaji)}</div>
                    <div className="text-sm text-slate-500">{formatAngka(p.total_pasang)} pasang</div>
                  </div>
                </div>
                <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                  {rows
                    .filter((r) => r.id_pekerja === id)
                    .map((r, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-600">{r.nama_model}</span>
                        <span className="text-slate-500">
                          {formatAngka(r.total_pasang)} ps × {formatRupiah(r.total_gaji / r.total_pasang)} ={' '}
                          {formatRupiah(r.total_gaji)}
                        </span>
                      </div>
                    ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
