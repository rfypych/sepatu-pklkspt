# Sistem Produksi & Upah Borongan Pabrik Sepatu

Sistem berbasis **web + mobile** untuk mencatat hasil produksi harian karyawan pabrik sepatu (sistem upah borongan / piece-rate) dan mengkalkulasi upah secara otomatis.

**Stack**: React + Vite + TS (frontend) · Node.js + Express + JWT (backend) · PostgreSQL (database).
**Deployment**: Frontend & backend di **Vercel**, database di **Neon** (Postgres serverless).

## Deployed (Produksi)

- Frontend → domain Vercel (vercel.app)
- Backend API → `/api` di Vercel
- Database → Neon (Postgres) via `DATABASE_URL`

## Cara Menjalankan Lokal (Dev)

### 1. Database (PostgreSQL — Neon atau Postgres lokal)

Skema & seed Postgres:
```
psql $DATABASE_URL < server/sql/pg-schema.sql
psql $DATABASE_URL < server/sql/pg-seed.sql
```

> Jika pakai Neon, salin **connection string** dari dashboard Neon (menu Connection → Pooled connection). Set sebagai env `DATABASE_URL`.

### 2. Backend

```
cd server
npm install
$env:DATABASE_URL="postgresql://..."   # atau set di .env
npm run dev                            # port 3000
```

### 3. Frontend

```
cd web
npm install
npm run dev                            # port 5173
```

Vite dev server men-*proxy* `/api` ke `localhost:3000` (lihat `vite.config.ts`), jadi tidak perlu ubah URL.

Login uji: `admin/admin123` (admin) · `mandor/mandor123` (mandor)

## Cara Menjalankan di Vercel (Production)

### Backend

1. Buat project di Vercel (root: `server/`).
2. Set env di dashboard Vercel:
   - `DATABASE_URL` → connection string Neon
   - `JWT_SECRET` → string rahasia acak
3. Deploy. `vercel.json` sudah mengarahkan `/api/*` ke serverless function `api/index.js`.

### Frontend

1. Buat project di Vercel (root: `web/`).
2. Set env `VITE_API_URL` → URL backend Vercel kamu, misal `https://my-sepatu-api.vercel.app/api`.
3. Deploy.

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
| **Master Data** | Si A | Kelola pekerja, model & ongkos kerja, ukuran aktif, PO |
| **Dashboard** | Si A | Monitoring produksi real-time + filter |
| **Payroll** | Si A | Rekap gaji otomatis per periode (1–15 / 16–31), export CSV |

## Struktur Dokumen

```
README.md                     <- ini, gambaran umum + cara jalan
docs/
  requirements.md             <- rincian kebutuhan & aturan bisnis
  database-schema.sql         <- skema PostgreSQL (arsip desain awal)
  architecture.md             <- tech stack & arsitektur
  flows.md                    <- alur kerja (mandor, admin, alur data)
  roadmap.md                  <- milestone implementasi
server/
  sql/pg-schema.sql           <- skema PostgreSQL (produksi/Neon)
  sql/pg-seed.sql             <- data awal + akun uji (produksi)
  sql/schema.sql              <- skema MySQL (arsip dev lokal lama)
  sql/seed.sql                <- seed MySQL (arsip dev lokal lama)
  api/index.js                <- entry serverless Vercel
web/                          <- aplikasi React
```
