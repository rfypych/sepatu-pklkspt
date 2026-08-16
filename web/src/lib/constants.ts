export const SHIFTS = [
  { value: 1 as const, label: 'SHIFT 1', sub: 'Pagi' },
  { value: 2 as const, label: 'SHIFT 2', sub: 'Siang/Malam' },
]

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatAngka(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}

export function formatTanggal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function formatTanggalPendek(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function labelPeriode(periode: string): string {
  // periode format: 'YYYY-MM-1' (tgl 1-15) atau 'YYYY-MM-2' (tgl 16-akhir)
  const [tahun, bulan, nomor] = periode.split('-')
  const dateObj = new Date(Number(tahun), Number(bulan) - 1, 1)
  const namaBulan = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(dateObj)
  if (nomor === '1') {
    return `Tgl 1–15 ${namaBulan} ${tahun} (Periode I / Tengah Bulan)`
  }
  const lastDay = new Date(Number(tahun), Number(bulan), 0).getDate()
  return `Tgl 16–${lastDay} ${namaBulan} ${tahun} (Periode II / Akhir Bulan)`
}

export function tanggalHariIni(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function tanggalAwalBulan(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function tanggalAwalTahun(): string {
  return `${new Date().getFullYear()}-01-01`
}

export function labelPeriodeRiwayat(p: PeriodRiwayat): string {
  if (p === 'hari') return 'Hari Ini'
  if (p === 'bulan') {
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date())
  }
  return `Tahun ${new Date().getFullYear()}`
}

export type PeriodRiwayat = 'hari' | 'bulan' | 'tahun'
