-- ============================================================================
-- SKEMA DATABASE — Sistem Produksi & Upah Borongan Pabrik Sepatu
-- Target: PostgreSQL (kompatibel dengan Supabase)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USERS (akun login aplikasi; admin & mandor)
--    Catatan: Supabase biasanya pakai `auth.users` bawaan. Tabel ini opsional,
--    dipakai kalau login dikelola manual (username+password sendiri).
-- ----------------------------------------------------------------------------
create table public.users (
    id          uuid primary key default gen_random_uuid(),
    username    text unique not null,
    password    text not null,               -- simpan HASH (bcrypt), jangan plaintext
    role        text not null check (role in ('admin', 'mandor')),
    nama        text not null,
    status_aktif boolean not null default true,
    created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. PEKERJA (karyawan pabrik yang dicatat hasilnya)
-- ----------------------------------------------------------------------------
create table public.pekerja (
    id_pekerja  uuid primary key default gen_random_uuid(),
    nama        text not null,
    status_aktif boolean not null default true,
    created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. TIPE SEPATU (model + ongkos kerja per pasang)
--    ongkos_kerja bisa berubah-ubah; perubahan hanya berlaku utk data baru
--    (histori harga disimpan di produksi_detail.ongkos_kerja_saat_ini).
-- ----------------------------------------------------------------------------
create table public.tipe_sepatu (
    id_sepatu   uuid primary key default gen_random_uuid(),
    nama_model  text unique not null,        -- Futsal, Brickmansion, Onrush, Superstars
    ongkos_kerja numeric(12,2) not null default 0,  -- Rp per pasang
    status_aktif boolean not null default true,
    created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. MASTER UKURAN (fleksibel: bisa tambah 45, 46, dst tanpa alter table)
--    urutan dipakai untuk mengurutkan tampilan di form mandor.
-- ----------------------------------------------------------------------------
create table public.master_ukuran (
    id_ukuran   uuid primary key default gen_random_uuid(),
    label_ukuran text not null,              -- '36', '37', '38', ...
    urutan      integer not null default 0,
    status_aktif boolean not null default true,
    unique (label_ukuran)
);

-- ----------------------------------------------------------------------------
-- 4b. MASTER PO (Surat Perintah Kerja / produksi order)
--     Fleksibel: Si A bisa tambah/edit/hapus PO tanpa mengubah data produksi.
--     Ganti nama PO pun aman karena produksi mereferensikan id_po (bukan teks).
-- ----------------------------------------------------------------------------
create table public.master_po (
    id_po        uuid primary key default gen_random_uuid(),
    no_po        text not null,               -- e.g. 'PO-2026-001'
    nama_customer text,                       -- opsional
    tanggal_mulai date,
    tanggal_selesai date,
    catatan      text,
    status_aktif boolean not null default true,
    created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. PRODUKSI_HARIAN (header / satu baris pencatatan mandor)
-- ----------------------------------------------------------------------------
create table public.produksi_harian (
    id_produksi uuid primary key default gen_random_uuid(),
    tanggal     date not null,               -- tanggal produksi (bukan tanggal input)
    shift       smallint not null check (shift in (1, 2)),
    id_pekerja  uuid not null references public.pekerja(id_pekerja),
    id_sepatu   uuid not null references public.tipe_sepatu(id_sepatu),
    id_po       uuid references public.master_po(id_po) on delete set null, -- opsional
    catatan     text,
    created_by  uuid references public.users(id),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. PRODUKSI_DETAIL (child: satu baris per ukuran)
--    Struktur ini membuat ukuran fleksibel tanpa alter table.
--    ongkos_kerja_saat_ini = snapshot harga pas per pasang saat data diinput.
-- ----------------------------------------------------------------------------
create table public.produksi_detail (
    id_detail     uuid primary key default gen_random_uuid(),
    id_produksi   uuid not null references public.produksi_harian(id_produksi) on delete cascade,
    id_ukuran     uuid not null references public.master_ukuran(id_ukuran),
    qty           integer not null default 0 check (qty >= 0),
    ongkos_kerja_saat_ini numeric(12,2) not null default 0,
    unique (id_produksi, id_ukuran)          -- satu ukuran maksimal 1x per header
);

-- ============================================================================
-- INDEX
-- ============================================================================
create index idx_produksi_tanggal  on public.produksi_harian (tanggal);
create index idx_produksi_pekerja  on public.produksi_harian (id_pekerja);
create index idx_produksi_sepatu   on public.produksi_harian (id_sepatu);
create index idx_produksi_po       on public.produksi_harian (id_po);
create index idx_detail_produksi   on public.produksi_detail (id_produksi);

-- ============================================================================
-- VIEW 1: TOTAL QTY + SUBTOTAL per header
-- ============================================================================
create or replace view public.v_total_per_produksi as
select
    ph.id_produksi,
    ph.tanggal,
    ph.shift,
    ph.id_pekerja,
    p.nama as nama_pekerja,
    ph.id_sepatu,
    ts.nama_model,
    ts.ongkos_kerja as ongkos_master_sekarang,
    coalesce(sum(pd.qty), 0) as total_pasang,
    coalesce(sum(pd.qty * pd.ongkos_kerja_saat_ini), 0) as subtotal_gaji
from public.produksi_harian ph
join public.pekerja p      on p.id_pekerja  = ph.id_pekerja
join public.tipe_sepatu ts on ts.id_sepatu  = ph.id_sepatu
left join public.produksi_detail pd on pd.id_produksi = ph.id_produksi
group by ph.id_produksi, p.nama, ts.nama_model, ts.ongkos_kerja;

-- ============================================================================
-- VIEW 2: REKAP GAJI PER PEKERJA
--    periode otomatis: 1-15 dan 16-akhir bulan
--    pakai fungsi f_periode_gaji(any_date) utk menandai periode
-- ============================================================================
create or replace function public.f_periode_gaji(tgl date)
returns text language sql immutable as $$
    select case
        when extract(day from tgl) <= 15
             then to_char(date_trunc('month', tgl), 'YYYY-MM') || '-1'   -- 1-15
        else to_char(date_trunc('month', tgl), 'YYYY-MM') || '-2'        -- 16-akhir
    end;
$$;

-- Rekap per pekerja per periode:
--   Nama Pekerja | Total Pasang | Total Gaji (untuk periode & bulan tertentu)
--   (baris dipisah per model supaya Si A bisa lihat rincian per model)
create or replace view public.v_rekap_gaji as
select
    f_periode_gaji(ph.tanggal) as periode,
    ph.id_pekerja,
    p.nama as nama_pekerja,
    ph.id_sepatu,
    ts.nama_model,
    sum(pd.qty) as total_pasang,
    sum(pd.qty * pd.ongkos_kerja_saat_ini) as total_gaji
from public.produksi_harian ph
join public.pekerja p      on p.id_pekerja  = ph.id_pekerja
join public.tipe_sepatu ts on ts.id_sepatu  = ph.id_sepatu
join public.produksi_detail pd on pd.id_produksi = ph.id_produksi
group by 1, 2, 3, 4, 5;

-- ============================================================================
-- CONTOH QUERY yang dipakai aplikasi
-- ============================================================================

-- A) Form mandor: daftar ukuran aktif (urut sesuai urutan)
-- select * from public.master_ukuran where status_aktif = true order by urutan;

-- B) Input mandor: simpan header lalu detail (contoh qty per ukuran)
-- insert into public.produksi_harian (tanggal, shift, id_pekerja, id_sepatu, created_by)
-- values ('2026-08-04', 1, :id_pekerja, :id_sepatu, :id_user)
-- returning id_produksi;

-- insert into public.produksi_detail (id_produksi, id_ukuran, qty, ongkos_kerja_saat_ini)
-- select :id_produksi, mu.id_ukuran, :qty_ukuran, ts.ongkos_kerja
-- from public.master_ukuran mu
-- cross join public.tipe_sepatu ts
-- where ts.id_sepatu = :id_sepatu and mu.id_ukuran = :id_ukuran;

-- C) Payroll Si A: rekap gaji periode 1-15 bulan Agustus 2026
-- select * from public.v_rekap_gaji
-- where periode = '2026-08-1';

-- D) Payroll Si A: rekap lengkap dengan GRAND TOTAL per pekerja
-- select id_pekerja, nama_pekerja,
--        sum(total_pasang) as total_pasang,
--        sum(total_gaji)   as total_gaji
-- from public.v_rekap_gaji
-- where periode = '2026-08-1'
-- group by id_pekerja, nama_pekerja
-- order by nama_pekerja;

-- E) Dashboard: produksi hari ini (live)
-- select * from public.v_total_per_produksi
-- where tanggal = current_date order by created_at desc;

