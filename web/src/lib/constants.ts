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
  // periode format: 'YYYY-MM-1' atau 'YYYY-MM-2'
  const [tahun, bulan, nomor] = periode.split('-')
  const namaBulan = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(
    new Date(Number(tahun), Number(bulan) - 1, 1),
  )
  return nomor === '1' ? `1–15 ${namaBulan} ${tahun}` : `16–31 ${namaBulan} ${tahun}`
}

export function tanggalHariIni(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
