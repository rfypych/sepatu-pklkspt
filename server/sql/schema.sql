-- ============================================================================
-- SKEMA DATABASE — Sistem Produksi & Upah Borongan Pabrik Sepatu
-- MySQL 8.x (Laragon) — user root tanpa password
-- ============================================================================

CREATE DATABASE IF NOT EXISTS sepatu
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sepatu;

-- ----------------------------------------------------------------------------
-- 1. USERS (akun login)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,             -- bcrypt hash
  role          ENUM('admin','mandor') NOT NULL,
  nama          VARCHAR(100) NOT NULL,
  status_aktif  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. PEKERJA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pekerja (
  id_pekerja   INT AUTO_INCREMENT PRIMARY KEY,
  nama         VARCHAR(100) NOT NULL,
  status_aktif TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. TIPE SEPATU (model + ongkos kerja per pasang)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipe_sepatu (
  id_sepatu    INT AUTO_INCREMENT PRIMARY KEY,
  nama_model   VARCHAR(100)  NOT NULL UNIQUE,
  ongkos_kerja DECIMAL(12,2) NOT NULL DEFAULT 0,
  status_aktif TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. MASTER UKURAN (fleksibel)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_ukuran (
  id_ukuran    INT AUTO_INCREMENT PRIMARY KEY,
  label_ukuran VARCHAR(10) NOT NULL UNIQUE,
  urutan       INT         NOT NULL DEFAULT 0,
  status_aktif TINYINT(1)  NOT NULL DEFAULT 1
);

-- ----------------------------------------------------------------------------
-- 4b. MASTER PO (surat perintah kerja)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_po (
  id_po           INT AUTO_INCREMENT PRIMARY KEY,
  no_po           VARCHAR(50) NOT NULL UNIQUE,
  nama_customer   VARCHAR(100) NULL,
  tanggal_mulai   DATE NULL,
  tanggal_selesai DATE NULL,
  target_qty      INT NOT NULL DEFAULT 0,   -- target pasang dari qty PO customer
  catatan         TEXT NULL,
  status_aktif    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. PRODUKSI_HARIAN (header)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produksi_harian (
  id_produksi INT AUTO_INCREMENT PRIMARY KEY,
  tanggal     DATE       NOT NULL,
  shift       TINYINT    NOT NULL CHECK (shift IN (1,2)),
  id_pekerja  INT        NOT NULL,
  id_sepatu   INT        NOT NULL,
  id_po       INT        NULL,
  catatan     TEXT       NULL,
  created_by  INT        NULL,
  created_at  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ph_pekerja FOREIGN KEY (id_pekerja) REFERENCES pekerja(id_pekerja),
  CONSTRAINT fk_ph_sepatu  FOREIGN KEY (id_sepatu)  REFERENCES tipe_sepatu(id_sepatu),
  CONSTRAINT fk_ph_po      FOREIGN KEY (id_po)      REFERENCES master_po(id_po)
    ON DELETE SET NULL,
  CONSTRAINT fk_ph_user    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ----------------------------------------------------------------------------
-- 6. PRODUKSI_DETAIL (child per ukuran)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produksi_detail (
  id_detail             INT AUTO_INCREMENT PRIMARY KEY,
  id_produksi           INT          NOT NULL,
  id_ukuran             INT          NOT NULL,
  qty                   INT          NOT NULL DEFAULT 0,
  ongkos_kerja_saat_ini DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_pd_produksi FOREIGN KEY (id_produksi) REFERENCES produksi_harian(id_produksi)
    ON DELETE CASCADE,
  CONSTRAINT fk_pd_ukuran  FOREIGN KEY (id_ukuran) REFERENCES master_ukuran(id_ukuran),
  UNIQUE KEY uq_pd (id_produksi, id_ukuran)
);

-- ============================================================================
-- INDEX
-- ============================================================================
CREATE INDEX idx_ph_tanggal ON produksi_harian (tanggal);
CREATE INDEX idx_ph_pekerja ON produksi_harian (id_pekerja);
CREATE INDEX idx_ph_sepatu  ON produksi_harian (id_sepatu);
CREATE INDEX idx_ph_po      ON produksi_harian (id_po);

-- ============================================================================
-- VIEW 1: TOTAL per produksi
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
GROUP BY ph.id_produksi, p.nama, ts.nama_model, ts.ongkos_kerja, ph.created_by, ph.created_at;

-- ============================================================================
-- VIEW 2: REKAP GAJI (periode otomatis 1-15 / 16-akhir)
-- ============================================================================
CREATE OR REPLACE VIEW v_rekap_gaji AS
SELECT
  CONCAT(DATE_FORMAT(ph.tanggal, '%Y-%m'), '-',
         IF(DAY(ph.tanggal) <= 15, '1', '2')) AS periode,
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
GROUP BY periode, ph.id_pekerja, p.nama, ph.id_sepatu, ts.nama_model;
