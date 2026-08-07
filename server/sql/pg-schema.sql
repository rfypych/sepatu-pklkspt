-- ============================================================================
-- SKEMA DATABASE — Sistem Produksi & Upah Borongan Pabrik Sepatu
-- Target: PostgreSQL (Neon, serverless) — dijalankan via psql / Neon SQL editor
-- Catatan: skema MySQL (server/sql/schema.sql) tetap ada untuk dev lokal Laragon.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USERS (akun login)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,             -- bcrypt hash
  role          VARCHAR(10)  NOT NULL CHECK (role IN ('admin','mandor')),
  nama          VARCHAR(100) NOT NULL,
  status_aktif  SMALLINT     NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. PEKERJA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pekerja (
  id_pekerja   SERIAL PRIMARY KEY,
  nama         VARCHAR(100) NOT NULL,
  status_aktif SMALLINT     NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. TIPE SEPATU (model + ongkos kerja per pasang)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipe_sepatu (
  id_sepatu    SERIAL PRIMARY KEY,
  nama_model   VARCHAR(100)  NOT NULL UNIQUE,
  ongkos_kerja NUMERIC(12,2) NOT NULL DEFAULT 0,
  status_aktif SMALLINT      NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. MASTER UKURAN (fleksibel)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_ukuran (
  id_ukuran    SERIAL PRIMARY KEY,
  label_ukuran VARCHAR(10) NOT NULL UNIQUE,
  urutan       INTEGER     NOT NULL DEFAULT 0,
  status_aktif SMALLINT    NOT NULL DEFAULT 1
);

-- ----------------------------------------------------------------------------
-- 4b. MASTER PO (surat perintah kerja)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_po (
  id_po           SERIAL PRIMARY KEY,
  no_po           VARCHAR(50) NOT NULL UNIQUE,
  nama_customer   VARCHAR(100),
  tanggal_mulai   DATE,
  tanggal_selesai DATE,
  target_qty      INTEGER     NOT NULL DEFAULT 0,   -- target pasang dari qty PO customer
  catatan         TEXT,
  status_aktif    SMALLINT    NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. PRODUKSI_HARIAN (header)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produksi_harian (
  id_produksi SERIAL PRIMARY KEY,
  tanggal     DATE        NOT NULL,
  shift       SMALLINT    NOT NULL CHECK (shift IN (1,2)),
  id_pekerja  INTEGER     NOT NULL,
  id_sepatu   INTEGER     NOT NULL,
  id_po       INTEGER,
  catatan     TEXT,
  created_by  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_ph_pekerja FOREIGN KEY (id_pekerja) REFERENCES pekerja(id_pekerja),
  CONSTRAINT fk_ph_sepatu  FOREIGN KEY (id_sepatu)  REFERENCES tipe_sepatu(id_sepatu),
  CONSTRAINT fk_ph_po      FOREIGN KEY (id_po)      REFERENCES master_po(id_po) ON DELETE SET NULL,
  CONSTRAINT fk_ph_user    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ----------------------------------------------------------------------------
-- 6. PRODUKSI_DETAIL (child per ukuran)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produksi_detail (
  id_detail             SERIAL PRIMARY KEY,
  id_produksi           INTEGER      NOT NULL,
  id_ukuran             INTEGER      NOT NULL,
  qty                   INTEGER      NOT NULL DEFAULT 0,
  ongkos_kerja_saat_ini NUMERIC(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_pd_produksi FOREIGN KEY (id_produksi) REFERENCES produksi_harian(id_produksi) ON DELETE CASCADE,
  CONSTRAINT fk_pd_ukuran  FOREIGN KEY (id_ukuran) REFERENCES master_ukuran(id_ukuran),
  UNIQUE (id_produksi, id_ukuran)
);

-- ============================================================================
-- INDEX
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ph_tanggal ON produksi_harian (tanggal);
CREATE INDEX IF NOT EXISTS idx_ph_pekerja ON produksi_harian (id_pekerja);
CREATE INDEX IF NOT EXISTS idx_ph_sepatu  ON produksi_harian (id_sepatu);
CREATE INDEX IF NOT EXISTS idx_ph_po      ON produksi_harian (id_po);

-- ============================================================================
-- VIEW 1: TOTAL per produksi (dipakai dashboard & list)
-- ============================================================================
CREATE OR REPLACE VIEW v_total_per_produksi AS
SELECT
  ph.id_produksi,
  ph.tanggal,
  ph.shift,
  ph.id_pekerja,
  p.nama AS nama_pekerja,
  ph.id_sepatu,
  ts.nama_model,
  ts.ongkos_kerja AS ongkos_master_sekarang,
  COALESCE(SUM(pd.qty), 0) AS total_pasang,
  COALESCE(SUM(pd.qty * pd.ongkos_kerja_saat_ini), 0) AS subtotal_gaji,
  ph.created_by,
  ph.created_at
FROM produksi_harian ph
JOIN pekerja p        ON p.id_pekerja = ph.id_pekerja
JOIN tipe_sepatu ts   ON ts.id_sepatu = ph.id_sepatu
LEFT JOIN produksi_detail pd ON pd.id_produksi = ph.id_produksi
GROUP BY ph.id_produksi, ph.tanggal, ph.shift, ph.id_pekerja, p.nama,
         ph.id_sepatu, ts.nama_model, ts.ongkos_kerja, ph.created_by, ph.created_at;

-- ============================================================================
-- VIEW 2: REKAP GAJI (periode otomatis 1-15 / 16-akhir)
-- ============================================================================
CREATE OR REPLACE VIEW v_rekap_gaji AS
SELECT
  to_char(ph.tanggal, 'YYYY-MM') || '-' ||
    CASE WHEN EXTRACT(DAY FROM ph.tanggal) <= 15 THEN '1' ELSE '2' END AS periode,
  ph.id_pekerja,
  p.nama AS nama_pekerja,
  ph.id_sepatu,
  ts.nama_model,
  SUM(pd.qty) AS total_pasang,
  SUM(pd.qty * pd.ongkos_kerja_saat_ini) AS total_gaji
FROM produksi_harian ph
JOIN pekerja p       ON p.id_pekerja = ph.id_pekerja
JOIN tipe_sepatu ts  ON ts.id_sepatu = ph.id_sepatu
JOIN produksi_detail pd ON pd.id_produksi = ph.id_produksi
GROUP BY 1, 2, 3, 4, 5;
