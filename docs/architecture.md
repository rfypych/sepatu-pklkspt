# Arsitektur & Tech Stack

## 1. Keputusan Teknologi

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| **Frontend** | React + Vite + TypeScript | UI berbasis komponen, cocok untuk wizard form mandor & dashboard admin; build cepat. |
| **UI Library** | Tailwind CSS | Cepat bikin UI besar-tombol mobile-first tanpa bolak-balik bikin CSS manual. |
| **Backend / Database** | Supabase (PostgreSQL + Auth + Realtime + Storage) | BaaS: API otomatis dari tabel, login siap pakai, realtime utk dashboard live, hemat waktu tanpa bikin backend sendiri. |
| **Hosting Frontend** | Vercel / Netlify | Deploy 1 klik utk SPA React. |
| **Mobile Mandor** | Web-app dioptimasi HP → bungkus WebView (APK kecil) | Tidak perlu bikin Android native, cepat & ringan di HP gaptek. |

### Kenapa bukan monolith server penuh?
Sistem ini domain-nya kecil (input data + kalkulasi). Supabase sudah menutup kebutuhan auth, API, realtime, dan RLS (Row Level Security). Artinya hampir tidak ada backend custom → lebih cepat selesai dan lebih murah maintenance.

## 2. Alur Data

```
Mandor (HP)                    Supabase                     Admin Si A (PC)
-------------                  --------                     -------------
Login ───────────────────►  auth (username/password)
Wizard input ─────────────►  POST /produksi_harian          Dashboard Live ◄── Realtime
                          ◄── RETURNING id_produksi             │
Simpan detail ───────────►  POST /produksi_detail              │
                          ◄── snapshot ongkos_kerja            │
                                                               │
                          Payroll: SELECT v_rekap_gaji ────────┘
```

## 3. Struktur Folder (monorepo sederhana)

```
sepatu-pklkspt/
├── docs/                        <- dokumentasi & skema (sudah ada)
├── web/                         <- aplikasi React (Vite + TS + Tailwind)
│   ├── src/
│   │   ├── lib/                 <- supabase client, util, konstan (SHIFT, PERIODE)
│   │   ├── components/          <- komponen UI bersama
│   │   ├── features/
│   │   │   ├── auth/            <- login admin & mandor
│   │   │   ├── mandor/          <- wizard input, riwayat hari ini
│   │   │   └── admin/           <- dashboard, payroll, master data
│   │   ├── layouts/             <- layout mobile (mandor) vs desktop (admin)
│   │   └── pages/               <- routing
│   ├── supabase/
│   │   └── migrations/          <- file SQL (mulai dari docs/database-schema.sql)
│   ├── package.json
│   └── vite.config.ts
└── mobile/                      <- (opsional) project WebView utk APK mandor
```

## 4. RLS (Row Level Security) — Garis Besar

Supabase mewajibkan kebijakan keamanan per tabel. Rencana awal:

| Tabel | Mandor | Admin |
| --- | --- | --- |
| `pekerja`, `tipe_sepatu`, `master_ukuran` | `SELECT` (yang aktif) | `SELECT/INSERT/UPDATE/DELETE` |
| `produksi_harian`, `produksi_detail` | `INSERT` + `SELECT` (hanya punya sendiri `created_by`) + `UPDATE/DELETE` data hari ini milik sendiri | `SELECT` semua |

> Detail RLS akan disempurnakan saat implementasi.

## 5. Catatan Penting

- **Snapshot harga**: kolom `produksi_detail.ongkos_kerja_saat_ini` diisi dari `tipe_sepatu.ongkos_kerja` saat insert (lihat contoh query B di `database-schema.sql`). Ini menjamin perubahan harga tidak merusak riwayat.
- **Periode gaji**: pakai fungsi `f_periode_gaji(tanggal)` → otomatis mengelompokkan 1–15 dan 16–akhir bulan.
- **Ukuran fleksibel**: semua lewat `master_ukuran` + `produksi_detail`, tidak ada kolom `size_36..size_44` statis.
