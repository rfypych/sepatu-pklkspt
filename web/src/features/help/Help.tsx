import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PillBadge } from '../../components/ui'
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Coins,
  FileSpreadsheet,
  HelpCircle,
  Layers,
  LogIn,
  Search,
  Smartphone,
  UserCheck,
} from 'lucide-react'

interface HelpTopic {
  id: string
  category: 'mandor' | 'admin' | 'konsep' | 'faq'
  icon: typeof LogIn
  title: string
  subtitle: string
  content: React.ReactNode
  defaultOpen?: boolean
}

function AccordionItem({
  topic,
  isOpen,
  onToggle,
}: {
  topic: HelpTopic
  isOpen: boolean
  onToggle: () => void
}) {
  const Icon = topic.icon
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-xs transition-all">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-slate-900">
              {topic.title}
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {topic.subtitle}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {topic.category === 'mandor' && <PillBadge color="emerald">Mandor</PillBadge>}
          {topic.category === 'admin' && <PillBadge color="blue">Admin</PillBadge>}
          {topic.category === 'konsep' && <PillBadge color="amber">Sistem</PillBadge>}
          {topic.category === 'faq' && <PillBadge color="neutral">FAQ</PillBadge>}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t-2 border-slate-100 bg-slate-50/60 p-4 sm:p-5 text-sm leading-relaxed text-slate-700">
          {topic.content}
        </div>
      )}
    </div>
  )
}

function Step({ nomor, judul, deskripsi }: { nomor: string; judul: string; deskripsi: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-black text-white shadow-xs">
        {nomor}
      </div>
      <div>
        <div className="font-bold text-slate-900 text-sm">{judul}</div>
        <div className="mt-0.5 text-xs text-slate-600 leading-relaxed">{deskripsi}</div>
      </div>
    </div>
  )
}

