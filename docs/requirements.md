# Kebutuhan Sistem (Requirements)

## 1. Aktor & Hak Akses

| Role | Perangkat | Kemampuan |
| --- | --- | --- |
| **Mandor** | HP (Web / WebView APK) | Login, input data harian, lihat riwayat input hari ini |
| **Admin (Si A)** | Laptop/PC/Tablet | Login, semua Master Data, Dashboard, Payroll, kelola pengguna |

## 2. Modul Mandor (Mobile-First)

UI: tombol besar, alur maju (wizard), kontras warna, tombol simpan sticky di bawah.

1. **Login sederhana** — username/password atau PIN.
2. **Form input produksi** (step-by-step):
   - Step 1: Pilih **Pekerja** (dropdown pekerja aktif).
   - Step 2: Pilih **Shift** (tombol besar `SHIFT 1` / `SHIFT 2`).
   - Step 3: Pilih **Model Sepatu** (tombol: Futsal, Brickmansion, Onrush, Superstars).
   - Step 4: Input **qty per ukuran** (list vertikal, `type="number"` → numpad HP).
   - Step 5: Ringkasan → tombol **SIMPAN** besar (sticky bottom).
3. **Riwayat hari ini** — lihat data yang sudah diinput, boleh edit/hapus dalam batas waktu tertentu (default: hari yang sama).

## 3. Modul Admin (Dashboard Web)

- **Master Data Pekerja**: tambah, edit, nonaktifkan.
- **Master Data Model & Ongkos**: tambah/edit model sepatu + ongkos kerja (Rp/pasang). Perubahan harga hanya berlaku untuk data baru.
- **Master Data Ukuran**: checkbox untuk aktifkan ukuran (36–44), bisa tambah ukuran baru (45, dll) → otomatis muncul di form mandor.
- **Master Data Pengguna**: kelola akun admin & mandor.
- **Dashboard Produksi**: total hari ini, live, filter pekerja/model/tanggal.
- **Payroll**:
  - Filter periode otomatis (1–15, 16–akhir bulan).
  - Tabel rekap: `Nama Pekerja | Total Pasang | Total Gaji`.
  - Export Excel / PDF / Cetak.

## 4. Aturan Bisnis (Rules)

- 1 hari ada **2 shift** (Shift 1 & Shift 2).
- Ukuran default: **36–44**.
- Model awal: **Futsal, Brickmansion, Onrush, Superstars** — masing-masing punya ongkos kerja sendiri (data ongkos **belum tersedia**, nanti diisi via Master Data).
- **Satu pekerja boleh punya banyak baris produksi** per hari (beda model/beda shift).
- **Harga snapshot**: kolom `ongkos_kerja_saat_ini` di tabel detail menyimpan harga saat input, supaya perubahan harga master tidak mengubah gaji periode sebelumnya.
- Periode gaji ditentukan dari kolom `tanggal`:
  - Periode 1: `tanggal BETWEEN 1..15`
  - Periode 2: `tanggal BETWEEN 16..hari terakhir bulan`

## 5. Pertanyaan Terbuka (Butuh Konfirmasi Si A)

1. Data **ongkos kerja** per model (belum dikasih).
2. Batas waktu edit data mandor (hari yang sama / 1 jam / dsb).
3. Koneksi internet di pabrik — butuh **offline support** atau tidak?
4. Bentuk identitas pekerja (nama saja / ada ID / foto).
5. Apakah nama pekerja bisa sama? (perlu NIP atau cukup nama?)
