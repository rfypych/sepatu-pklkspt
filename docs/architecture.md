# Arsitektur & Tech Stack

> **Update**: stack berubah dari Supabase menjadi **lokal penuh** — Node.js + Express + MySQL (Laragon). Semua jalan offline tanpa internet.

## 1. Keputusan Teknologi

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| **Frontend** | React + Vite + TypeScript | UI berbasis komponen, cocok untuk wizard form mandor & dashboard admin; build cepat. |
| **UI Library** | Tailwind CSS | Cepat bikin UI besar-tombol mobile-first tanpa bolak-balik bikin CSS manual. |
| **Backend** | Node.js + Express + JWT | API lokal sederhana, auth pakai JWT (username + password + role). |
| **Database** | MySQL 8 (Laragon) | Sudah terpasang di Laragon, user root tanpa password, offline. |
| **Hosting** | Lokal (dev) → nanti Vercel | Dicoba lokal dulu; migrasi ke hosting menyusul. |
| **Mobile** | Web-app dioptimasi HP → bungkus WebView (APK kecil) | Baik mandor **maupun admin (Si A)** akses lewat HP. Tidak perlu Android native, cepat & ringan. |

### Struktur folder sekarang

```
sepatu-pklkspt/
├── docs/                        <- dokumentasi & skema (arsip)
├── server/                      <- API lokal (Node + Express + MySQL)
│   ├── src/
│   │   ├── index.js             <- entrypoint
│   │   ├── db.js                <- koneksi MySQL pool
│   │   ├── auth.js              <- JWT sign/verify + guard role
│   │   ├── store.js             <- query dasar master data
│   │   └── routes/              <- auth, master, produksi, payroll, dashboard
│   └── sql/
│       ├── schema.sql           <- skema MySQL (yang dipakai)
│       └── seed.sql             <- data awal (admin/admin123, mandor/mandor123)
└── web/                         <- aplikasi React (Vite + TS + Tailwind)
```

### Cara menjalankan (Laragon)

1. Pastikan **MySQL Laragon menyala** (root tanpa password).
2. Buat database & data awal (sekali saja):
   ```
   mysql -u root < server/sql/schema.sql
   mysql -u root < server/sql/seed.sql
   ```
3. Jalankan API:
   ```
   cd server && npm install && npm run dev    # http://localhost:3000
   ```
4. Jalankan frontend:
   ```
   cd web && npm install && npm run dev       # http://localhost:5173
   ```
5. Login uji: `admin/admin123` (admin) atau `mandor/mandor123` (mandor).

## 2. Alur Data

```
Mandor / Admin (HP/PC)          Server lokal (Node+Express)         MySQL (Laragon)
------------------------        --------------------------           ----------------
Login ──────────────────────►  POST /api/auth/login ──► verifikasi bcrypt → JWT
Wizard input ───────────────►  POST /api/produksi ────► insert header + detail (snapshot ongkos)
Dashboard (polling 5 dtk) ──►  GET /api/dashboard/today
Payroll ────────────────────►  GET /api/payroll/rekap?periode=...
Data Produksi edit ─────────►  PUT/DELETE /api/produksi/:id ──► (mandor dibatasi hari ini & punya sendiri)
```

## 3. Struktur Folder

```
sepatu-pklkspt/
├── docs/                        <- dokumentasi & skema (arsip desain)
├── server/                      <- API lokal (Node + Express + MySQL)
│   ├── src/routes/              <- auth, master, produksi, payroll, dashboard
│   └── sql/                     <- schema.sql + seed.sql (yang dipakai)
└── web/                         <- aplikasi React (Vite + TS + Tailwind)
    ├── src/lib/                 <- api client (fetch), types, constants, config
    ├── src/components/          <- komponen UI bersama
    ├── src/context/             <- AuthContext (JWT + role)
    ├── src/features/            <- auth, mandor, admin
    ├── src/layouts/             <- layout mandor & admin (mobile-first)
    └── src/App.tsx              <- routing + proteksi role
```

## 4. Otorisasi (pengganti RLS)

Kebijakan diterapkan di backend (`server/src/routes/produksi.js`):

| Aksi | Mandor | Admin |
| --- | --- | --- |
| Master data (pekerja, model, ukuran, PO) | baca saja (yang aktif) | CRUD |
| Simpan produksi | boleh (otomatis `created_by` = id mandor) | boleh |
| Lihat produksi | hanya punya sendiri | semua |
| Edit/hapus produksi | **hanya tanggal hari ini & miliknya** | **kapan saja** |

## 5. Catatan Penting

- **Snapshot harga**: `produksi_detail.ongkos_kerja_saat_ini` diisi dari `tipe_sepatu.ongkos_kerja` saat insert. Mengubah harga master tidak merusak riwayat gaji.
- **Periode gaji**: view `v_rekap_gaji` mengelompokkan otomatis `1–15` dan `16–akhir bulan`.
- **Ukuran fleksibel**: lewat `master_ukuran` + `produksi_detail` — tidak ada kolom `size_36..size_44` statis.
- **Akun uji**: `admin/admin123` dan `mandor/mandor123` (dari `seed.sql`).
