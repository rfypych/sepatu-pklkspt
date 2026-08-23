import { FieldLabel } from './ui'
import { formatTanggal, rentangBulan, rentangTahun, type PeriodRiwayat } from '../lib/constants'

const PERIODE_LIST: { value: PeriodRiwayat; label: string; hint: string }[] = [
  { value: 'hari', label: 'Per Hari', hint: 'Satu tanggal' },
  { value: 'bulan', label: 'Per Bulan', hint: 'Satu bulan' },
  { value: 'tahun', label: 'Per Tahun', hint: 'Satu tahun' },
]

/**
 * Filter periode (hari / bulan / tahun) yang dipakai bersama oleh halaman
 * Riwayat (mandor) dan Data Produksi (admin), supaya cara pakainya sama
 * di kedua tempat dan pengguna tidak perlu belajar dua kali.
 *
 * Semua mode memakai pemilih TANGGAL yang sama:
 * - Hari  -> data yang tampil adalah tanggal tersebut
 * - Bulan -> data yang tampil adalah satu bulan penuh dari tanggal tersebut
 * - Tahun -> data yang tampil adalah satu tahun penuh dari tanggal tersebut
 * Bulan & tahun selalu ikut diperbarui mengikuti tanggal yang dipilih,
 * jadi pilihan di layar tidak pernah tidak sinkron dengan data.
 */
export default function PeriodeFilter({
  periode,
  setPeriode,
  tanggal,
  setTanggal,
  bulan,
  setBulan,
  tahun,
  setTahun,
  children,
}: {
  periode: PeriodRiwayat
  setPeriode: (p: PeriodRiwayat) => void
  tanggal: string
  setTanggal: (v: string) => void
  bulan: string
  setBulan: (v: string) => void
  tahun: string
  setTahun: (v: string) => void
  /** Slot filter tambahan, mis. filter pekerja di halaman admin. */
  children?: React.ReactNode
}) {
  function gantiPeriode(p: PeriodRiwayat) {
    setPeriode(p)
    // Samakan bulan & tahun dengan tanggal yang sedang terpilih, supaya
    // pemilih tanggal dan data yang ditampilkan tidak pernah beda.
    if (tanggal) {
      setBulan(tanggal.slice(0, 7))
      setTahun(tanggal.slice(0, 4))
    }
  }

  function ubahTanggal(v: string) {
    setTanggal(v)
    if (!v) return
    setBulan(v.slice(0, 7))
    setTahun(v.slice(0, 4))
  }

  const rentangB = rentangBulan(bulan)
  const rentangT = rentangTahun(tahun)
  const keterangan =
    periode === 'hari'
      ? 'Data yang tampil: hanya tanggal yang dipilih.'
      : periode === 'bulan'
        ? `Data yang tampil: satu bulan penuh, ${formatTanggal(rentangB.dari)} sampai ${formatTanggal(rentangB.sampai)}.`
        : `Data yang tampil: satu tahun penuh, ${formatTanggal(rentangT.dari)} sampai ${formatTanggal(rentangT.sampai)}.`

  return (
    <div className="space-y-4 rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <FieldLabel>Lihat data</FieldLabel>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Pilih rentang waktu">
          {PERIODE_LIST.map((p) => {
            const aktif = periode === p.value
            return (
              <button
                key={p.value}
                onClick={() => gantiPeriode(p.value)}
                aria-pressed={aktif}
                className={`min-h-16 rounded-2xl border-2 px-2 py-2 text-center transition-colors ${
                  aktif
                    ? 'border-slate-950 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 active:bg-slate-100'
                }`}
              >
                <div className="text-base font-extrabold leading-tight">{p.label}</div>
                <div className={`text-sm ${aktif ? 'text-slate-300' : 'text-slate-500'}`}>
                  {p.hint}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="filter-tanggal">Pilih tanggal</FieldLabel>
          <input
            id="filter-tanggal"
            type="date"
            value={tanggal}
            onChange={(e) => ubahTanggal(e.target.value)}
            className="min-h-14 w-full rounded-2xl border-2 border-slate-400 bg-white px-4 py-3 text-lg font-bold text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/15"
          />
          <p className="mt-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-base font-semibold leading-snug text-slate-700">
            {keterangan}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
