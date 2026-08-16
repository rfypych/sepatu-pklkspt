import type { ProduksiRow } from './api'
import type { MasterPo, MasterUkuran } from './types'
import { formatAngka, formatTanggalPendek } from './constants'

function totalPasang(row: ProduksiRow) {
  return row.detail.reduce((a, d) => a + d.qty, 0)
}
function totalGaji(row: ProduksiRow) {
  return row.detail.reduce((a, d) => a + d.qty * d.ongkos_kerja_saat_ini, 0)
}

export interface BarisLaporan {
  row: ProduksiRow
  pasang: number
  ongkos: number
  subtotal: number
  target: number | undefined
  harianProgress: number | undefined
  rincianSize: string
}

export function buatBarisLaporan(
  rows: ProduksiRow[],
  poList: MasterPo[],
  ukuranList: MasterUkuran[],
): BarisLaporan[] {
  const labelUkuran = new Map(ukuranList.map((u) => [u.id_ukuran, u.label_ukuran]))
  const targetPo = new Map(poList.map((p) => [p.id_po, p.target_qty]))
  const progressPo = new Map<string, number>()
  for (const r of rows) {
    if (r.id_po == null) continue
    const k = `${r.id_po}|${r.tanggal}`
    progressPo.set(k, (progressPo.get(k) ?? 0) + totalPasang(r))
  }
  return rows.map((r) => {
    const pasang = totalPasang(r)
    const ongkos = r.detail[0]?.ongkos_kerja_saat_ini ?? 0
    const target = r.id_po != null ? targetPo.get(r.id_po) : undefined
    const harianProgress = r.id_po != null ? progressPo.get(`${r.id_po}|${r.tanggal}`) ?? 0 : undefined
    return {
      row: r,
      pasang,
      ongkos,
      subtotal: totalGaji(r),
      target,
      harianProgress,
      rincianSize: r.detail.map((d) => `${labelUkuran.get(d.id_ukuran) ?? d.id_ukuran}: ${d.qty}`).join(' · '),
    }
  })
}

export async function exportLaporanHarian(
  rows: ProduksiRow[],
  poList: MasterPo[],
  ukuranList: MasterUkuran[],
  namaFile: string,
) {
  if (rows.length === 0) return
  const XLSX = await import('xlsx')
  const baris = buatBarisLaporan(rows, poList, ukuranList)
  const data = baris.map((b) => ({
    Karyawan: b.row.nama_pekerja,
    Tanggal: formatTanggalPendek(b.row.tanggal),
    Model: b.row.nama_model,
    PO: b.row.no_po ?? '—',
    'Target PO': b.target ?? '',
    'Rincian Size': b.rincianSize,
    'Ongkos × Pasang': `${formatAngka(b.ongkos)} × ${b.pasang}`,
    Subtotal: b.subtotal,
    'Progress PO': b.row.id_po != null && b.target ? `${b.harianProgress}/${formatAngka(b.target)}` : '—',
  }))
  data.push({
    Karyawan: 'TOTAL',
    Tanggal: '',
    Model: '',
    PO: '',
    'Target PO': '',
    'Rincian Size': `${rows.reduce((a, r) => a + totalPasang(r), 0)} pasang`,
    'Ongkos × Pasang': '',
    Subtotal: rows.reduce((a, r) => a + totalGaji(r), 0),
    'Progress PO': '',
  })
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Harian')
  XLSX.writeFile(wb, namaFile)
}