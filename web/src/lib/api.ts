import { API_URL, getToken } from './config'
import { getCache, setCache, invalidateCache, clearAllCache } from './cache'
export { getCache, setCache, invalidateCache, clearAllCache }
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
export function apiSwitchRole(role: 'admin' | 'mandor') {
  return post<LoginResult>('/auth/switch', { role })
}



// ---------------- PEKERJA ----------------
export const getPekerjaAktif = async () => {
  const data = await get<Pekerja[]>('/pekerja?aktif=true')
  setCache('pekerja_aktif', data)
  return data
}
export const getPekerjaSemua = async () => {
  const data = await get<Pekerja[]>('/pekerja')
  setCache('pekerja_semua', data)
  return data
}
export const tambahPekerja = async (nama: string) => {
  const res = await post<Pekerja>('/pekerja', { nama })
  invalidateCache('pekerja', 'mandor_init', 'dashboard')
  return res
}
export const ubahPekerja = async (id: number, body: { nama?: string; status_aktif?: boolean }) => {
  const res = await patch<{ ok: boolean }>(`/pekerja/${id}`, body)
  invalidateCache('pekerja', 'mandor_init', 'dashboard')
  return res
}
export const hapusPekerja = async (id: number) => {
  const res = await del<{ ok: boolean }>(`/pekerja/${id}`)
  invalidateCache('pekerja', 'mandor_init', 'dashboard')
  return res
}

// ---------------- TIPE SEPATU ----------------
const normTipe = (m: TipeSepatu): TipeSepatu => ({ ...m, ongkos_kerja: toNum(m.ongkos_kerja) })
export const getTipeSepatuAktif = async () => {
  const data = (await get<TipeSepatu[]>('/tipe-sepatu?aktif=true')).map(normTipe)
  setCache('tipe_sepatu_aktif', data)
  return data
}
export const getTipeSepatuSemua = async () => {
  const data = (await get<TipeSepatu[]>('/tipe-sepatu')).map(normTipe)
  setCache('tipe_sepatu_semua', data)
  return data
}
export const tambahModel = async (nama_model: string, ongkos_kerja: number) => {
  const res = await post<TipeSepatu>('/tipe-sepatu', { nama_model, ongkos_kerja })
  invalidateCache('tipe_sepatu', 'mandor_init', 'dashboard')
  return res
}
export const ubahTipeSepatu = async (id: number, body: { nama_model?: string; ongkos_kerja?: number; status_aktif?: boolean }) => {
  const res = await patch<{ ok: boolean }>(`/tipe-sepatu/${id}`, body)
  invalidateCache('tipe_sepatu', 'mandor_init', 'dashboard')
  return res
}
export const hapusModel = async (id: number) => {
  const res = await del<{ ok: boolean }>(`/tipe-sepatu/${id}`)
  invalidateCache('tipe_sepatu', 'mandor_init', 'dashboard')
  return res
}

// ---------------- UKURAN ----------------
export const getUkuranAktif = async () => {
  const data = await get<MasterUkuran[]>('/ukuran?aktif=true')
  setCache('ukuran_aktif', data)
  return data
}
export const getUkuranSemua = async () => {
  const data = await get<MasterUkuran[]>('/ukuran')
  setCache('ukuran_semua', data)
  return data
}
export const tambahUkuran = async (label_ukuran: string) => {
  const res = await post<MasterUkuran>('/ukuran', { label_ukuran })
  invalidateCache('ukuran', 'mandor_init')
  return res
}
export const ubahUkuran = async (id: number, status_aktif: boolean) => {
  const res = await patch<{ ok: boolean }>(`/ukuran/${id}`, { status_aktif })
  invalidateCache('ukuran', 'mandor_init')
  return res
}
export const hapusUkuran = async (id: number) => {
  const res = await del<{ ok: boolean }>(`/ukuran/${id}`)
  invalidateCache('ukuran', 'mandor_init')
  return res
}

// ---------------- PO ----------------
const normPo = (p: MasterPo): MasterPo => ({
  ...p,
  target_qty: toNum(p.target_qty),
  achieved_qty: toNum(p.achieved_qty),
})
export const getPoAktif = async () => {
  const data = (await get<MasterPo[]>('/po?aktif=true')).map(normPo)
  setCache('po_aktif', data)
  return data
}
export const getPoSemua = async () => {
  const data = (await get<MasterPo[]>('/po')).map(normPo)
  setCache('po_semua', data)
  return data
}
export const tambahPo = async (no_po: string, nama_customer: string, target_qty: number) => {
  const res = await post<MasterPo>('/po', { no_po, nama_customer, target_qty })
  invalidateCache('po', 'mandor_init', 'dashboard')
  return res
}
export const ubahPo = async (id: number, body: { no_po?: string; nama_customer?: string; target_qty?: number; status_aktif?: boolean }) => {
  const res = await patch<{ ok: boolean }>(`/po/${id}`, body)
  invalidateCache('po', 'mandor_init', 'dashboard')
  return res
}
export const hapusPo = async (id: number) => {
  const res = await del<{ ok: boolean }>(`/po/${id}`)
  invalidateCache('po', 'mandor_init', 'dashboard')
  return res
}

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

