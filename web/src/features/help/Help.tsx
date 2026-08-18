import { useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Coins,
  Database,
  Edit3,
  FileSpreadsheet,
  HardHat,
  HelpCircle,
  Layers,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCheck,
} from 'lucide-react'

interface HelpTopic {
  id: string
  icon: typeof Smartphone
  title: string
  subtitle: string
  content: React.ReactNode
  defaultOpen?: boolean
}

function AccordionItem({
  topic,
  isOpen,
  onToggle,
  color = 'emerald',
}: {
  topic: HelpTopic
  isOpen: boolean
  onToggle: () => void
  color?: 'emerald' | 'blue'
}) {
  const Icon = topic.icon
  const isBlue = color === 'blue'

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-xs transition-all">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold border ${
              isBlue
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
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
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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

function Step({
  nomor,
  judul,
  deskripsi,
  color = 'emerald',
}: {
  nomor: string
  judul: string
  deskripsi: string
  color?: 'emerald' | 'blue'
}) {
  const isBlue = color === 'blue'
  return (
    <div className="flex gap-3">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-xs ${
          isBlue ? 'bg-blue-700' : 'bg-emerald-700'
        }`}
      >
        {nomor}
      </div>
      <div>
        <div className="font-bold text-slate-900 text-sm">{judul}</div>
        <div className="mt-0.5 text-xs text-slate-600 leading-relaxed">{deskripsi}</div>
      </div>
    </div>
  )
}

export default function Help({ role: forcedRole }: { role?: 'mandor' | 'admin' }) {
  const location = useLocation()
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  // Tentukan apakah menampilkan panduan Mandor atau Admin
  const isMandor =
    forcedRole === 'mandor' ||
    location.pathname.includes('/mandor') ||
    (!forcedRole && user?.role === 'mandor')

  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(isMandor ? ['input_produksi', 'edit_data'] : ['dashboard_admin', 'payroll_admin'])
  )

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ---------------- PANDUAN KHUSUS MANDOR ----------------
  const mandorTopics: HelpTopic[] = [
    {
      id: 'input_produksi',
      icon: Smartphone,
      title: '1. Cara Mengisi & Menyimpan Hasil Kerja',
      subtitle: 'Alur pencatatan pasang sepatu harian per tukang sepatu',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Di menu <b>Input Produksi</b>, ikuti langkah berikut:
          </p>
          <div className="space-y-2.5">
            <Step nomor="1" judul="Pilih Nama Pekerja" deskripsi="Ketuk nama pekerja dari daftar yang tersedia." />
            <Step nomor="2" judul="Pilih Shift Kerja" deskripsi="Pilih Shift 1 (Pagi) atau Shift 2 (Siang/Malam)." />
            <Step nomor="3" judul="Pilih Nomor PO (Pesanan)" deskripsi="Bisa dipilih nomor PO yang dikerjakan, atau lewati jika pekerjaan reguler umum." />
            <Step nomor="4" judul="Tambah Model & Isi Ukuran" deskripsi="Pilih model sepatu, lalu masukkan jumlah pasang di nomor ukuran yang dikerjakan (nomor 36 s/d 44)." />
            <Step nomor="5" judul="Tekan Simpan" deskripsi="Tekan tombol 'Simpan Hasil Produksi'. Data otomatis tersimpan dan lembar kerja pekerja tersebut terkunci." />
          </div>
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
            ✅ Total pasang sepatu dan perkiraan upah langsung dihitung otomatis oleh aplikasi.
          </div>
        </div>
      ),
    },
    {
      id: 'edit_data',
      icon: Edit3,
      title: '2. Cara Memperbaiki / Edit Data yang Salah Ketik',
      subtitle: 'Mengubah jumlah pasang ukuran yang sudah disimpan',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Jika ada kesalahan jumlah ukuran pada data yang sudah disimpan hari ini:
          </p>
          <div className="space-y-2.5">
            <Step nomor="1" judul="Buka Lembar Kerja Pekerja" deskripsi="Pilih nama pekerja yang datanya ingin diperbaiki." />
            <Step nomor="2" judul="Tekan Tombol Edit (Ikon Pensil)" deskripsi="Pada kartu sepatu yang tersimpan di bawah, tekan tombol ikon pensil biru." />
            <Step nomor="3" judul="Sesuaikan Jumlah Ukuran" deskripsi="Ubah angka pasang pada ukuran yang keliru menggunakan tombol + / - atau ketik angkanya." />
            <Step nomor="4" judul="Simpan Perubahan" deskripsi="Tekan tombol 'Simpan Perubahan'. Total pasang dan upah akan langsung ter-update otomatis." />
          </div>
        </div>
      ),
    },
    {
      id: 'hapus_data',
      icon: Trash2,
      title: '3. Cara Menghapus Catatan Kerja yang Keliru / Batal',
      subtitle: 'Membatalkan item yang tidak sengaja terinput',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Untuk menghapus catatan kerja sepatu:
          </p>
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-slate-700">
              1. Buka kartu pekerja atau masuk ke menu <b>Riwayat Kerja</b>.<br />
              2. Tekan tombol <b>Ikon Sampah (Hapus)</b> pada baris data yang ingin dibuang.<br />
              3. Pada jendela konfirmasi, tekan <b>"Ya, Hapus Data Ini"</b>.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
            ⚠️ Mandor hanya dapat menghapus atau mengedit data <b>hari ini</b> sebelum tutup buku.
          </div>
        </div>
      ),
    },
    {
      id: 'riwayat_mandor',
      icon: ClipboardList,
      title: '4. Memantau Riwayat Kerja & Ekspor Excel',
      subtitle: 'Melihat rekap total harian dan download file laporan ke HP',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Menu <b>Riwayat Kerja</b> digunakan untuk memantau semua hasil kerja:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-700">
            <li><b>Total Pasang Harian:</b> Memantau akumulasi hasil kerja seluruh tukang sepatu pada hari ini.</li>
            <li><b>Filter Shift:</b> Memisahkan pantauan hasil kerja Shift 1 dan Shift 2.</li>
            <li><b>Tombol Ekspor Excel:</b> Mengunduh file spreadsheet (.xlsx) laporan produksi langsung ke folder <b>Unduhan (Download)</b> di HP Anda.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'faq_mandor',
      icon: HelpCircle,
      title: '5. Tanya Jawab (FAQ) Mandor',
      subtitle: 'Solusi untuk kendala umum di lapangan',
      content: (
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="font-bold text-slate-900">Nama pekerja tidak muncul di pilihan?</div>
            <p className="mt-1 text-slate-600">Pastikan admin sudah mendaftarkan nama pekerja dan mengaktifkan statusnya di Master Data.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="font-bold text-slate-900">Apakah harus login ulang setiap kali buka aplikasi HP?</div>
            <p className="mt-1 text-slate-600">Tidak. Aplikasi mandor sudah otomatis menyimpan sesi sehingga bisa langsung dipakai mencatat.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="font-bold text-slate-900">Di mana file Excel yang diunduh tersimpan?</div>
            <p className="mt-1 text-slate-600">File tersimpan langsung di folder <b>Unduhan / Downloads</b> pada memori HP.</p>
          </div>
        </div>
      ),
    },
  ]

  // ---------------- PANDUAN KHUSUS ADMIN ----------------
  const adminTopics: HelpTopic[] = [
    {
      id: 'dashboard_admin',
      icon: Layers,
      title: '1. Dashboard Produksi Realtime',
      subtitle: 'Memantau produktivitas dan pengeluaran upah pabrik',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Menu <b>Dashboard</b> menampilkan performa pabrik yang diperbarui secara realtime:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-black text-slate-900 block">Total Pasang Hari Ini</span>
              Akumulasi jumlah pasang sepatu yang diselesaikan seluruh pekerja pada hari ini.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-black text-slate-900 block">Estimasi Upah Hari Ini</span>
              Total kewajiban gaji harian yang harus dibayarkan sesuai tarif ongkos model sepatu.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-black text-slate-900 block">Breakdown Shift 1 & 2</span>
              Perbandingan hasil pasang antara Shift 1 (Pagi) dan Shift 2 (Siang/Malam).
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-black text-slate-900 block">Model Terbanyak Dikerjakan</span>
              Informasi model sepatu yang sedang paling banyak diproduksi hari ini.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'data_produksi_admin',
      icon: FileSpreadsheet,
      title: '2. Pusat Data Produksi & Audit Koreksi',
      subtitle: 'Melihat seluruh riwayat produksi semua tanggal dan ekspor Excel',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Menu <b>Data Produksi</b> adalah pusat arsip hasil kerja seluruh pabrik:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-700">
            <li><b>Filter Tanggal & Pekerja:</b> Memeriksa hasil kerja karyawan tertentu pada tanggal atau rentang tanggal tertentu.</li>
            <li><b>Koreksi Penuh:</b> Admin memiliki wewenang mengoreksi maupun menghapus data produksi kapan saja (termasuk tanggal lampau).</li>
            <li><b>Ekspor Excel:</b> Mengunduh laporan data produksi berformat spreadsheet (.xlsx) rapi untuk arsip pembukuan.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'payroll_admin',
      icon: Coins,
      title: '3. Hitung & Rekap Gaji (Payroll)',
      subtitle: 'Perhitungan upah otomatis per periode cut-off (1-15 & 16-akhir bulan)',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Menu <b>Rekap Gaji</b> menghitung kewajiban upah kerja secara otomatis:
          </p>
          <div className="space-y-2 text-xs sm:text-sm text-slate-700">
            <p>• <b>Periode Cut-Off:</b> Otomatis terbagi menjadi periode 1–15 dan periode 16–akhir bulan.</p>
            <p>• <b>Rincian per Pekerja:</b> Menampilkan breakdown tiap model yang dikerjakan beserta total pasang dan total upah rupiah.</p>
            <p>• <b>Unduh Excel / Slip Gaji:</b> Tekan tombol "Ekspor Excel" untuk mencetak slip atau mengolah data gaji di Excel.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'master_data',
      icon: UserCheck,
      title: '4. Kelola Master Data Pabrik',
      subtitle: 'Pengaturan pekerja, tarif upah model, ukuran sepatu, dan nomor PO',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-bold text-slate-900 block">👷 Master Pekerja</span>
              Tambah nama karyawan baru atau nonaktifkan karyawan yang sudah berhenti.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-bold text-slate-900 block">👟 Model & Tarif Upah</span>
              Tambah model sepatu baru dan tentukan nominal ongkos kerja per pasang (Rp).
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-bold text-slate-900 block">📏 Master Ukuran</span>
              Kelola nomor ukuran sepatu aktif (misal No 36 s/d 44).
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <span className="font-bold text-slate-900 block">📦 Master PO Pesanan</span>
              Kelola nomor pesanan customer beserta target pasang yang harus dipenuhi.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'reset_db',
      icon: Database,
      title: '5. Pembersihan & Reset Database',
      subtitle: 'Mengosongkan riwayat kerja untuk buku baru atau reset total',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Di menu <b>Pengaturan</b>, tersedia 2 opsi pembersihan data:
          </p>
          <div className="space-y-2 text-xs sm:text-sm text-slate-700">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <b className="text-amber-950 block">1. Kosongkan Catatan Hasil Kerja (Buku Baru)</b>
              Menghapus semua riwayat catatan pasang sepatu dan hitungan gaji harian agar kembali ke 0. Nama pekerja, model sepatu, dan nomor PO tetap aman.
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
              <b className="text-rose-950 block">2. Hapus Bersih Semua Data Pabrik</b>
              Menghapus SEMUA data termasuk nama pekerja, model sepatu, nomor PO, dan catatan kerja untuk memulai pabrik bersih dari awal.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'faq_admin',
      icon: HelpCircle,
      title: '6. Tanya Jawab (FAQ) Admin',
      subtitle: 'Pertanyaan umum seputar administrasi sistem',
      content: (
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="font-bold text-slate-900">Jika tarif ongkos model diubah hari ini, apakah gaji periode lalu ikut berubah?</div>
            <p className="mt-1 text-slate-600">Tidak. Sistem mengunci harga saat data diinput (snapshot harga), sehingga arsip gaji periode lampau tetap aman dan akurat.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="font-bold text-slate-900">Bagaimana jika ingin berpindah ke mode Mandor untuk mengecek input lapangan?</div>
            <p className="mt-1 text-slate-600">Buka menu <b>Pengaturan</b>, lalu klik <b>Mode Mandor Lapangan</b> untuk berpindah seketika tanpa perlu logout.</p>
          </div>
        </div>
      ),
    },
  ]

  const activeTopics = isMandor ? mandorTopics : adminTopics

  const filteredTopics = useMemo(() => {
    return activeTopics.filter((t) => {
      const matchSearch =
        search.trim() === '' ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.subtitle.toLowerCase().includes(search.toLowerCase())
      return matchSearch
    })
  }, [activeTopics, search])

  return (
    <div className="space-y-4">
      {/* Header Banner (M3 Tonal Container) */}
      <div
        className={`rounded-3xl border p-4.5 sm:p-5 shadow-xs transition-all ${
          isMandor
            ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950'
            : 'bg-blue-50/80 border-blue-200/80 text-blue-950'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl shadow-2xs ${
              isMandor
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {isMandor ? <HardHat className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              {isMandor ? 'Panduan Mandor Lapangan' : 'Panduan Admin'}
            </h1>
            <p className="text-xs sm:text-sm font-semibold opacity-80 mt-0.5">
              {isMandor
                ? 'Panduan praktis pencatatan hasil kerja, shift, edit data, dan ekspor excel.'
                : 'Panduan memantau dashboard, kelola master data, payroll gaji, dan database.'}
            </p>
          </div>
        </div>
      </div>

      {/* Floating M3 Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder={
            isMandor
              ? 'Cari panduan mandor (cth: input, edit, ukuran, shift)...'
              : 'Cari panduan admin (cth: dashboard, gaji, master, reset)...'
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-slate-300 bg-slate-50/80 px-5 py-3.5 pl-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/10 shadow-2xs transition-all"
        />
        <Search className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
      </div>

      {/* Topics List */}
      <div className="space-y-3">
        {filteredTopics.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
            <BookOpen className="mx-auto mb-2 h-10 w-10 text-slate-400" />
            <p className="text-sm font-bold text-slate-700">Topik tidak ditemukan</p>
            <p className="text-xs text-slate-500">Coba ketik kata kunci pencarian yang lain.</p>
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <AccordionItem
              key={topic.id}
              topic={topic}
              color={isMandor ? 'emerald' : 'blue'}
              isOpen={openIds.has(topic.id)}
              onToggle={() => toggleItem(topic.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
