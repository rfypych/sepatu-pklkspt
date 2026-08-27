import pool from './db.js'

export async function findUserByUsername(username) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE username = $1 LIMIT 1',
    [username],
  )
  return rows[0] ?? null
}

export async function findUserById(id) {
  const { rows } = await pool.query(
    'SELECT id, username, role, nama, status_aktif, switch_group FROM users WHERE id = $1 LIMIT 1',
    [id],
  )
  return rows[0] ?? null
}

export async function findUserByGroupAndRole(switchGroup, role) {
  const { rows } = await pool.query(
    `SELECT id, username, role, nama, status_aktif, switch_group
     FROM users
     WHERE switch_group = $1 AND role = $2 AND status_aktif = 1
     ORDER BY id LIMIT 1`,
    [switchGroup, role],
  )
  return rows[0] ?? null
}

export async function listPekerja(aktifOnly = false) {
  let sql = 'SELECT * FROM pekerja'
  if (aktifOnly) sql += ' WHERE status_aktif = 1'
  sql += ' ORDER BY nama'
  const { rows } = await pool.query(sql)
  return rows
}

export async function listTipeSepatu(aktifOnly = false) {
  let sql = 'SELECT * FROM tipe_sepatu'
  if (aktifOnly) sql += ' WHERE status_aktif = 1'
  sql += ' ORDER BY nama_model'
  const { rows } = await pool.query(sql)
  return rows
}

export async function listUkuran(aktifOnly = false) {
  let sql = 'SELECT * FROM master_ukuran'
  if (aktifOnly) sql += ' WHERE status_aktif = 1'
  sql += ` ORDER BY 
    CASE WHEN label_ukuran ~ '^[0-9]+$' THEN label_ukuran::int ELSE 99999 END ASC,
    urutan ASC,
    label_ukuran ASC`
  const { rows } = await pool.query(sql)
  return rows
}

export async function listPo(aktifOnly = false) {
  // achieved_qty = total pasang yang sudah dicatat untuk PO tsb (akumulasi semua tanggal)
  let sql = `
    SELECT mp.*,
      COALESCE((
        SELECT SUM(pd.qty)
        FROM produksi_detail pd
        JOIN produksi_harian ph ON ph.id_produksi = pd.id_produksi
        WHERE ph.id_po = mp.id_po
      ), 0) AS achieved_qty
    FROM master_po mp
  `
  if (aktifOnly) sql += ' WHERE mp.status_aktif = 1'
  sql += ' ORDER BY mp.no_po'
  const { rows } = await pool.query(sql)
  return rows
}
