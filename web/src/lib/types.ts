export type Role = 'admin' | 'mandor'

export interface UserProfile {
  id: number
  username: string
  role: Role
  nama: string
  status_aktif: boolean
}

export interface Pekerja {
  id_pekerja: number
  nama: string
  status_aktif: boolean | number
  created_at?: string
}

export interface TipeSepatu {
  id_sepatu: number
  nama_model: string
  ongkos_kerja: number
  status_aktif: boolean | number
}

export interface MasterUkuran {
  id_ukuran: number
  label_ukuran: string
  urutan: number
  status_aktif: boolean | number
}

export interface MasterPo {
  id_po: number
  no_po: string
  nama_customer: string | null
  target_qty: number
  achieved_qty: number
  status_aktif: boolean | number
}

export interface ProduksiHarian {
  id_produksi: number
  tanggal: string
  shift: 1 | 2
  id_pekerja: number
  id_sepatu: number
  id_po: number | null
  catatan: string | null
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface ProduksiDetail {
  id_detail: number
  id_produksi: number
  id_ukuran: number
  qty: number
  ongkos_kerja_saat_ini: number
}

export interface RekapGajiRow {
  periode: string
  id_pekerja: number
  nama_pekerja: string
  id_sepatu: number
  nama_model: string
  total_pasang: number
  total_gaji: number
}