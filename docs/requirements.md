# Kebutuhan Sistem (Requirements)

## 1. Aktor & Hak Akses

| Role | Perangkat | Kemampuan |
| --- | --- | --- |
| **Mandor** | HP (Web / WebView APK) | Login, input data harian, edit/hapus data hari yang sama, lihat riwayat input hari ini |
| **Admin (Si A)** | **HP (Mobile-First) + PC** | Login, semua Master Data, Dashboard, Payroll, kelola pengguna, edit/hapus data produksi kapan saja (Super Admin override) |

## 2. Modul Mandor (Mobile-First)

UI: tombol besar, alur maju (wizard), kontras warna, tombol simpan sticky di bawah.

1. **Login sederhana** — username/password atau PIN.
2. **Form input produksi** (step-by-step):
   - Step 1: Pilih **Pekerja** (dropdown pekerja aktif).
   - Step 2: Pilih **Shift** (tombol besar `SHIFT 1` / `SHIFT 2`).
   - Step 3: Pilih **Model Sepatu** (tombol: Futsal, Brickmansion, Onrush, Superstars).
   - Step 4: Input **qty per ukuran** (list vertikal, `type="number"` → numpad HP).
   - Step 5: Ringkasan → tombol **SIMPAN** besar (sticky bottom).
3. **Riwayat hari ini** — lihat data yang sudah diinput, boleh **edit/hapus selama tanggal data = hari ini** (data hari sebelumnya tidak bisa disentuh mandor).

## 3. Modul Admin (Mobile-First — Si A juga pakai HP)

> **Penting**: Si A kemungkinan besar juga akses dari HP. Dashboard admin harus tetap responsif & nyaman di layar kecil (layout collapsible, menu ringkas, tombol besar). Tapi tetap mendukung layar besar (PC) untuk export & tabel payroll.

- **Master Data Pekerja**: tambah, edit, nonaktifkan.
- **Master Data Model & Ongkos**: tambah/edit model sepatu + ongkos kerja (Rp/pasang). Perubahan harga hanya berlaku untuk data baru.
- **Master Data Ukuran**: checkbox untuk aktifkan ukuran (36–44), bisa tambah ukuran baru (45, dll) → otomatis muncul di form mandor.
- **Master Data Pengguna**: kelola akun admin & mandor.
- **Dashboard Produksi**: total hari ini, live, filter pekerja/model/tanggal.
- **Menu "Data Produksi" (Super Admin override)**: list semua data produksi, bisa **edit/hapus kapan saja** — untuk memperbaiki salah input mandor (misal 100 pasang kepencet 1000) walau sudah lewat hari yang sama.
- **Payroll**:
  - Filter periode otomatis (1–15, 16–akhir bulan).
  - Tabel rekap: `Nama Pekerja | Total Pasang | Total Gaji`.
  - Export Excel / PDF / Cetak (nyaman diakses via PC).

## 4. Aturan Bisnis (Rules)

- 1 hari ada **2 shift** (Shift 1 & Shift 2).
- Ukuran default: **36–44**.
- Model awal: **Futsal, Brickmansion, Onrush, Superstars** — masing-masing punya ongkos kerja sendiri (data ongkos **belum tersedia**, nanti diisi via Master Data).
- **Harga snapshot**: kolom `ongkos_kerja_saat_ini` di tabel detail menyimpan harga saat input, supaya perubahan harga master tidak mengubah gaji periode sebelumnya.
- **Aturan edit data**:
  - **Mandor**: bebas edit/hapus data **yang tanggalnya hari ini** (Hari H). Data hari sebelumnya dikunci — mencegah mandor mengubah data lama yang sudah masuk rekap.
  - **Admin (Si A)**: bebas edit/hapus data produksi **kapan saja** lewat menu "Data Produksi" (override mandor).
- Periode gaji ditentukan dari kolom `tanggal`:
  - Periode 1: `tanggal BETWEEN 1..15`
  - Periode 2: `tanggal BETWEEN 16..hari terakhir bulan`

## 5. Pertanyaan Terbuka (Butuh Konfirmasi Si A)

1. Data **ongkos kerja** per model (belum dikasih).
2. Koneksi internet di pabrik — butuh **offline support** atau tidak?
3. Bentuk identitas pekerja (nama saja / ada ID / foto).
4. Apakah nama pekerja bisa sama? (perlu NIP atau cukup nama?)
