-- Migrasi: target qty PO (pasang) + data contoh
ALTER TABLE master_po ADD COLUMN IF NOT EXISTS target_qty INTEGER NOT NULL DEFAULT 0;

UPDATE master_po SET target_qty = 1200 WHERE no_po = 'PO-2026-001' AND target_qty = 0;
UPDATE master_po SET target_qty = 800  WHERE no_po = 'PO-2026-002' AND target_qty = 0;
