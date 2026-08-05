# Alur Sistem (Flows)

Dokumen ini menjelaskan **alur kerja** aplikasi dari sisi mandor, sisi admin (Si A), dan alur data di belakangnya.

---

## 1. Penjelasan Singkat "PO" (yang dulu bikin bingung)

PO = **Surat Perintah Kerja / produksi order** — bukan target harian yang wajib tercapai.

Cara bacanya:
- Si A menerima pesanan, contoh: "PO-2026-001, buat 500 pasang Futsal untuk customer X".
- Mandor mengerjakan PO itu **sedikit demi sedikit setiap shift** — yang tercatat adalah **berapa pasang yang selesai hari itu**, bukan target yang harus tepat.
- Kalau PO-nya selesai, tinggal ganti ke PO berikutnya.

**Konsekuensi di sistem:**
- PO itu **opsional** di form mandor (bisa dipilih via dropdown, bisa dikosongkan).
- Data produksi boleh lepas PO sama sekali — kalkulasi gaji **tidak tergantung PO**, tapi tergantung qty × ongkos kerja.

---

## 2. Alur Mandor (HP)

```
[Login]
   username + password (akun dibuat admin)

[Halaman Utama Mandor]
   Tombol besar: "INPUT PRODUKSI"  |  "RIWAYAT HARI INI"

[INPUT PRODUKSI] (wizard 6 langkah)
   1. Pilih Pekerja      → dropdown (hanya pekerja aktif)
   2. Pilih Shift        → tombol besar [SHIFT 1] / [SHIFT 2]
   3. Pilih Model        → tombol model (Futsal / Brickmansion / Onrush / Superstars)
   4. Pilih PO (opsional)→ dropdown daftar PO aktif, atau "Lewati"
   5. Isi Qty per Ukuran → list ke bawah 36, 37, ..., 44 (numpad, default 0)
   6. Ringkasan & SIMPAN → tombol besar sticky di bawah

[RIWAYAT HARI INI]
   - Daftar data yang diinput hari ini
   - Bisa EDIT / HAPUS data yang tanggalnya hari ini saja
   - Data hari kemarin/dulu TIDAK bisa disentuh mandor
```

### Contoh skenario mandor
> Hari Senin Shift 1, Pak Pramono menyelesaikan Futsal. Mandor memilih: Pramono → Shift 1 → Futsal → PO-2026-001 → lalu isi 36: 5, 37: 8, 38: 10, dst → SIMPAN. Total pasang hari itu = 23.

---

## 3. Alur Admin (Si A) — HP/PC

```
[Login]
   username + password (role admin)

[Dashboard Admin]
   ├── DASHBOARD         → total produksi hari ini, update LIVE (real-time)
   │                       filter: pekerja / model / tanggal / shift
   ├── DATA PRODUKSI     → semua data produksi, bisa EDIT/HAPUS kapan saja
   │                       (untuk perbaiki salah input mandor, walau sudah lewat)
   ├── PAYROLL           → pilih bulan → otomatis 2 periode
   │                       1-15 dan 16-akhir bulan
   │                       tabel: Nama | Total Pasang | Total Gaji
   │                       export Excel / PDF / cetak
   └── MASTER DATA       → semuanya bisa diubah tanpa bongkar kode:
        ├── Pekerja      (tambah / edit / nonaktifkan)
        ├── Model & Ongkos (tambah / edit harga / nonaktifkan)
        ├── Ukuran       (centang aktif 36-44, tambah ukuran baru)
        ├── PO           (tambah / edit / nonaktifkan)
        └── Pengguna     (buat akun mandor / admin baru)
```

### Contoh skenario admin
> Mandor salah input: si Pramono seharusnya 100 pasang tapi kepencet 1000. Si A buka **Data Produksi**, cari tanggal itu, edit jadi 100. Rekap gaji langsung ikut benar.

---

## 4. Alur Data (yang otomatis di belakang)

```
[Mandor menekan SIMPAN]
        │
        ▼
produksi_harian        ← tanggal, shift, id_pekerja, id_sepatu, id_po (opsional)
produksi_detail        ← per ukuran: qty + ongkos_kerja_saat_ini (SNAPSHOT harga)
        │
        ▼
Kalkulasi otomatis:
   Total Pasang per baris  = Σ qty semua ukuran
   Subtotal Gaji           = Σ (qty × ongkos_kerja_saat_ini)
   Gaji per Periode        = Σ subtotal, dibatasi rentang tanggal 1-15 / 16-akhir
        │
        ▼
Dashboard & Payroll admin otomatis ter-update (realtime)
```

**Kenapa pakai snapshot harga?**
Kalau hari ini ongkos Futsal diubah dari Rp 1.000 ke Rp 1.500, data minggu lalu tetap dihitung pakai Rp 1.000. Gaji periode lama tidak berubah.

---

## 5. Alur Satu Hari (Ringkas)

| Waktu | Siapa | Aksi |
| --- | --- | --- |
| Pagi | Mandor | Login → pilih Shift 1 → input pekerja satu per satu |
| Siang | Mandor | Login → pilih Shift 2 → input pekerja satu per satu |
| Sewaktu-waktu | Si A | Lihat dashboard live, koreksi data salah |
| Tanggal 15 | Si A | Export payroll periode 1-15, bayar gaji |
| Akhir bulan | Si A | Export payroll periode 16-31, bayar gaji |
