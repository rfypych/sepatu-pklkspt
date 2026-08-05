# Sistem Produksi & Upah Borongan Pabrik Sepatu

Sistem berbasis **web + mobile** untuk mencatat hasil produksi harian karyawan pabrik sepatu (sistem upah borongan / piece-rate) dan mengkalkulasi upah secara otomatis.

**Stack**: React + Vite + TS (frontend) · Node.js + Express + JWT (backend) · MySQL 8 Laragon (database). Semua berjalan offline di lokal.

## Cara Menjalankan (Laragon)

1. Nyalakan MySQL di Laragon (user root, tanpa password).
2. Siapkan database (sekali saja):
   ```
   mysql -u root < server/sql/schema.sql
   mysql -u root < server/sql/seed.sql
   ```
3. Jalankan API → `cd server && npm install && npm run dev` (port 3000)
4. Jalankan aplikasi → `cd web && npm install && npm run dev` (port 5173)
5. Login uji: `admin/admin123` (admin) · `mandor/mandor123` (mandor)

## Masalah yang Diselesaikan

- Mandor (gaptek) harus bisa input data harian dari HP dengan **cara sesederhana mungkin**.
- Pemilik (Si A) ingin **semuanya otomatis terhitung** dan master data (item, ongkos, ukuran) bisa **diubah-ubah tanpa perlu ubah kode**.
- Periode gaji 2x sebulan: **tanggal 1–15** dan **16–akhir bulan**.
- Setiap kali mandor menyimpan data, rekap gaji di dashboard Si A langsung ter-update.

## Cara Gaji Dihitung (Sistem Borongan)

```
Total Gaji Pekerja per Periode = Σ (qty per model × ongkos_kerja model)
```

- Qty = jumlah **pasang** sepatu yang selesai (sum semua ukuran 36–44).
- Ongkos kerja per model (Rp/pasang) diatur oleh Si A di Master Data.
- Harga yang dipakai adalah harga **saat data diinput** (bukan harga master terbaru), sehingga mengubah harga hari ini **tidak merusak** rekap gaji periode lalu.

## Fitur Utama

| Modul | Untuk | Isi |
| --- | --- | --- |
| **Input Produksi** (Mobile) | Mandor | Wizard step-by-step: pilih pekerja → shift → model → qty per ukuran → simpan |
| **Master Data** | Si A | Kelola pekerja, model & ongkos kerja, ukuran aktif, akun pengguna |
| **Dashboard** | Si A | Monitoring produksi real-time + filter |
| **Payroll** | Si A | Rekap gaji otomatis per periode (1–15 / 16–31), export Excel/PDF |

## Struktur Dokumen

```
README.md                     <- ini, gambaran umum + cara jalan
docs/
  requirements.md             <- rincian kebutuhan & aturan bisnis
  database-schema.sql         <- skema PostgreSQL (arsip desain awal)
  architecture.md             <- tech stack & arsitektur (stack lokal sekarang)
  flows.md                    <- alur kerja (mandor, admin, alur data)
  roadmap.md                  <- milestone implementasi
server/
  sql/schema.sql              <- skema MySQL (yang dipakai)
  sql/seed.sql                <- data awal + akun uji
web/                          <- aplikasi React
```

## Lisensi / Status

Dokumentasi & kode masih dalam tahap **perencanaan**. Belum ada code aplikasi.
