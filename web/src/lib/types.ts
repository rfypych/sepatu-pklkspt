export type Role = 'admin' | 'mandor'

export interface UserProfile {
  id: string
  username: string
  role: Role
  nama: string
  status_aktif: boolean
}

export interface Pekerja {
  id_pekerja: string
  nama: string
  status_aktif: boolean
  created_at: string
}

export interface TipeSepatu {
  id_sepatu: string
  nama_model: string
  ongkos_kerja: number
  status_aktif: boolean
}

export interface MasterUkuran {
  id_ukuran: string
  label_ukuran: string
  urutan: number
  status_aktif: boolean
}

export interface MasterPo {
  id_po: string
  no_po: string
  nama_customer: string | null
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  catatan: string | null
  status_aktif: boolean
}

export interface ProduksiHarian {
  id_produksi: string
  tanggal: string
  shift: 1 | 2
  id_pekerja: string
  id_sepatu: string
  id_po: string | null
  catatan: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProduksiDetail {
  id_detail: string
  id_produksi: string
  id_ukuran: string
  qty: number
  ongkos_kerja_saat_ini: number
}

export interface ProduksiWithDetail extends ProduksiHarian {
  nama_pekerja: string
  nama_model: string
  no_po: string | null
  detail: ProduksiDetail[]
  total_pasang: number
  subtotal_gaji: number
}

export interface RekapGajiRow {
  periode: string
  id_pekerja: string
  nama_pekerja: string
  id_sepatu: string
  nama_model: string
  total_pasang: number
  total_gaji: number
}
