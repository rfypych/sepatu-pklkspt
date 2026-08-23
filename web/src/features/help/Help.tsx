import { useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { EmptyState, FieldLabel, TextInput } from '../../components/ui'
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
    <div
      className={`overflow-hidden rounded-3xl border-2 bg-white shadow-sm ${
        isOpen ? 'border-slate-900' : 'border-slate-300'
      }`}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 p-4 text-left active:bg-slate-100"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 ${
              isBlue
                ? 'border-blue-300 bg-blue-100 text-blue-800'
                : 'border-emerald-300 bg-emerald-100 text-emerald-800'
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-extrabold leading-tight tracking-tight text-slate-900">
              {topic.title}
            </div>
            <div className="mt-0.5 text-base font-medium leading-snug text-slate-600">
              {topic.subtitle}
            </div>
          </div>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 ${
            isOpen
              ? 'border-slate-950 bg-slate-900 text-white'
              : 'border-slate-300 bg-slate-100 text-slate-700'
          }`}
        >
          {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t-2 border-slate-200 bg-slate-50 p-4 text-base leading-relaxed text-slate-800 sm:p-5">
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
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white ${
          isBlue ? 'bg-blue-700' : 'bg-emerald-700'
        }`}
      >
        {nomor}
      </div>
      <div className="min-w-0 pt-0.5">
        <div className="text-base font-extrabold text-slate-900">{judul}</div>
        <div className="mt-0.5 text-base font-medium leading-relaxed text-slate-700">
          {deskripsi}
        </div>
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
      title: '1. Cara Mengisi Hasil Kerja',
      subtitle: 'Langkah demi langkah mencatat hasil kerja harian',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Di menu <b>Isi Data</b> (menu pertama di bawah), ikuti langkah ini:
          </p>
          <div className="space-y-2.5">
            <Step nomor="1" judul="Pilih Nama Pekerja" deskripsi="Ketuk nama pekerja dari daftar yang tersedia." />
            <Step nomor="2" judul="Pilih Shift Kerja" deskripsi="Pilih Shift 1 (Pagi) atau Shift 2 (Siang/Malam)." />
            <Step nomor="3" judul="Pilih Nomor PO (Pesanan)" deskripsi="Bisa dipilih nomor PO yang dikerjakan, atau lewati jika pekerjaan reguler umum." />
            <Step nomor="4" judul="Tambah Model & Isi Ukuran" deskripsi="Pilih model sepatu, lalu masukkan jumlah pasang di nomor ukuran yang dikerjakan (nomor 36 s/d 44)." />
            <Step nomor="5" judul="Tekan Simpan" deskripsi="Tekan tombol hijau SIMPAN di bagian bawah. Data langsung tersimpan." />
          </div>
          <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-3 text-base font-semibold text-emerald-900">
            ✅ Total pasang sepatu dan perkiraan upah langsung dihitung otomatis oleh aplikasi.
          </div>
        </div>
      ),
    },
    {
      id: 'edit_data',
      icon: Edit3,
      title: '2. Cara Memperbaiki Data yang Salah',
      subtitle: 'Mengubah jumlah pasang yang sudah tersimpan',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Jika ada kesalahan jumlah ukuran pada data yang sudah disimpan hari ini:
          </p>
          <div className="space-y-2.5">
            <Step nomor="1" judul="Buka Lembar Kerja Pekerja" deskripsi="Pilih nama pekerja yang datanya ingin diperbaiki." />
            <Step nomor="2" judul="Tekan Tombol Ubah" deskripsi="Pada kartu yang sudah tersimpan, tekan tombol biru bertulisan Ubah." />
            <Step nomor="3" judul="Sesuaikan Jumlah Ukuran" deskripsi="Ubah angka pasang pada ukuran yang keliru memakai tombol + dan − , atau ketik angkanya langsung." />
            <Step nomor="4" judul="Simpan Perubahan" deskripsi="Tekan tombol 'Simpan Perubahan'. Total pasang dan upah akan langsung ter-update otomatis." />
          </div>
        </div>
      ),
    },
    {
      id: 'hapus_data',
      icon: Trash2,
      title: '3. Cara Menghapus Catatan yang Keliru',
      subtitle: 'Membatalkan item yang tidak sengaja terinput',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Untuk menghapus catatan kerja sepatu:
          </p>
          <div className="space-y-2">
            <p className="text-base text-slate-800">
              1. Buka kartu pekerja atau masuk ke menu <b>Riwayat</b>.<br />
              2. Tekan tombol merah <b>Hapus</b> pada data yang ingin dibuang.<br />
              3. Pada jendela konfirmasi, tekan <b>"Ya, Hapus"</b>.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-3 text-base font-semibold text-amber-900">
            ⚠️ Mandor hanya dapat menghapus atau mengedit data <b>hari ini</b> sebelum tutup buku.
          </div>
        </div>
      ),
    },
    {
      id: 'riwayat_mandor',
      icon: ClipboardList,
      title: '4. Melihat Riwayat & Menyimpan ke Excel',
      subtitle: 'Melihat rekap total harian dan download file laporan ke HP',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Menu <b>Riwayat</b> dipakai untuk melihat semua hasil kerja yang sudah dicatat:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-base text-slate-800">
            <li><b>Total Pasang Harian:</b> Memantau akumulasi hasil kerja seluruh tukang sepatu pada hari ini.</li>
            <li><b>Filter Shift:</b> Memisahkan pantauan hasil kerja Shift 1 dan Shift 2.</li>
            <li><b>Tombol Simpan ke Excel:</b> Menyimpan laporan ke folder <b>Download (Unduhan)</b> di HP Anda, siap dikirim ke WhatsApp.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'faq_mandor',
      icon: HelpCircle,
      title: '5. Tanya Jawab Mandor',
      subtitle: 'Solusi untuk kendala umum di lapangan',
      content: (
        <div className="space-y-3 text-base">
          <div className="rounded-2xl border-2 border-slate-300 bg-white p-3.5">
            <div className="font-bold text-slate-900">Nama pekerja tidak muncul di pilihan?</div>
            <p className="mt-1 text-slate-700">Pastikan admin sudah mendaftarkan nama pekerja dan mengaktifkan statusnya di Master Data.</p>
          </div>
          <div className="rounded-2xl border-2 border-slate-300 bg-white p-3.5">
            <div className="font-bold text-slate-900">Apakah harus login ulang setiap kali buka aplikasi HP?</div>
            <p className="mt-1 text-slate-700">Tidak. Aplikasi mandor sudah otomatis menyimpan sesi sehingga bisa langsung dipakai mencatat.</p>
          </div>
          <div className="rounded-2xl border-2 border-slate-300 bg-white p-3.5">
            <div className="font-bold text-slate-900">Di mana file Excel yang diunduh tersimpan?</div>
            <p className="mt-1 text-slate-700">File tersimpan langsung di folder <b>Unduhan / Downloads</b> pada memori HP.</p>
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
      title: '1. Beranda: Hasil Kerja Hari Ini',
      subtitle: 'Memantau produktivitas dan pengeluaran upah pabrik',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Menu <b>Beranda</b> menampilkan hasil kerja hari ini dan diperbarui otomatis:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-base">
            <div className="rounded-2xl border-2 border-slate-300 bg-white p-3">
              <span className="font-extrabold text-slate-900 block">Total Pasang Hari Ini</span>
              Akumulasi jumlah pasang sepatu yang diselesaikan seluruh pekerja pada hari ini.
            </div>
            <div className="rounded-2xl border-2 border-slate-300 bg-white p-3">
              <span className="font-extrabold text-slate-900 block">Estimasi Upah Hari Ini</span>
              Total kewajiban gaji harian yang harus dibayarkan sesuai tarif ongkos model sepatu.
            </div>
            <div className="rounded-2xl border-2 border-slate-300 bg-white p-3">
              <span className="font-extrabold text-slate-900 block">Breakdown Shift 1 & 2</span>
              Perbandingan hasil pasang antara Shift 1 (Pagi) dan Shift 2 (Siang/Malam).
            </div>
            <div className="rounded-2xl border-2 border-slate-300 bg-white p-3">
              <span className="font-extrabold text-slate-900 block">Model Terbanyak Dikerjakan</span>
              Informasi model sepatu yang sedang paling banyak diproduksi hari ini.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'data_produksi_admin',
      icon: FileSpreadsheet,
      title: '2. Data Produksi & Koreksi',
      subtitle: 'Melihat seluruh riwayat produksi semua tanggal dan ekspor Excel',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Menu <b>Produksi</b> adalah tempat semua catatan hasil kerja pabrik:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-base text-slate-800">
            <li><b>Filter Tanggal & Pekerja:</b> Memeriksa hasil kerja karyawan tertentu pada tanggal atau rentang tanggal tertentu.</li>
            <li><b>Koreksi Penuh:</b> Admin memiliki wewenang mengoreksi maupun menghapus data produksi kapan saja (termasuk tanggal lampau).</li>
            <li><b>Simpan ke Excel:</b> Menyimpan laporan produksi ke file Excel untuk arsip pembukuan.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'payroll_admin',
      icon: Coins,
      title: '3. Rekap Gaji',
      subtitle: 'Perhitungan upah otomatis per periode cut-off (1-15 & 16-akhir bulan)',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Menu <b>Gaji</b> menghitung upah pekerja secara otomatis:
          </p>
          <div className="space-y-2 text-base text-slate-800">
            <p>• <b>Periode Cut-Off:</b> Otomatis terbagi menjadi periode 1–15 dan periode 16–akhir bulan.</p>
            <p>• <b>Rincian per Pekerja:</b> Menampilkan breakdown tiap model yang dikerjakan beserta total pasang dan total upah rupiah.</p>
            <p>• <b>Simpan ke Excel:</b> Tekan tombol "Simpan ke Excel" untuk mengolah atau mencetak data gaji.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'master_data',
      icon: UserCheck,
      title: '4. Master Data Pabrik',
      subtitle: 'Pengaturan pekerja, tarif upah model, ukuran sepatu, dan nomor PO',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-base">
            <div className="rounded-2xl border-2 border-slate-300 bg-white p-3">
              <span className="font-extrabold text-slate-900 block">👷 Master Pekerja</span>
              Tambah nama karyawan baru atau nonaktifkan karyawan yang sudah berhenti.
            </div>
            <div className="rounded-2xl border-2 border-slate-300 bg-white p-3">
              <span className="font-extrabold text-slate-900 block">👟 Model & Tarif Upah</span>
              Tambah model sepatu baru dan tentukan nominal ongkos kerja per pasang (Rp).
            </div>
            <div className="rounded-2xl border-2 border-slate-300 bg-white p-3">
              <span className="font-extrabold text-slate-900 block">📏 Master Ukuran</span>
              Kelola nomor ukuran sepatu aktif (misal No 36 s/d 44).
            </div>
            <div className="rounded-2xl border-2 border-slate-300 bg-white p-3">
              <span className="font-extrabold text-slate-900 block">📦 Master PO Pesanan</span>
              Kelola nomor pesanan customer beserta target pasang yang harus dipenuhi.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'reset_db',
      icon: Database,
      title: '5. Menghapus / Mengosongkan Data',
      subtitle: 'Mengosongkan riwayat kerja untuk buku baru atau reset total',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            Di menu <b>Pengaturan</b>, tersedia 2 opsi pembersihan data:
          </p>
          <div className="space-y-2 text-base text-slate-800">
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
              <b className="text-amber-950 block">1. Kosongkan Catatan Hasil Kerja (Buku Baru)</b>
              Menghapus semua riwayat catatan pasang sepatu dan hitungan gaji harian agar kembali ke 0. Nama pekerja, model sepatu, dan nomor PO tetap aman.
            </div>
            <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-3">
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
      title: '6. Tanya Jawab Admin',
      subtitle: 'Pertanyaan umum seputar administrasi sistem',
      content: (
        <div className="space-y-3 text-base">
          <div className="rounded-2xl border-2 border-slate-300 bg-white p-3.5">
            <div className="font-bold text-slate-900">Jika tarif ongkos model diubah hari ini, apakah gaji periode lalu ikut berubah?</div>
            <p className="mt-1 text-slate-700">Tidak. Sistem mengunci harga saat data diinput (snapshot harga), sehingga arsip gaji periode lampau tetap aman dan akurat.</p>
          </div>
          <div className="rounded-2xl border-2 border-slate-300 bg-white p-3.5">
            <div className="font-bold text-slate-900">Bagaimana jika ingin berpindah ke mode Mandor untuk mengecek input lapangan?</div>
            <p className="mt-1 text-slate-700">Buka menu <b>Pengaturan</b> (ikon gerigi di kanan atas), lalu tekan <b>Mode Mandor</b>. Tidak perlu keluar dari aplikasi.</p>
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
      {/* ---------- Banner ---------- */}
      <div
        className={`rounded-3xl border-2 p-4 shadow-sm sm:p-5 ${
          isMandor
            ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
            : 'border-blue-300 bg-blue-50 text-blue-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white ${
              isMandor ? 'bg-emerald-700' : 'bg-blue-700'
            }`}
          >
            {isMandor ? <HardHat className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
              {isMandor ? 'Panduan Mandor' : 'Panduan Admin'}
            </h1>
            <p className="mt-0.5 text-base font-medium leading-snug opacity-90">
              {isMandor
                ? 'Cara mengisi hasil kerja, memperbaiki data, dan menyimpan laporan.'
                : 'Cara memantau hasil kerja, rekap gaji, master data, dan hapus data.'}
            </p>
          </div>
        </div>
      </div>

      {/* ---------- Cari ---------- */}
      <div>
        <FieldLabel htmlFor="cari-panduan">Cari panduan</FieldLabel>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <TextInput
            id="cari-panduan"
            type="text"
            placeholder={isMandor ? 'contoh: isi data, ubah, ukuran' : 'contoh: gaji, master, hapus'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-13"
          />
        </div>
      </div>

      {/* ---------- Daftar topik ---------- */}
      <div className="space-y-3">
        {filteredTopics.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title="Panduan tidak ditemukan"
            description="Coba kata lain, atau kosongkan kotak pencarian untuk melihat semua panduan."
          />
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
