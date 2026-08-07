# Arsitektur & Tech Stack

> **Update (2026-08)**: stack berubah dari Supabase → **lokal (MySQL Laragon)** → sekarang **Vercel + Neon (Postgres)**. Backend & frontend di-deploy ke Vercel, database di Neon (serverless Postgres). Arsitektur lama (MySQL Laragon) masih tersedia sebagai arsip di `server/sql/schema.sql` & `server/sql/seed.sql`.

## 1. Keputusan Teknologi

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| **Frontend** | React + Vite + TypeScript | UI berbasis komponen, cocok untuk wizard form mandor & dashboard admin; build cepat. |
| **UI Library** | Tailwind CSS | Cepat bikin UI besar-tombol mobile-first tanpa bolak-balik bikin CSS manual. |
| **Backend** | Node.js + Express + JWT | API sederhana, auth pakai JWT (username + password + role). |
| **Database** | PostgreSQL (Neon serverless) | Tidak perlu kelola server; aman dari risiko VPS down/reset. |
| **Hosting** | Vercel (frontend + backend serverless) | Deploy otomatis dari GitHub, domain gratis vercel.app, tanpa kelola server. |
| **Mobile** | Web-app dioptimasi HP → bungkus WebView (APK kecil) | Baik mandor **maupun admin (Si A)** akses lewat HP. Tidak perlu Android native, cepat & ringan. |

### Struktur folder sekarang

```
sepatu-pklkspt/
├── docs/                        <- dokumentasi & skema (arsip)
├── server/                      <- API (Node + Express + PostgreSQL)
│   ├── src/
│   │   ├── app.js               <- build Express app (export untuk Vercel)
│   │   ├── index.js             <- entrypoint dev lokal (listen)
│   │   ├── db.js                <- koneksi pg pool (Neon)
│   │   ├── auth.js              <- JWT sign/verify + guard role
│   │   ├── store.js             <- query dasar master data
│   │   └── routes/              <- auth, master, produksi, payroll, dashboard
│   ├── api/index.js             <- entry serverless Vercel (export app)
│   ├── vercel.json              <- routes /api/* → serverless function
│   └── sql/
│       ├── pg-schema.sql        <- skema PostgreSQL (produksi/Neon) ✅ dipakai
│       ├── pg-seed.sql          <- data awal (admin/admin123, mandor/mandor123) ✅ dipakai
│       ├── schema.sql           <- skema MySQL (arsip dev lokal lama)
│       └── seed.sql             <- seed MySQL (arsip dev lokal lama)
└── web/                         <- aplikasi React (Vite + TS + Tailwind)
```

### Cara menjalankan lokal (dev)

1. Siapkan database Postgres (bisa Neon). Jalankan sekali:
   ```
   psql $DATABASE_URL < server/sql/pg-schema.sql
   psql $DATABASE_URL < server/sql/pg-seed.sql
   ```
2. Jalankan API (set `DATABASE_URL`):
   ```
   cd server && npm install && npm run dev    # http://localhost:3000
   ```
3. Jalankan frontend:
   ```
   cd web && npm install && npm run dev       # http://localhost:5173
   ```
   Vite dev server me-*proxy* `/api` → `localhost:3000`, jadi dari browser tidak perlu ubah URL.
4. Login uji: `admin/admin123` (admin) atau `mandor/mandor123` (mandor).

### Cara deploy (Vercel + Neon)

- **Database**: buat project di Neon → ambil connection string (`DATABASE_URL`).
- **Backend**: project Vercel dengan root `server/`. Set env `DATABASE_URL` & `JWT_SECRET`. `vercel.json` sudah mengarahkan `/api/*` ke `api/index.js`.
- **Frontend**: project Vercel dengan root `web/`. Set env `VITE_API_URL` = URL backend (mis. `https://xxx.vercel.app/api`). Build Vite menghasilkan static; nantinya frontend & backend bisa digabung di satu domain lewat Vercel rewrite bila perlu.

## 2. Alur Data

```
Mandor / Admin (HP/PC)          Vercel (Express serverless)      Neon (Postgres)
-----------------------         --------------------------       ----------------
Login ─────────────────────►  POST /api/auth/login ──► verifikasi bcrypt → JWT
Wizard input ───────────────►  POST /api/produksi ────► insert header + detail (snapshot ongkos)
Dashboard (polling 5 dtk) ──►  GET /api/dashboard/today
Payroll ────────────────────►  GET /api/payroll/rekap?periode=...
Data Produksi edit ─────────►  PUT/DELETE /api/produksi/:id ──► (mandor dibatasi tanggal hari ini)
```

## 3. Struktur Folder (web)

```
web/
├── src/lib/                 <- api client (fetch), types, constants, config
├── src/components/          <- komponen UI bersama (Card, ViewToggle, Tabel)
├── src/context/             <- AuthContext (JWT + role)
├── src/features/            <- auth, mandor, admin
├── src/layouts/             <- layout mandor & admin (mobile-first)
└── src/App.tsx              <- routing + proteksi role
```

## 4. Otorisasi

Kebijakan diterapkan di backend (`server/src/routes/produksi.js`):

| Aksi | Mandor | Admin |
| --- | --- | --- |
| Master data (pekerja, model, ukuran, PO) | baca saja (yang aktif) | CRUD |
| Simpan produksi | boleh (otomatis `created_by` = id mandor) | boleh |
| Lihat produksi | **semua data tanggal hari ini** (tanpa pemisahan) | semua |
| Edit/hapus produksi | **hanya data tanggal hari ini** | **kapan saja** |

## 5. Catatan Penting

- **Snapshot harga**: `produksi_detail.ongkos_kerja_saat_ini` diisi dari `tipe_sepatu.ongkos_kerja` saat insert. Mengubah harga master tidak merusak riwayat gaji.
- **Periode gaji**: view `v_rekap_gaji` mengelompokkan otomatis `1–15` dan `16–akhir bulan`.
- **Ukuran fleksibel**: lewat `master_ukuran` + `produksi_detail` — tidak ada kolom `size_36..size_44` statis.
- **Akun uji**: `admin/admin123` dan `mandor/mandor123` (dari `pg-seed.sql`).
- **Perbedaan driver MySQL vs PG**: driver `pg` memakai placeholder `$1,$2,...` dan `RETURNING id` untuk insert; kolom `DATE` dan `NUMERIC` dikembalikan sebagai string (sama seperti `dateStrings:true` di mysql2), jadi `web/src/lib/api.ts` (`toNum`) tetap berfungsi tanpa perubahan.
