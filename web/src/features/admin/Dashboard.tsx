import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getProduksi,
  getPekerjaAktif,
  getPoSemua,
  getCache,
  type ProduksiRow,
} from '../../lib/api'
import type { MasterPo, Pekerja } from '../../lib/types'
import { useAuth } from '../../context/AuthContext'
import {
  formatAngka,
  formatHariTanggal,
  formatRupiah,
  sapaanWaktu,
  tanggalHariIni,
  tanggalKemarin,
} from '../../lib/constants'
import {
  BigButton,
  Card,
  EmptyState,
  ErrorBox,
  HintBox,
  PageTitle,
  PillBadge,
  SkeletonCard,
  StatCard,
} from '../../components/ui'
import PoProgress from '../../components/PoProgress'
import {
  ArrowRight,
  ClipboardList,
  Coins,
  Home,
  Package,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'

/* ==========================================================================
   BERANDA ADMIN — layar PANTAUAN, bukan layar data.
   Tugasnya menjawab 4 pertanyaan dalam sekali lihat:
   1. Berapa hasil pabrik hari ini, naik atau turun dari kemarin?
   2. Siapa yang belum menyetor hasil kerja?
   3. Bagaimana progress PO yang sedang berjalan?
   4. Apa yang perlu saya buka selanjutnya?
   Tabel mentah + tombol Ubah/Hapus TIDAK ada di sini — semuanya di menu Produksi,
   supaya dua menu tidak terasa kembar.
   ========================================================================== */

function totalPasang(row: ProduksiRow) {
  return row.detail.reduce((a, d) => a + d.qty, 0)
}
function totalUpah(row: ProduksiRow) {
  return row.detail.reduce((a, d) => a + d.qty * d.ongkos_kerja_saat_ini, 0)
}

export default function Dashboard() {
  const { user } = useAuth()
  const hariIni = tanggalHariIni()
  const kemarin = tanggalKemarin()

  const [rows, setRows] = useState<ProduksiRow[]>(
    () => getCache<ProduksiRow[]>(`produksi_${hariIni}_all`) ?? [],
  )
  const [rowsKemarin, setRowsKemarin] = useState<ProduksiRow[]>(
    () => getCache<ProduksiRow[]>(`produksi_${kemarin}_all`) ?? [],
  )
  const [pekerjaAktif, setPekerjaAktif] = useState<Pekerja[]>(
    () => getCache<Pekerja[]>('pekerja_aktif') ?? [],
  )
  const [poList, setPoList] = useState<MasterPo[]>(() => getCache<MasterPo[]>('po_semua') ?? [])
  const [loading, setLoading] = useState(() => !getCache(`produksi_${hariIni}_all`))
  const [error, setError] = useState<string | null>(null)

  const muat = useCallback(async () => {
    try {
      const [prod, prodKemarin, pekerja, po] = await Promise.all([
        getProduksi(hariIni),
        getProduksi(kemarin),
        getPekerjaAktif(),
        getPoSemua(),
      ])
      setRows(prod)
      setRowsKemarin(prodKemarin)
      setPekerjaAktif(pekerja)
      setPoList(po)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [hariIni, kemarin])

  useEffect(() => {
    muat()
    const timer = setInterval(muat, 10000)
    const onFocus = () => muat()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [muat])

  // ---------------- Hitungan ringkasan ----------------
  const ringkas = useMemo(() => {
    const pasangHariIni = rows.reduce((a, r) => a + totalPasang(r), 0)
    const upahHariIni = rows.reduce((a, r) => a + totalUpah(r), 0)
    const pasangKemarin = rowsKemarin.reduce((a, r) => a + totalPasang(r), 0)

    let shift1 = 0
    let shift2 = 0
    for (const r of rows) {
      if (r.shift === 2) shift2 += totalPasang(r)
      else shift1 += totalPasang(r)
    }

    // Rekap per pekerja (papan hasil), diurutkan dari yang terbanyak.
    const perPekerja = new Map<number, { nama: string; pasang: number; upah: number }>()
    for (const r of rows) {
      const cur = perPekerja.get(r.id_pekerja) ?? { nama: r.nama_pekerja, pasang: 0, upah: 0 }
      cur.pasang += totalPasang(r)
      cur.upah += totalUpah(r)
      perPekerja.set(r.id_pekerja, cur)
    }
    const papan = [...perPekerja.values()].sort((a, b) => b.pasang - a.pasang)

    // Model paling banyak dikerjakan hari ini.
    const perModel = new Map<string, number>()
    for (const r of rows) {
      perModel.set(r.nama_model, (perModel.get(r.nama_model) ?? 0) + totalPasang(r))
    }
    const modelTeratas = [...perModel.entries()]
      .map(([nama, pasang]) => ({ nama, pasang }))
      .sort((a, b) => b.pasang - a.pasang)
      .slice(0, 3)

    const sudahSetor = new Set(rows.map((r) => r.id_pekerja))
    const belumSetor = pekerjaAktif.filter((p) => !sudahSetor.has(p.id_pekerja))

    return {
      pasangHariIni,
      upahHariIni,
      pasangKemarin,
      selisih: pasangHariIni - pasangKemarin,
      shift1,
      shift2,
      papan,
      modelTeratas,
      jumlahSudahSetor: sudahSetor.size,
      belumSetor,
    }
  }, [rows, rowsKemarin, pekerjaAktif])

  const poBerjalan = useMemo(
    () =>
      poList
        .filter((p) => Boolean(p.status_aktif))
        .sort((a, b) => {
          const sisaA = Math.max(0, a.target_qty - a.achieved_qty)
          const sisaB = Math.max(0, b.target_qty - b.achieved_qty)
          return sisaA - sisaB
        })
        .slice(0, 4),
    [poList],
  )

  const totalShift = ringkas.shift1 + ringkas.shift2
  const persenShift1 = totalShift > 0 ? Math.round((ringkas.shift1 / totalShift) * 100) : 0

  if (loading && rows.length === 0) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageTitle
        icon={<Home className="h-6 w-6" />}
        title={`${sapaanWaktu()}, ${user?.nama ?? 'Admin'}`}
        subtitle={`${formatHariTanggal(hariIni)}. Ini rangkuman pabrik hari ini.`}
        badge={
          <PillBadge color="emerald">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-600" />
            Otomatis diperbarui
          </PillBadge>
        }
      />

      {error && <ErrorBox message={error} onRetry={muat} />}

      {/* ---------------- 1. Angka besar hari ini ---------------- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          tone="blue"
          icon={<Package className="h-5 w-5" />}
          label="Sepatu Selesai Hari Ini"
          value={formatAngka(ringkas.pasangHariIni)}
          unit="pasang"
          hint={`Dari ${formatAngka(rows.length)} catatan kerja`}
        />
        <StatCard
          tone="emerald"
          icon={<Coins className="h-5 w-5" />}
          label="Perkiraan Upah Hari Ini"
          value={formatRupiah(ringkas.upahHariIni)}
          hint="Belum termasuk potongan atau bonus"
        />
      </div>

      {/* ---------------- 2. Naik / turun dibanding kemarin ---------------- */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-extrabold tracking-tight text-slate-900">
              Dibandingkan kemarin
            </div>
            <div className="mt-0.5 text-base font-semibold text-slate-600">
              Kemarin selesai {formatAngka(ringkas.pasangKemarin)} pasang
            </div>
          </div>
          {ringkas.selisih === 0 ? (
            <PillBadge color="neutral">Sama dengan kemarin</PillBadge>
          ) : ringkas.selisih > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-4 py-2 text-lg font-extrabold text-emerald-900">
              <TrendingUp className="h-6 w-6" />
              Naik {formatAngka(ringkas.selisih)} pasang
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-2xl border-2 border-amber-400 bg-amber-50 px-4 py-2 text-lg font-extrabold text-amber-900">
              <TrendingDown className="h-6 w-6" />
              Turun {formatAngka(Math.abs(ringkas.selisih))} pasang
            </span>
          )}
        </div>
      </Card>

      {/* ---------------- 3. Siapa yang belum setor ---------------- */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Users className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              Setoran Hasil Kerja Hari Ini
            </h2>
            <p className="mt-0.5 text-base font-semibold text-slate-600">
              {formatAngka(ringkas.jumlahSudahSetor)} dari {formatAngka(pekerjaAktif.length)} pekerja
              aktif sudah punya catatan.
            </p>
          </div>
        </div>

        {pekerjaAktif.length === 0 ? (
          <div className="mt-3">
            <HintBox>
              Belum ada pekerja aktif. Tambahkan pekerja dulu di menu <b>Master</b>.
            </HintBox>
          </div>
        ) : ringkas.belumSetor.length === 0 ? (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-3.5 text-emerald-950">
            <UserCheck className="h-6 w-6 shrink-0" />
            <span className="text-base font-bold leading-snug">
              Semua pekerja aktif sudah menyetor hasil kerja hari ini.
            </span>
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center gap-2 text-base font-extrabold text-amber-900">
              <UserX className="h-5 w-5" />
              Belum ada catatan hari ini ({ringkas.belumSetor.length} pekerja)
            </div>
            <div className="flex flex-wrap gap-2">
              {ringkas.belumSetor.map((p) => (
                <span
                  key={p.id_pekerja}
                  className="rounded-2xl border-2 border-amber-400 bg-amber-50 px-3.5 py-2 text-base font-bold text-amber-950"
                >
                  {p.nama}
                </span>
              ))}
            </div>
            <HintBox>
              Kalau nama di atas seharusnya sudah bekerja, minta mandor mengisi hasil kerjanya di
              menu <b>Isi Data</b>.
            </HintBox>
          </div>
        )}
      </Card>

      {/* ---------------- 4. Perbandingan shift ---------------- */}
      {totalShift > 0 && (
        <Card>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            Hasil per Shift Hari Ini
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3.5">
              <div className="text-base font-extrabold text-amber-950">☀️ Shift 1 (Pagi)</div>
              <div className="mt-1 text-3xl font-extrabold leading-none text-amber-950">
                {formatAngka(ringkas.shift1)}
                <span className="ml-1 text-base font-bold opacity-70">pasang</span>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-3.5">
              <div className="text-base font-extrabold text-indigo-950">🌙 Shift 2 (Siang/Malam)</div>
              <div className="mt-1 text-3xl font-extrabold leading-none text-indigo-950">
                {formatAngka(ringkas.shift2)}
                <span className="ml-1 text-base font-bold opacity-70">pasang</span>
              </div>
            </div>
          </div>
          <div
            className="mt-3 flex h-5 w-full overflow-hidden rounded-full border-2 border-slate-300 bg-indigo-500"
            role="img"
            aria-label={`Shift 1 ${persenShift1} persen, Shift 2 ${100 - persenShift1} persen`}
          >
            <div className="h-full bg-amber-500" style={{ width: `${persenShift1}%` }} />
          </div>
          <div className="mt-1.5 text-sm font-bold text-slate-600">
            Shift 1 {persenShift1}% · Shift 2 {100 - persenShift1}% dari hasil hari ini
          </div>
        </Card>
      )}

      {/* ---------------- 5. Papan hasil per pekerja ---------------- */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Trophy className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              Hasil per Pekerja Hari Ini
            </h2>
            <p className="mt-0.5 text-base font-semibold text-slate-600">
              Urut dari yang paling banyak. Ini rangkuman, bukan daftar catatan.
            </p>
          </div>
        </div>

        {ringkas.papan.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="Belum ada hasil kerja hari ini"
              description="Setelah mandor mengisi hasil kerja, angkanya langsung muncul di sini."
            />
          </div>
        ) : (
          <ol className="mt-3 space-y-2.5">
            {ringkas.papan.map((p, i) => (
              <li
                key={p.nama + i}
                className="flex items-center gap-3 rounded-2xl border-2 border-slate-300 bg-white p-3.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-800 bg-slate-900 text-base font-extrabold text-white">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-lg font-extrabold text-slate-900">
                  {p.nama}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-extrabold text-slate-900">
                    {formatAngka(p.pasang)} psg
                  </span>
                  <span className="block text-base font-bold text-emerald-800">
                    {formatRupiah(p.upah)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}

        {ringkas.modelTeratas.length > 0 && (
          <div className="mt-3 border-t-2 border-slate-100 pt-3">
            <div className="text-base font-extrabold text-slate-900">Model terbanyak hari ini</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {ringkas.modelTeratas.map((m) => (
                <PillBadge key={m.nama} color="blue">
                  {m.nama} · {formatAngka(m.pasang)} psg
                </PillBadge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ---------------- 6. Progress PO berjalan ---------------- */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Target className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              Progress PO Berjalan
            </h2>
            <p className="mt-0.5 text-base font-semibold text-slate-600">
              Yang paling dekat selesai ditaruh paling atas.
            </p>
          </div>
        </div>

        {poBerjalan.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={<Target className="h-8 w-8" />}
              title="Belum ada PO aktif"
              description="Tambahkan nomor PO beserta targetnya di menu Master supaya progressnya bisa dipantau di sini."
              action={
                <Link to="/admin/master">
                  <BigButton variant="secondary">
                    Buka Menu Master
                    <ArrowRight className="h-5 w-5" />
                  </BigButton>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {poBerjalan.map((p) => (
              <div key={p.id_po} className="rounded-2xl border-2 border-slate-300 bg-white p-3.5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <PillBadge color="blue">{p.no_po}</PillBadge>
                  {p.nama_customer && (
                    <span className="truncate text-base font-bold text-slate-700">
                      {p.nama_customer}
                    </span>
                  )}
                </div>
                <PoProgress target={p.target_qty} achieved={p.achieved_qty} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ---------------- 7. Mau buka apa selanjutnya ---------------- */}
      <Card>
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
          Mau Buka Apa Selanjutnya?
        </h2>
        <p className="mt-0.5 text-base font-semibold text-slate-600">
          Untuk mengubah atau menghapus catatan, buka menu Data Produksi.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <Link to="/admin/produksi" className="block">
            <BigButton variant="dark" size="lg" className="w-full">
              <ClipboardList className="h-5 w-5" />
              Data Produksi
            </BigButton>
          </Link>
          <Link to="/admin/payroll" className="block">
            <BigButton variant="primary" size="lg" className="w-full">
              <Coins className="h-5 w-5" />
              Rekap Gaji
            </BigButton>
          </Link>
          <Link to="/admin/master" className="block">
            <BigButton variant="ghost" size="lg" className="w-full">
              <Users className="h-5 w-5" />
              Master Data
            </BigButton>
          </Link>
        </div>
      </Card>
    </div>
  )
}
