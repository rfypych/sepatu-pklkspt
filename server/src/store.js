import pool from './db.js'

export async function findUserByUsername(username) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? LIMIT 1',
    [username],
  )
  return rows[0] ?? null
}

export async function findUserById(id) {
  const [rows] = await pool.query(
    'SELECT id, username, role, nama, status_aktif FROM users WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] ?? null
}

export async function listPekerja(aktifOnly = false) {
  let sql = 'SELECT * FROM pekerja'
  if (aktifOnly) sql += ' WHERE status_aktif = 1'
  sql += ' ORDER BY nama'
  const [rows] = await pool.query(sql)
  return rows
}

export async function listTipeSepatu(aktifOnly = false) {
  let sql = 'SELECT * FROM tipe_sepatu'
  if (aktifOnly) sql += ' WHERE status_aktif = 1'
  sql += ' ORDER BY nama_model'
  const [rows] = await pool.query(sql)
  return rows
}

export async function listUkuran(aktifOnly = false) {
  let sql = 'SELECT * FROM master_ukuran'
  if (aktifOnly) sql += ' WHERE status_aktif = 1'
  sql += ' ORDER BY urutan'
  const [rows] = await pool.query(sql)
  return rows
}

export async function listPo(aktifOnly = false) {
  let sql = 'SELECT * FROM master_po'
  if (aktifOnly) sql += ' WHERE status_aktif = 1'
  sql += ' ORDER BY no_po'
  const [rows] = await pool.query(sql)
  return rows
}