export default function Help() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<'semua' | 'mandor' | 'admin' | 'konsep' | 'faq'>('semua')
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['login', 'input_produksi']))

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const topics: HelpTopic[] = [
    {
      id: 'login',
      category: 'konsep',
      icon: LogIn,
      title: '1. Akses & Login Sistem',
      subtitle: 'Cara masuk ke akun mandor atau admin',
      content: (
        <div className="space-y-3">
          <Step
            nomor="1"
            judul="Buka Aplikasi atau Browser"
            deskripsi="Buka aplikasi Android APK Siprodu atau kunjungi alamat website resmi pabrik."
          />
          <Step
            nomor="2"
            judul="Otomatisasi Mandor"
            deskripsi="Pada aplikasi Android APK mandor, login dan sesi tersimpan otomatis di perangkat agar mandor dapat langsung menginput data tanpa login berulang."
          />
          <Step
            nomor="3"
            judul="Login Admin"
            deskripsi="Untuk membuka panel Admin, gunakan akun admin untuk mengakses Dashboard, Data Produksi, Rekap Gaji, dan Master Data."
          />
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
            ⚠️ Bila lupa password atau ingin mengganti akun, hubungi administrator sistem.
          </div>
        </div>
      ),
    },
    {
      id: 'input_produksi',
      category: 'mandor',
      icon: Smartphone,
      title: '2. Panduan Mandor: Input Hasil Produksi',
      subtitle: 'Alur pencatatan pasang sepatu harian di lapangan',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Melalui menu <b>INPUT PRODUKSI</b>, mandor mencatat hasil kerja per karyawan:
          </p>
          <div className="space-y-2.5">
            <Step nomor="1" judul="Pilih Nama Pekerja" deskripsi="Ketuk nama pekerja yang hari ini menyetorkan hasil pekerjaan." />
            <Step nomor="2" judul="Pilih Shift Kerja" deskripsi="Pilih Shift 1 (pagi) atau Shift 2 (siang/malam)." />
            <Step nomor="3" judul="Pilih PO (Opsional)" deskripsi="Bisa dipilih nomor PO yang dikerjakan, atau lewati jika pekerjaan reguler umum." />
            <Step nomor="4" judul="Tambah Model & Isi Ukuran" deskripsi="Tekan + Tambah Model, lalu masukkan jumlah pasang per ukuran. Biarkan 0 untuk ukuran yang kosong." />
            <Step nomor="5" judul="Simpan Data" deskripsi="Tekan tombol 'Simpan Hasil Produksi'. Data otomatis tersimpan dan lembar kerja pekerja tersebut akan terkunci agar tidak terinput ganda." />
          </div>
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
            ✅ Total pasang dan estimasi gaji dihitung otomatis secara instan oleh sistem.
          </div>
        </div>
      ),
    },
    {
      id: 'riwayat_mandor',
      category: 'mandor',
      icon: ClipboardList,
      title: '3. Panduan Mandor: Riwayat & Koreksi',
      subtitle: 'Melihat ringkasan dan mengedit data harian yang salah ketik',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Menu <b>RIWAYAT</b> digunakan untuk memantau data yang sudah diinput:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-700">
            <li><b>Edit Data:</b> Tekan tombol pensil pada baris data untuk memperbaiki jumlah pasang bila ada kesalahan input.</li>
            <li><b>Hapus Data:</b> Tekan tombol sampah bila ada data dobel/tidak sesuai.</li>
            <li><b>Ekspor Excel:</b> Mandor bisa langsung mengunduh rekap spreadsheet (.xlsx) harian/bulanan langsung ke folder Unduhan HP.</li>
          </ul>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
            ⚠️ Demi integritas data, mandor hanya dapat mengedit/menghapus data <b>hari ini</b>. Data tanggal sebelumnya dikunci dan hanya dapat disesuaikan oleh Admin.
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard_admin',
      category: 'admin',
      icon: Layers,
      title: '4. Panduan Admin: Dashboard Realtime',
      subtitle: 'Memantau produktivitas pabrik secara langsung',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Menu <b>Dashboard</b> menampilkan performa pabrik yang diperbarui otomatis setiap 5 detik:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-black text-slate-900 block">Total Pasang Hari Ini</span>
              Akumulasi jumlah pasang sepatu yang diselesaikan seluruh pekerja hari ini.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-black text-slate-900 block">Estimasi Gaji Hari Ini</span>
              Perkiraan kewajiban upah harian sesuai ongkos tarif model masing-masing.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'data_produksi_admin',
      category: 'admin',
      icon: FileSpreadsheet,
      title: '5. Panduan Admin: Manajemen Data Produksi',
      subtitle: 'Filter lengkap, audit input mandor, dan ekspor laporan Excel',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Menu <b>Data Produksi</b> adalah pusat kendali riwayat produksi pabrik:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-700">
            <li><b>Filter Tanggal & Karyawan:</b> Cek hasil produksi pekerja tertentu atau pada tanggal tertentu.</li>
            <li><b>Koreksi Penuh:</b> Admin memiliki wewenang mengoreksi maupun menghapus data produksi kapan saja.</li>
            <li><b>Ekspor Excel:</b> Laporan harian/rentang dapat diekspor menjadi file .xlsx berformat rapi.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'payroll_admin',
      category: 'admin',
      icon: Coins,
      title: '6. Panduan Admin: Rekap Upah (Payroll)',
      subtitle: 'Perhitungan upah kerja otomatis per periode cut-off',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Menu <b>Payroll</b> memproses perhitungan upah kerja tanpa rumus manual:
          </p>
          <div className="space-y-2 text-xs sm:text-sm text-slate-700">
            <p>• <b>Periode Cut-Off:</b> Otomatis terbagi menjadi periode 1–15 dan periode 16–akhir bulan.</p>
            <p>• <b>Rincian per Pekerja:</b> Menampilkan breakdown tiap model yang dikerjakan beserta nominal subtotal dan grand total.</p>
            <p>• <b>Unduh Excel:</b> Tekan tombol "Ekspor Excel" untuk mencetak slip atau mengolah data payroll di spreadsheet.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'master_data',
      category: 'admin',
      icon: UserCheck,
      title: '7. Panduan Admin: Master Data',
      subtitle: 'Pengaturan master pekerja, tarif upah model, ukuran, dan PO',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-bold text-slate-900 block">👷 Master Pekerja</span>
              Tambah nama karyawan baru atau nonaktifkan karyawan yang sudah tidak aktif.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-bold text-slate-900 block">👟 Model & Ongkos</span>
              Tambah model sepatu baru dan tentukan tarif ongkos upah per pasang (Rp).
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-bold text-slate-900 block">📏 Master Ukuran</span>
              Tambah ukuran baru atau klik untuk menonaktifkan ukuran yang tidak diproduksi.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-bold text-slate-900 block">📦 Master PO</span>
              Kelola nomor PO customer beserta target jumlah pasang yang dipesan.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'faq',
      category: 'faq',
      icon: HelpCircle,
      title: '8. Tanya Jawab (FAQ) & Solusi Cepat',
      subtitle: 'Pertanyaan yang paling sering ditanyakan',
      content: (
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="font-bold text-slate-900">Kenapa nama pekerja tidak muncul di pilihan mandor?</div>
            <p className="mt-1 text-slate-600">Pastikan pekerja berstatus <b>Aktif</b> di menu Master Data → tab Pekerja.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="font-bold text-slate-900">Jika ongkos kerja model diubah, apakah gaji periode lalu ikut berubah?</div>
            <p className="mt-1 text-slate-600">Tidak. Sistem menerapkan metode <i>snapshot</i> harga saat data diinput, sehingga upah periode lama tetap terkunci aman dan akurat.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="font-bold text-slate-900">Di mana file Excel hasil ekspor tersimpan pada HP Android?</div>
            <p className="mt-1 text-slate-600">File tersimpan langsung di folder <b>Unduhan (Downloads)</b> pada penyimpanan internal HP Anda.</p>
          </div>
        </div>
      ),
    },
  ]

  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      const matchCat = filterCat === 'semua' || t.category === filterCat
      const matchSearch =
        search.trim() === '' ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.subtitle.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [topics, filterCat, search])

  return (
    <div className="min-h-full bg-[#F5F5F5]">
      {/* Header — sama persis dengan Pengaturan */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200/80 bg-white/90 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold tracking-tight text-neutral-900">Pusat Bantuan</span>
        <div className="w-9" />
      </header>

      <div className="mx-auto max-w-xl p-4 md:p-6 space-y-4">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Pusat Bantuan</h1>
          <p className="text-xs text-neutral-500">
            Panduan operasional dan dokumentasi lengkap sistem produksi sepatu.
          </p>
        </div>

        {/* Search & Category Tabs */}
        <div className="space-y-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari topik bantuan (cth: input, gaji, excel, po)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 pl-10 text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
          </div>

          {/* Filter Badges */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'semua', label: 'Semua Topik' },
              { id: 'mandor', label: 'Panduan Mandor' },
              { id: 'admin', label: 'Panduan Admin' },
              { id: 'konsep', label: 'Sistem & PO' },
              { id: 'faq', label: 'FAQ' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCat(c.id as any)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                  filterCat === c.id
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topics List */}
        <div className="space-y-3">
          {filteredTopics.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-8 text-center shadow-xs">
              <BookOpen className="mx-auto mb-2 h-10 w-10 text-neutral-400" />
              <p className="text-sm font-bold text-neutral-700">Topik tidak ditemukan</p>
              <p className="text-xs text-neutral-500">Coba ketik kata kunci pencarian yang lain.</p>
            </div>
          ) : (
            filteredTopics.map((topic) => (
              <AccordionItem
                key={topic.id}
                topic={topic}
                isOpen={openIds.has(topic.id)}
                onToggle={() => toggleItem(topic.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
