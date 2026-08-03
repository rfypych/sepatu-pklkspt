# Sistem Produksi & Upah Borongan Pabrik Sepatu

Sistem berbasis **web + mobile** untuk mencatat hasil produksi harian karyawan pabrik sepatu (sistem upah borongan / piece-rate) dan mengkalkulasi upah secara otomatis.

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
README.md                     <- ini, gambaran umum
docs/
  requirements.md             <- rincian kebutuhan & aturan bisnis
  database-schema.sql         <- skema database + contoh query kalkulasi
  architecture.md             <- tech stack, arsitektur, struktur folder
  roadmap.md                  <- milestone implementasi
```

## Lisensi / Status

Dokumentasi & kode masih dalam tahap **perencanaan**. Belum ada code aplikasi.