-- F) Monitoring: rekap per pekerja per shift (untuk admin lihat aktivitas mandor)
-- select tanggal, shift, id_pekerja, nama_pekerja, id_sepatu, nama_model,
--        total_pasang, subtotal_gaji, created_at
-- from public.v_total_per_produksi
-- order by tanggal desc, shift;

-- ============================================================================
-- JAMINAN FLEKSIBILITAS (semua bisa diubah Si A tanpa bongkar kode)
-- ============================================================================
--  1. Ongkos kerja  -> tipe_sepatu.ongkos_kerja bisa diedit kapan saja.
--     Perubahan hanya berlaku utk input baru (histori aman via
--     produksi_detail.ongkos_kerja_saat_ini).
--  2. Model sepatu  -> tambah/edit/nonaktifkan lewat tipe_sepatu.
--     Jumlah item tidak statis (bukan cuma 4 model).
--  3. Ukuran        -> master_ukuran bisa tambah (45, 46, ...) / nonaktifkan.
--     Ukuran dihapus (soft) tidak menghapus data produksi lama karena
--     produksi_detail menyimpan id_ukuran.
--  4. Nama pekerja  -> pekerja.nama bisa diedit; aman karena produksi
--     mereferensikan id_pekerja (uuid), bukan nama.
--  5. PO            -> master_po bisa tambah/edit/hapus; produksi menyimpan
--     id_po (uuid), jadi ganti no_po tidak mengubah data produksi.
--  6. Shift & periode gaji -> konstanta bisnis (2 shift, 1-15 / 16-akhir);
--     hanya berubah lewat perubahan kode/konfigurasi, bukan via UI.
-- ============================================================================

-- ============================================================================
-- (Opsional) REALTIME / SUPABASE
--   Aktifkan realtime utk tabel produksi_harian & produksi_detail supaya
--   dashboard admin update otomatis saat mandor menyimpan data:
--     alter publication supabase_realtime add table public.produksi_harian;
--     alter publication supabase_realtime add table public.produksi_detail;
-- ============================================================================
