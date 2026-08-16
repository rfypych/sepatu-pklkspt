import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'

function Bagian({
  judul,
  children,
  defaultBuka = false,
}: {
  judul: string
  children: React.ReactNode
  defaultBuka?: boolean
}) {
  const [buka, setBuka] = useState(defaultBuka)
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-xs">
      <button
        onClick={() => setBuka((b) => !b)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-neutral-50/80 transition-colors"
      >
        <span className="font-semibold text-neutral-900">{judul}</span>
        {buka ? <ChevronDown className="h-4 w-4 text-neutral-500" /> : <ChevronRight className="h-4 w-4 text-neutral-400" />}
      </button>
      {buka && <div className="border-t border-neutral-100 p-4 text-sm leading-relaxed text-neutral-700 bg-neutral-50/50">{children}</div>}
    </div>
  )
}

function Langkah({ nomor, judul, isi }: { nomor: string; judul: string; isi: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
        {nomor}
      </div>
      <div>
        <div className="font-semibold text-neutral-900">{judul}</div>
        <div className="mt-0.5 text-xs text-neutral-600 leading-relaxed">{isi}</div>
      </div>
    </div>
  )
}

export default function Help() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Pusat Bantuan</h1>
          <p className="text-xs text-neutral-500">Panduan lengkap operasional sistem.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Bagian judul="1️⃣ Cara Login" defaultBuka>
          <div className="space-y-3">
            <Langkah
              nomor="1"
              judul="Buka aplikasi"
              isi="Buka aplikasi lewat browser/HP, lalu halaman login akan muncul."
            />
            <Langkah
              nomor="2"
              judul="Isi Username & Password"
              isi="Masukkan username dan password yang diberikan oleh Admin."
            />
            <Langkah
              nomor="3"
              judul="Tekan tombol MASUK"
              isi="Setelah masuk, aplikasi otomatis menampilkan menu sesuai peran Anda — Mandor atau Admin."
            />
            <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
              ⚠️ Kalau lupa password, minta direset oleh Admin.
            </p>
          </div>
        </Bagian>

        <Bagian judul="2️⃣ Untuk Mandor — Cara Input Produksi">
          <div className="space-y-3">
            <p>Dari menu <b>INPUT PRODUKSI</b>, Anda dapat mencatat hasil harian:</p>
            <Langkah nomor="1" judul="Pilih Pekerja" isi="Ketuk nama pekerja yang hari ini dicatat hasilnya." />
            <Langkah nomor="2" judul="Pilih Shift" isi="Tekan tombol SHIFT 1 (pagi) atau SHIFT 2 (siang/malam)." />
            <Langkah nomor="3" judul="Pilih PO bila perlu" isi="Opsional. Bisa dipilih nomor PO, atau biarkan 'Lewati'." />
            <Langkah nomor="4" judul="+ Tambah Model" isi="Tekan + TAMBAH MODEL untuk tiap model yang dikerjakan." />
            <Langkah nomor="5" judul="Isi Jumlah per Ukuran" isi="Untuk tiap model, ketik jumlah pasang per ukuran. Isi 0/kosong untuk ukuran yang tidak ada hasilnya." />
            <Langkah nomor="6" judul="SIMPAN DATA" isi="Setelah semua model diisi, tekan SIMPAN HASIL PRODUKSI. Semua data tersimpan sekaligus untuk pekerja & shift tersebut." />
            <p className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800">
              ✅ Total pasang dihitung otomatis — tidak perlu menghitung sendiri.
            </p>
          </div>
        </Bagian>

        <Bagian judul="3️⃣ Untuk Mandor — Riwayat & Koreksi Data">
          <div className="space-y-3">
            <p>
              Menu <b>RIWAYAT</b> menampilkan seluruh catatan hasil produksi. Di sini Anda bisa:
            </p>
            <ul className="list-inside space-y-1">
              <li>✏️ <b>Edit</b> — mengubah jumlah pasang bila salah ketik.</li>
              <li>🗑 <b>Hapus</b> — menghapus baris yang tidak perlu.</li>
            </ul>
            <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
              ⚠️ Hanya data <b>tanggal hari ini</b> yang bisa diubah mandor. Data hari sebelumnya terkunci — kalau ada koreksi lewat hari, hubungi Admin.
            </p>
          </div>
        </Bagian>

        <Bagian judul="4️⃣ Untuk Admin — Dashboard">
          <div className="space-y-3">
            <p>Menu <b>Dashboard</b> menampilkan ringkasan produksi hari ini secara real-time (ter-update otomatis tiap 5 detik):</p>
            <ul className="list-inside space-y-1">
              <li>📦 <b>Total Pasang Hari Ini</b> — jumlah seluruh pasang yang dicatat hari ini.</li>
              <li>💰 <b>Perkiraan Gaji</b> — total estimasi upah seluruh pekerja hari ini.</li>
              <li>Daftar per pekerja: berapa pasang dan berapa upahnya per model & shift.</li>
            </ul>
          </div>
        </Bagian>

        <Bagian judul="5️⃣ Untuk Admin — Data Produksi">
          <div className="space-y-3">
            <p>Menu <b>Data Produksi</b> adalah daftar lengkap seluruh data yang diinput mandor:</p>
            <ul className="list-inside space-y-1">
              <li>🔍 <b>Filter</b> — pilih tanggal dan/atau nama pekerja untuk mempersempit tampilan.</li>
              <li>✏️ <b>Edit</b> — perbaiki jumlah pasang yang salah.</li>
              <li>🗑 <b>Hapus</b> — hapus data yang keliru/duplikat.</li>
            </ul>
            <p className="rounded-lg bg-sky-50 p-2 text-xs text-sky-800">
              💡 Berbeda dengan mandor, admin bisa mengedit/menghapus data <b>kapan saja</b>, termasuk data lama.
            </p>
          </div>
        </Bagian>

        <Bagian judul="6️⃣ Untuk Admin — Payroll (Gaji)">
          <div className="space-y-3">
            <p>Menu <b>Payroll</b> menghitung gaji otomatis:</p>
            <ul className="list-inside space-y-1">
              <li>📆 Pilih <b>periode</b> — otomatis terbagi dua: <b>1–15</b> dan <b>16–akhir bulan</b>.</li>
              <li>📋 Rekap per pekerja: nama pekerja, rincian per model, total pasang, dan total gaji.</li>
              <li>💵 <b>Total Gaji Periode</b> di bagian atas — jumlah keseluruhan.</li>
              <li>⬇️ <b>CSV</b> — tombol ekspor untuk dibuka di Excel / dicetak.</li>
            </ul>
            <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
              ⚠️ Pastikan data produksi sudah benar sebelum membayar gaji. Mengubah/menghapus data produksi akan mengubah rekap gaji.
            </p>
          </div>
        </Bagian>

        <Bagian judul="7️⃣ Untuk Admin — Master Data">
          <div className="space-y-3">
            <p>Menu <b>Master Data</b> untuk mengatur data dasar. Semua bisa diubah kapan saja <b>tanpa perlu mengubah program</b>:</p>
            <div className="space-y-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="font-semibold text-slate-800">👷 Pekerja</div>
                <div className="text-slate-600">Tambah pekerja baru, atau aktif/nonaktifkan pekerja (pekerja nonaktif tidak muncul di form mandor).</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="font-semibold text-slate-800">👟 Model & Ongkos</div>
                <div className="text-slate-600">Tambah model baru dan atur ongkos kerja per pasang (Rp). Perubahan harga hanya berlaku untuk data baru — gaji periode lama tidak ikut berubah.</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="font-semibold text-slate-800">📏 Ukuran</div>
                <div className="text-slate-600">Aktifkan/nonaktifkan ukuran, dan tambah ukuran baru. Ukuran aktif otomatis muncul di form mandor.</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="font-semibold text-slate-800">📦 PO</div>
                <div className="text-slate-600">Tambah/kelola nomor PO dan nama customer. PO nonaktif tidak muncul di pilihan mandor.</div>
              </div>
            </div>
          </div>
        </Bagian>

        <Bagian judul="8️⃣ Apa itu PO?">
          <div className="space-y-3">
            <p>
              PO = <b>Surat Perintah Kerja</b> — pesanan produksi dari customer, contoh: <i>"PO-2026-001: buat 500 pasang untuk Toko Sentral"</i>.
            </p>
            <p>
              PO <b>bukan target harian yang wajib tercapai</b>. PO adalah jatah pekerjaan yang dikerjakan sedikit demi sedikit setiap shift. Yang dicatat mandor adalah <b>berapa pasang yang selesai hari itu</b>.
            </p>
            <p>
              PO sifatnya <b>opsional</b> — mandor boleh melewatinya. Gaji dihitung dari jumlah pasang × ongkos kerja, <b>tidak tergantung PO</b>.
            </p>
          </div>
        </Bagian>

        <Bagian judul="9️⃣ Bagaimana Gaji Dihitung?">
          <div className="space-y-3">
            <p>Perhitungan upah kerja dihitung per pasang:</p>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <div className="font-semibold text-slate-800">Upah = Jumlah Pasang × Ongkos Kerja Model</div>
              <div className="mt-1 text-xs text-slate-500">Contoh: 100 pasang × Rp 1.000 = Rp 100.000</div>
            </div>
            <p>Rinciannya:</p>
            <ul className="list-inside space-y-1">
              <li>📅 <b>Periode gaji</b> dibagi otomatis: tanggal 1–15 dan 16–akhir bulan.</li>
              <li>🔒 <b>Harga tersimpan (snapshot)</b>: gaji pakai ongkos saat data diinput. Kalau ongkos diubah di tengah bulan, data lama tetap dihitung pakai harga lama — gaji tidak kacau.</li>
              <li>🧮 <b>Semua dihitung otomatis</b> oleh sistem; tidak perlu kalkulator manual.</li>
            </ul>
          </div>
        </Bagian>

        <Bagian judul="🔟 FAQ / Sering Ditanyakan">
          <div className="space-y-4">
            <div>
              <div className="font-semibold text-slate-800">Kenapa ada pekerja yang tidak muncul di daftar?</div>
              <p className="text-slate-600">Karena pekerja dinonaktifkan di Master Data → tab Pekerja. Aktifkan kembali agar muncul.</p>
            </div>
            <div>
              <div className="font-semibold text-slate-800">Kenapa ukuran 45 tidak muncul di form mandor?</div>
              <p className="text-slate-600">Tambah/aktifkan ukurannya di Master Data → tab Ukuran. Ukuran aktif otomatis muncul di form input.</p>
            </div>
            <div>
              <div className="font-semibold text-slate-800">Saya salah input kemarin, bisa diubah tidak?</div>
              <p className="text-slate-600">Mandor hanya bisa mengubah data hari ini. Data kemarin perlu dikoreksi oleh admin lewat menu Data Produksi.</p>
            </div>
            <div>
              <div className="font-semibold text-slate-800">Ongkos kerja berubah, apa gaji lama ikut berubah?</div>
              <p className="text-slate-600">Tidak. Data yang sudah masuk tetap memakai ongkos saat itu. Perubahan berlaku untuk data yang baru diinput.</p>
            </div>
            <div>
              <div className="font-semibold text-slate-800">Data yang sudah saya simpan hilang?</div>
              <p className="text-slate-600">Pastikan koneksi aman dan cek menu Riwayat Hari Ini. Kalau tetap tidak muncul, hubungi admin.</p>
            </div>
            <div>
              <div className="font-semibold text-slate-800">Bagaimana cara membayar gaji?</div>
              <p className="text-slate-600">Buka menu Payroll, pilih periode, lihat rekap, lalu ekspor CSV untuk diolah/dicetak. Sistem menghitung, pembayaran tetap manual.</p>
            </div>
          </div>
        </Bagian>
      </div>
    </div>
  )
}
