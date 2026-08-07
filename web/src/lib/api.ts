import { API_URL, getToken } from './config'
import type {
  MasterPo,
  MasterUkuran,
  Pekerja,
  ProduksiDetail,
  ProduksiHarian,
  RekapGajiRow,
  TipeSepatu,
  UserProfile,
} from './types'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Gagal (${res.status})`)
  }
  return data as T
}

function get<T>(path: string) {
  return request<T>(path)
}
function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) })
}
function put<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
}
function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' })
}
function patch<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
}

// MySQL mengembalikan kolom DECIMAL sebagai string; normalisasi ke number.
const toNum = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? Number(v) : 0)

// ---------------- AUTH ----------------
export interface LoginResult {
  token: string
  user: UserProfile
}
export function apiLogin(username: string, password: string) {
  return post<LoginResult>('/auth/login', { username, password })
}
export function apiMe() {
  return get<{ user: UserProfile }>('/auth/me')
}

// ---------------- PEKERJA ----------------
export const getPekerjaAktif = () => get<Pekerja[]>('/pekerja?aktif=true')
export const getPekerjaSemua = () => get<Pekerja[]>('/pekerja')
export const tambahPekerja = (nama: string) => post<Pekerja>('/pekerja', { nama })
export const ubahPekerja = (id: number, body: { nama?: string; status_aktif?: boolean }) =>
  patch<{ ok: boolean }>(`/pekerja/${id}`, body)

// ---------------- TIPE SEPATU ----------------
const normTipe = (m: TipeSepatu): TipeSepatu => ({ ...m, ongkos_kerja: toNum(m.ongkos_kerja) })
export const getTipeSepatuAktif = async () => (await get<TipeSepatu[]>('/tipe-sepatu?aktif=true')).map(normTipe)
export const getTipeSepatuSemua = async () => (await get<TipeSepatu[]>('/tipe-sepatu')).map(normTipe)
export const tambahModel = (nama_model: string, ongkos_kerja: number) =>
  post<TipeSepatu>('/tipe-sepatu', { nama_model, ongkos_kerja })
export const ubahTipeSepatu = (id: number, body: { nama_model?: string; ongkos_kerja?: number; status_aktif?: boolean }) =>
  patch<{ ok: boolean }>(`/tipe-sepatu/${id}`, body)

// ---------------- UKURAN ----------------
export const getUkuranAktif = () => get<MasterUkuran[]>('/ukuran?aktif=true')
export const getUkuranSemua = () => get<MasterUkuran[]>('/ukuran')
export const tambahUkuran = (label_ukuran: string) => post<MasterUkuran>('/ukuran', { label_ukuran })
export const ubahUkuran = (id: number, status_aktif: boolean) =>
  patch<{ ok: boolean }>(`/ukuran/${id}`, { status_aktif })

// ---------------- PO ----------------
export const getPoAktif = () => get<MasterPo[]>('/po?aktif=true')
export const getPoSemua = () => get<MasterPo[]>('/po')
export const tambahPo = (no_po: string, nama_customer: string) =>
  post<MasterPo>('/po', { no_po, nama_customer })
export const ubahPo = (id: number, status_aktif: boolean) =>
  patch<{ ok: boolean }>(`/po/${id}`, { status_aktif })

// ---------------- PRODUKSI ----------------
export interface SimpanInput {
  tanggal: string
  shift: 1 | 2
  id_pekerja: number
  id_sepatu: number
  id_po: number | null
  qtyPerUkuran: { id_ukuran: string; qty: number }[]
}

export interface ProduksiRow extends ProduksiHarian {
  nama_pekerja: string
  nama_model: string
  no_po: string | null
  detail: ProduksiDetail[]
}

const normDetail = (d: ProduksiDetail): ProduksiDetail => ({
  ...d,
  qty: toNum(d.qty),
  ongkos_kerja_saat_ini: toNum(d.ongkos_kerja_saat_ini),
})
const normProduksi = (r: ProduksiRow): ProduksiRow => ({
  ...r,
  detail: (r.detail ?? []).map(normDetail),
})

export const getProduksiHariIni = async () => (await get<ProduksiRow[]>('/produksi/hari-ini')).map(normProduksi)
export const getProduksi = async (tanggal?: string, idPekerja?: string) => {
  const params = new URLSearchParams()
  if (tanggal) params.set('tanggal', tanggal)
  if (idPekerja) params.set('pekerja', idPekerja)
  const qs = params.toString()
  return (await get<ProduksiRow[]>(`/produksi${qs ? `?${qs}` : ''}`)).map(normProduksi)
}
export const simpanProduksi = (
  input: SimpanInput,
) => post<{ id_produksi: number }>('/produksi', input)

export interface SimpanBatchItem {
  id_sepatu: number
  qtyPerUkuran: { id_ukuran: string; qty: number }[]
}
export interface SimpanBatchInput {
  tanggal: string
  shift: 1 | 2
  id_pekerja: number
  id_po: number | null
  items: SimpanBatchItem[]
}
export const simpanProduksiBatch = (input: SimpanBatchInput) =>
  post<{ jumlah: number; id_produksi_list: number[] }>('/produksi/batch', input)
export const replaceProduksiDetail = (
  id: number,
  qtyPerUkuran: { id_ukuran: string; qty: number }[],
) => put<{ ok: boolean }>(`/produksi/${id}/detail`, { qtyPerUkuran })
export const hapusProduksi = (id: number) => del<{ ok: boolean }>(`/produksi/${id}`)

// ---------------- PAYROLL ----------------
export const getDaftarPeriode = () => get<string[]>('/payroll/periods')
const normRekap = (r: RekapGajiRow): RekapGajiRow => ({
  ...r,
  total_pasang: toNum(r.total_pasang),
  total_gaji: toNum(r.total_gaji),
})
export const getRekapGaji = async (periode: string) =>
  (await get<RekapGajiRow[]>(`/payroll/rekap?${new URLSearchParams({ periode })}`)).map(normRekap)

// ---------------- DASHBOARD ----------------
export interface TotalPerProduksi {
  id_produksi: number
  tanggal: string
  shift: 1 | 2
  id_pekerja: number
  nama_pekerja: string
  nama_model: string
  total_pasang: number
  subtotal_gaji: number
}
const normTotal = (r: TotalPerProduksi): TotalPerProduksi => ({
  ...r,
  total_pasang: toNum(r.total_pasang),
  subtotal_gaji: toNum(r.subtotal_gaji),
})
export const getDashboardToday = async () => (await get<TotalPerProduksi[]>('/dashboard/today')).map(normTotal)