export interface MandorInitData {
  pekerja: Pekerja[]
  model: TipeSepatu[]
  ukuran: MasterUkuran[]
  po: MasterPo[]
  todayProduksi: ProduksiRow[]
}

export const getMandorInit = async (): Promise<MandorInitData> => {
  const data = await get<MandorInitData>('/produksi/mandor-init')
  const res: MandorInitData = {
    ...data,
    todayProduksi: (data.todayProduksi ?? []).map(normProduksi),
  }
  setCache('mandor_init', res)
  return res
}

export const getProduksiHariIni = async () => {
  const data = (await get<ProduksiRow[]>('/produksi/hari-ini')).map(normProduksi)
  setCache('produksi_hari_ini', data)
  return data
}
export const getProduksi = async (tanggal?: string, idPekerja?: string) => {
  const params = new URLSearchParams()
  if (tanggal) params.set('tanggal', tanggal)
  if (idPekerja) params.set('pekerja', idPekerja)
  const qs = params.toString()
  const data = (await get<ProduksiRow[]>(`/produksi${qs ? `?${qs}` : ''}`)).map(normProduksi)
  setCache(`produksi_${tanggal || 'all'}_${idPekerja || 'all'}`, data)
  return data
}
export const getProduksiRentang = async (dari: string, sampai: string, idPekerja?: string) => {
  const params = new URLSearchParams({ dari, sampai })
  if (idPekerja) params.set('pekerja', idPekerja)
  const qs = params.toString()
  const data = (await get<ProduksiRow[]>(`/produksi?${qs}`)).map(normProduksi)
  setCache(`produksi_rentang_${dari}_${sampai}_${idPekerja || 'all'}`, data)
  return data
}
export const simpanProduksi = async (input: SimpanInput) => {
  const res = await post<{ id_produksi: number }>('/produksi', input)
  invalidateCache('produksi', 'mandor_init', 'dashboard', 'payroll', 'po')
  return res
}

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
export const simpanProduksiBatch = async (input: SimpanBatchInput) => {
  const res = await post<{ jumlah: number; id_produksi_list: number[] }>('/produksi/batch', input)
  invalidateCache('produksi', 'mandor_init', 'dashboard', 'payroll', 'po')
  return res
}
export const replaceProduksiDetail = async (
  id: number,
  qtyPerUkuran: { id_ukuran: string; qty: number }[],
) => {
  const res = await put<{ ok: boolean }>(`/produksi/${id}/detail`, { qtyPerUkuran })
  invalidateCache('produksi', 'mandor_init', 'dashboard', 'payroll', 'po')
  return res
}
export const hapusProduksi = async (id: number) => {
  const res = await del<{ ok: boolean }>(`/produksi/${id}`)
  invalidateCache('produksi', 'mandor_init', 'dashboard', 'payroll', 'po')
  return res
}
export const resetDatabase = async (mode: 'produksi_only' | 'factory_reset' = 'produksi_only') => {
  const res = await post<{ ok: boolean; mode: string; message: string }>('/reset-database', { mode })
  clearAllCache()
  return res
}

// ---------------- PAYROLL ----------------
export const getDaftarPeriode = () => get<string[]>('/payroll/periods')
const normRekap = (r: RekapGajiRow): RekapGajiRow => ({
  ...r,
  total_pasang: toNum(r.total_pasang),
  total_gaji: toNum(r.total_gaji),
})
export const getRekapGaji = async (periode: string) => {
  const data = (await get<RekapGajiRow[]>(`/payroll/rekap?${new URLSearchParams({ periode })}`)).map(normRekap)
  setCache(`payroll_${periode}`, data)
  return data
}

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
export const getDashboardToday = async () => {
  const data = (await get<TotalPerProduksi[]>('/dashboard/today')).map(normTotal)
  setCache('dashboard_today', data)
  return data
}

// ---------------- BACKGROUND PREFETCH (0ms Sat Set Navigation) ----------------
export function prefetchCoreData(role?: string) {
  if (typeof window === 'undefined') return
  setTimeout(() => {
    if (role === 'admin') {
      // Beranda admin butuh produksi hari ini + kemarin (pembanding) dan pekerja aktif
      // (untuk daftar "belum setor"), jadi keduanya ikut diprefetch.
      const d = new Date()
      const iso = (x: Date) =>
        `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
      const kemarin = new Date(d)
      kemarin.setDate(kemarin.getDate() - 1)
      getProduksi(iso(d)).catch(() => {})
      getProduksi(iso(kemarin)).catch(() => {})
      getPekerjaAktif().catch(() => {})
      getDashboardToday().catch(() => {})
      getPekerjaSemua().catch(() => {})
      getTipeSepatuSemua().catch(() => {})
      getUkuranSemua().catch(() => {})
      getPoSemua().catch(() => {})
    } else {
      getMandorInit().catch(() => {})
      getPekerjaAktif().catch(() => {})
      getTipeSepatuAktif().catch(() => {})
      getUkuranAktif().catch(() => {})
      getPoSemua().catch(() => {})
      getProduksiHariIni().catch(() => {})
    }
  }, 50)
}