-- ============================================================================
-- SEED DATA — data awal untuk uji coba (PostgreSQL / Neon)
-- Akun default:
--   admin : admin123  (role admin)
--   mandor: mandor123 (role mandor)
-- ============================================================================

INSERT INTO users (username, password_hash, role, nama, switch_group) VALUES
  ('admin',  '$2b$10$kzyaRpNC9Ww9vd.1fjTZou4BI9zyE.BgfVDQWyYP9fM7Y4p5Or8kG', 'admin',  'Si A', 1),
  ('mandor', '$2b$10$GoVBoHR6Xf/fPV/PgsN0XedQiI37tvTmI6ymP0lovCXUN3gnNPxN6', 'mandor', 'Pak Mandor', 1);

INSERT INTO pekerja (nama) VALUES
  ('Pramono'), ('Slamet'), ('Wahyu'), ('Joko'), ('Agus');

INSERT INTO tipe_sepatu (nama_model, ongkos_kerja) VALUES
  ('Futsal',       1000),
  ('Brickmansion', 1200),
  ('Onrush',       1100),
  ('Superstars',   1500);

INSERT INTO master_ukuran (label_ukuran, urutan) VALUES
  ('36', 1), ('37', 2), ('38', 3), ('39', 4), ('40', 5),
  ('41', 6), ('42', 7), ('43', 8), ('44', 9);

INSERT INTO master_po (no_po, nama_customer, target_qty) VALUES
  ('PO-2026-001', 'Toko Sentral',      1200),
  ('PO-2026-002', 'Distributor Jaya',  800);
