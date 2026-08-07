import { useCallback, useEffect, useState } from 'react'
import { getRekapHarian, type RekapHarianRow } from '../../lib/api'
import { formatAngka, formatRupiah, formatTanggalPendek } from '../../lib/constants'
import { BigButton, Card, ErrorBox, Spinner } from '../../components/ui'

type CellType = 'pasang' | 'gaji'

type PresetId = 'minggu' | '7hari' | 'bulan' | '30hari'

const PRESETS: { id: PresetId; label: string; compute: (today: Date) => { dari: string; sampai: string } }[] = [
  { id: 'minggu', label: 'Minggu Ini', compute: (t) => { const mon = addDays(t, -((t.getDay() + 6) % 7)); return { dari: iso(mon), sampai: iso(addDays(mon, 6)) } } },
  { id: '7hari', label: '7 Hari Terakhir', compute: (t) => ({ dari: iso(addDays(t, -6)), sampai: iso(t) }) },
  { id: 'bulan', label: 'Bulan Ini', compute: (t) => ({ dari: iso(new Date(t.getFullYear(), t.getMonth(), 1)), sampai: iso(t) }) },
  { id: '30hari', label: '30 Hari Terakhir', compute: (t) => ({ dari: iso(addDays(t, -29)), sampai: iso(t) }) },
]

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}
function dateList(dari: string, sampai: string): string[] {
  const out: string[] = []
  const cur = new Date(`${dari}T00:00:00`)
  const end = new Date(`${sampai}T00:00:00`)
  while (cur <= end) {
    out.push(iso(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

export default function RekapHarian() {
  const [presetId, setPresetId] = useState<PresetId>('minggu')
  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')
  const [cellType, setCellType] = useState<CellType>('pasang')
  const [rows, setRows] = useState<RekapHarianRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const muat = useCallback(async (d: string, s: string) => {
    setLoading(true)
    try {
      setRows(await getRekapHarian(d, s))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  function pilihPreset(id: PresetId) {
    const preset = PRESETS.find((p) => p.id === id)!
    const { dari: d, sampai: s } = preset.compute(new Date())
    setPresetId(id)
    setDari(d)
    setSampai(s)
    void muat(d, s)
  }

  useEffect(() => {
    pilihPreset('minggu')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dates = dateList(dari, sampai)
  const pekerja = [...new Set(rows.map((r) => r.nama_pekerja))].sort((a, b) => a.localeCompare(b, 'id'))
  const byKey = new Map(rows.map((r) => [`${r.tanggal}|${r.nama_pekerja}`, r]))

  function nilai(tanggal: string, nama: string): number {
    const r = byKey.get(`${tanggal}|${nama}`)
    return r ? (cellType === 'pasang' ? r.total_pasang : r.total_gaji) : 0
  }
  function fmt(n: number): string {
    if (n === 0) return '–'
    return cellType === 'pasang' ? formatAngka(n) : formatRupiah(n)
  }

  const totalPekerja = (nama: string) => rows.filter((r) => r.nama_pekerja === nama).reduce((a, r) => a + (cellType === 'pasang' ? r.total_pasang : r.total_gaji), 0)
  const totalTanggal = (tgl: string) => rows.filter((r) => r.tanggal === tgl).reduce((a, r) => a + (cellType === 'pasang' ? r.total_pasang : r.total_gaji), 0)
  const grandTotal = rows.reduce((a, r) => a + (cellType === 'pasang' ? r.total_pasang : r.total_gaji), 0)

  function exportCsv() {
    const baris = rows
      .slice()
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.nama_pekerja.localeCompare(b.nama_pekerja, 'id'))
      .map((r) => `${r.tanggal};${r.nama_pekerja};${r.total_pasang};${r.total_gaji}`)
    const csv = ['Tanggal;Pekerja;Pasang;Gaji', ...baris].join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rekap-harian_${dari}_${sampai}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Rekap Harian</h1>
          <p className="text-sm text-slate-500">Data per hari dalam rentang minggu/bulan — seperti Excel.</p>
        </div>
        {rows.length > 0 && (
          <BigButton variant="secondary" className="shrink-0 px-3 py-2 text-xs" onClick={exportCsv}>
            ⬇ CSV
          </BigButton>
        )}
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => pilihPreset(p.id)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                presetId === p.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Dari</span>
            <input
              type="date"
              value={dari}
              onChange={(e) => {
                setPresetId('' as PresetId)
                setDari(e.target.value)
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Sampai</span>
            <input
              type="date"
              value={sampai}
              onChange={(e) => {
                setPresetId('' as PresetId)
                setSampai(e.target.value)
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <BigButton
            disabled={!dari || !sampai || loading}
            onClick={() => void muat(dari, sampai)}
            className="flex-1"
          >
            Tampilkan
          </BigButton>
          <div className="flex shrink-0 gap-1 rounded-xl bg-slate-200 p-1">
            {(['pasang', 'gaji'] as CellType[]).map((c) => (
              <button
                key={c}
                onClick={() => setCellType(c)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  cellType === c ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                {c === 'pasang' ? 'Pasang' : 'Gaji'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Card className="text-center text-slate-500">
          <div className="text-4xl">📅</div>
          <p className="mt-2">Tidak ada data pada rentang tersebut.</p>
        </Card>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="border-collapse text-sm">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-900 text-white">
                <th className="sticky left-0 z-30 bg-slate-900 px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">
                  Pekerja \ Tanggal
                </th>
                {dates.map((d) => (
                  <th key={d} className="px-2 py-2 text-center text-xs font-semibold whitespace-nowrap">
                    {formatTanggalPendek(d)}
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-xs font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {pekerja.map((nama) => (
                <tr key={nama} className="hover:bg-slate-50">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 font-semibold whitespace-nowrap text-slate-900">
                    {nama}
                  </td>
                  {dates.map((d) => (
                    <td key={d} className="px-2 py-2 text-center tabular-nums">
                      {fmt(nilai(d, nama))}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-slate-900">
                    {fmt(totalPekerja(nama))}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold">
                <td className="sticky left-0 z-10 bg-slate-100 px-3 py-2 whitespace-nowrap text-slate-900">Total</td>
                {dates.map((d) => (
                  <td key={d} className="px-2 py-2 text-center font-semibold tabular-nums">
                    {fmt(totalTanggal(d))}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-bold tabular-nums text-slate-900">{fmt(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
