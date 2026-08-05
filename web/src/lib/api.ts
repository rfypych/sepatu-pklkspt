import { supabase } from './supabase'
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

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as UserProfile
}

export async function getPekerjaAktif(): Promise<Pekerja[]> {
  const { data, error } = await supabase
    .from('pekerja')
    .select('*')
    .eq('status_aktif', true)
    .order('nama')
  if (error) throw error
  return (data ?? []) as Pekerja[]
}

export async function getPekerjaSemua(): Promise<Pekerja[]> {
  const { data, error } = await supabase
    .from('pekerja')
    .select('*')
    .order('nama')
  if (error) throw error
  return (data ?? []) as Pekerja[]
}

export async function getTipeSepatuAktif(): Promise<TipeSepatu[]> {
  const { data, error } = await supabase
    .from('tipe_sepatu')
    .select('*')
    .eq('status_aktif', true)
    .order('nama_model')
  if (error) throw error
  return (data ?? []) as TipeSepatu[]
}

export async function getTipeSepatuSemua(): Promise<TipeSepatu[]> {
  const { data, error } = await supabase
    .from('tipe_sepatu')
    .select('*')
    .order('nama_model')
  if (error) throw error
  return (data ?? []) as TipeSepatu[]
}

export async function getUkuranAktif(): Promise<MasterUkuran[]> {
  const { data, error } = await supabase
    .from('master_ukuran')
    .select('*')
    .eq('status_aktif', true)
    .order('urutan')
  if (error) throw error
  return (data ?? []) as MasterUkuran[]
}

export async function getUkuranSemua(): Promise<MasterUkuran[]> {
  const { data, error } = await supabase
    .from('master_ukuran')
    .select('*')
    .order('urutan')
  if (error) throw error
  return (data ?? []) as MasterUkuran[]
}

export async function getPoAktif(): Promise<MasterPo[]> {
  const { data, error } = await supabase
    .from('master_po')
    .select('*')
    .eq('status_aktif', true)
    .order('no_po')
  if (error) throw error
  return (data ?? []) as MasterPo[]
}

export async function getPoSemua(): Promise<MasterPo[]> {
  const { data, error } = await supabase
    .from('master_po')
    .select('*')
    .order('no_po')
  if (error) throw error
  return (data ?? []) as MasterPo[]
}

async function getDetail(idProduksi: string): Promise<ProduksiDetail[]> {
  const { data, error } = await supabase
    .from('produksi_detail')
    .select('*')
    .eq('id_produksi', idProduksi)
    .order('id_ukuran')
  if (error) throw error
  return (data ?? []) as ProduksiDetail[]
}

export async function getProduksiHariIni(): Promise<ProduksiHarian[]> {
  const { data, error } = await supabase
    .from('produksi_harian')
    .select('*')
    .eq('tanggal', new Date().toISOString().slice(0, 10))
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ProduksiHarian[]
}

export async function getProduksiDenganDetail(
  tanggal?: string,
  idPekerja?: string,
): Promise<{ produksi: ProduksiHarian; detail: ProduksiDetail[] }[]> {
  let q = supabase
    .from('produksi_harian')
    .select('*')
    .order('tanggal', { ascending: false })
    .order('shift')

  if (tanggal) q = q.eq('tanggal', tanggal)
  if (idPekerja) q = q.eq('id_pekerja', idPekerja)

  const { data, error } = await q
  if (error) throw error
  const rows = (data ?? []) as ProduksiHarian[]
  const result: { produksi: ProduksiHarian; detail: ProduksiDetail[] }[] = []
  for (const r of rows) {
    result.push({ produksi: r, detail: await getDetail(r.id_produksi) })
  }
  return result
}

export interface SimpanInput {
  tanggal: string
  shift: 1 | 2
  id_pekerja: string
  id_sepatu: string
  id_po: string | null
  qtyPerUkuran: { id_ukuran: string; qty: number }[]
}

export async function simpanProduksi(input: SimpanInput, createdBy: string | null): Promise<string> {
  const { data, error } = await supabase
    .from('produksi_harian')
    .insert({
      tanggal: input.tanggal,
      shift: input.shift,
      id_pekerja: input.id_pekerja,
      id_sepatu: input.id_sepatu,
      id_po: input.id_po,
      created_by: createdBy,
    })
    .select('id_produksi')
    .single()
  if (error) throw error

  const idProduksi = data.id_produksi as string

  // Snapshot ongkos dari master sepatu
  const { data: sepatu } = await supabase
    .from('tipe_sepatu')
    .select('ongkos_kerja')
    .eq('id_sepatu', input.id_sepatu)
    .single()
  const ongkos = (sepatu?.ongkos_kerja as number) ?? 0

  const detail = input.qtyPerUkuran
    .filter((d) => d.qty > 0)
    .map((d) => ({
      id_produksi: idProduksi,
      id_ukuran: d.id_ukuran,
      qty: d.qty,
      ongkos_kerja_saat_ini: ongkos,
    }))

  if (detail.length > 0) {
    const { error: err2 } = await supabase.from('produksi_detail').insert(detail)
    if (err2) throw err2
  }

  return idProduksi
}

export async function hapusProduksi(idProduksi: string): Promise<void> {
  const { error } = await supabase.from('produksi_harian').delete().eq('id_produksi', idProduksi)
  if (error) throw error
}

export async function replaceProduksiDetail(
  idProduksi: string,
  qtyPerUkuran: { id_ukuran: string; qty: number }[],
): Promise<void> {
  const { data: lama } = await supabase
    .from('produksi_detail')
    .select('ongkos_kerja_saat_ini')
    .eq('id_produksi', idProduksi)
    .limit(1)
  const ongkos = (lama?.[0]?.ongkos_kerja_saat_ini as number) ?? 0

  const { error: delErr } = await supabase
    .from('produksi_detail')
    .delete()
    .eq('id_produksi', idProduksi)
  if (delErr) throw delErr

  const detail = qtyPerUkuran
    .filter((d) => d.qty > 0)
    .map((d) => ({
      id_produksi: idProduksi,
      id_ukuran: d.id_ukuran,
      qty: d.qty,
      ongkos_kerja_saat_ini: ongkos,
    }))

  if (detail.length > 0) {
    const { error } = await supabase.from('produksi_detail').insert(detail)
    if (error) throw error
  }
}

export async function getRekapGaji(periode: string): Promise<RekapGajiRow[]> {
  const { data, error } = await supabase
    .from('v_rekap_gaji')
    .select('*')
    .eq('periode', periode)
  if (error) throw error
  return (data ?? []) as RekapGajiRow[]
}

export async function getDaftarPeriode(): Promise<string[]> {
  const { data, error } = await supabase
    .from('v_rekap_gaji')
    .select('periode')
    .order('periode', { ascending: false })
  if (error) throw error
  const unik = Array.from(new Set((data ?? []).map((r) => (r as { periode: string }).periode)))
  return unik
}
