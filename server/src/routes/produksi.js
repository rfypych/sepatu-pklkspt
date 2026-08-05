import { Router } from 'express'
import pool from '../db.js'
import { authRequired, attachUser } from '../auth.js'

const router = Router()
router.use(authRequired, attachUser)

function canModify(req) {
  // Mandor hanya boleh ubah data milik sendiri di tanggal hari ini; admin bebas.
  if (req.user.role === 'admin') return true
  const today = new Date().toISOString().slice(0, 10)
  return { createdByOnly: true, today }
}

// Hari ini (mandor: hanya miliknya; admin: semua)
router.get('/hari-ini', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const params = [today]
    let sql = `
      SELECT ph.*, p.nama AS nama_pekerja, ts.nama_model, po.no_po
      FROM produksi_harian ph
      JOIN pekerja p      ON p.id_pekerja = ph.id_pekerja
      JOIN tipe_sepatu ts ON ts.id_sepatu = ph.id_sepatu
      LEFT JOIN master_po po ON po.id_po = ph.id_po
      WHERE ph.tanggal = ?
    `
    if (req.user.role === 'mandor') {
      sql += ' AND ph.created_by = ?'
      params.push(req.user.id)
    }
    sql += ' ORDER BY ph.created_at DESC'
    const [rows] = await pool.query(sql, params)

    for (const r of rows) {
      const [detail] = await pool.query(
        'SELECT * FROM produksi_detail WHERE id_produksi = ? ORDER BY id_ukuran',
        [r.id_produksi],
      )
      r.detail = detail
    }
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// List dengan filter (admin)
router.get('/', async (req, res) => {
  try {
    const { tanggal, pekerja } = req.query
    const params = []
    let sql = `
      SELECT ph.*, p.nama AS nama_pekerja, ts.nama_model, po.no_po
      FROM produksi_harian ph
      JOIN pekerja p      ON p.id_pekerja = ph.id_pekerja
      JOIN tipe_sepatu ts ON ts.id_sepatu = ph.id_sepatu
      LEFT JOIN master_po po ON po.id_po = ph.id_po
      WHERE 1=1
    `
    if (tanggal) {
      sql += ' AND ph.tanggal = ?'
      params.push(tanggal)
    }
    if (pekerja) {
      sql += ' AND ph.id_pekerja = ?'
      params.push(Number(pekerja))
    }
    sql += ' ORDER BY ph.tanggal DESC, ph.shift'
    const [rows] = await pool.query(sql, params)

    for (const r of rows) {
      const [detail] = await pool.query(
        'SELECT * FROM produksi_detail WHERE id_produksi = ? ORDER BY id_ukuran',
        [r.id_produksi],
      )
      r.detail = detail
    }
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Simpan produksi (header + detail + snapshot ongkos)
router.post('/', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { tanggal, shift, id_pekerja, id_sepatu, id_po, qtyPerUkuran } = req.body ?? {}
    if (!tanggal || !shift || !id_pekerja || !id_sepatu || !Array.isArray(qtyPerUkuran)) {
      return res.status(400).json({ error: 'Data tidak lengkap' })
    }

    const [sepatu] = await conn.query('SELECT ongkos_kerja FROM tipe_sepatu WHERE id_sepatu = ?', [Number(id_sepatu)])
    const ongkos = Number(sepatu[0]?.ongkos_kerja ?? 0)

    await conn.beginTransaction()
    const [hdr] = await conn.execute(
      `INSERT INTO produksi_harian (tanggal, shift, id_pekerja, id_sepatu, id_po, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tanggal, Number(shift), Number(id_pekerja), Number(id_sepatu), id_po ? Number(id_po) : null, req.user.id],
    )
    const idProduksi = Number(hdr.insertId)

    for (const d of qtyPerUkuran) {
      const qty = Number(d.qty) || 0
      if (qty <= 0) continue
      await conn.execute(
        'INSERT INTO produksi_detail (id_produksi, id_ukuran, qty, ongkos_kerja_saat_ini) VALUES (?, ?, ?, ?)',
        [idProduksi, Number(d.id_ukuran), qty, ongkos],
      )
    }
    await conn.commit()
    res.json({ id_produksi: idProduksi })
  } catch (e) {
    await conn.rollback()
    res.status(500).json({ error: e.message })
  } finally {
    conn.release()
  }
})

// Ganti detail (edit qty)
router.put('/:id/detail', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { qtyPerUkuran } = req.body ?? {}
    if (!Array.isArray(qtyPerUkuran)) return res.status(400).json({ error: 'Data tidak lengkap' })

    const [row] = await pool.query('SELECT * FROM produksi_harian WHERE id_produksi = ?', [id])
    if (!row[0]) return res.status(404).json({ error: 'Data tidak ditemukan' })

    // batasan: mandor hanya tanggal hari ini & miliknya
    if (req.user.role === 'mandor') {
      const today = new Date().toISOString().slice(0, 10)
      if (row[0].created_by !== req.user.id || row[0].tanggal !== today) {
        return res.status(403).json({ error: 'Mandor hanya bisa mengubah data hari ini miliknya' })
      }
    }

    const [lama] = await pool.query(
      'SELECT ongkos_kerja_saat_ini FROM produksi_detail WHERE id_produksi = ? LIMIT 1',
      [id],
    )
    const ongkos = Number(lama[0]?.ongkos_kerja_saat_ini ?? 0)

    await pool.query('DELETE FROM produksi_detail WHERE id_produksi = ?', [id])
    for (const d of qtyPerUkuran) {
      const qty = Number(d.qty) || 0
      if (qty <= 0) continue
      await pool.query(
        'INSERT INTO produksi_detail (id_produksi, id_ukuran, qty, ongkos_kerja_saat_ini) VALUES (?, ?, ?, ?)',
        [id, Number(d.id_ukuran), qty, ongkos],
      )
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Hapus produksi
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const [row] = await pool.query('SELECT * FROM produksi_harian WHERE id_produksi = ?', [id])
    if (!row[0]) return res.status(404).json({ error: 'Data tidak ditemukan' })

    if (req.user.role === 'mandor') {
      const today = new Date().toISOString().slice(0, 10)
      if (row[0].created_by !== req.user.id || row[0].tanggal !== today) {
        return res.status(403).json({ error: 'Mandor hanya bisa menghapus data hari ini miliknya' })
      }
    }
    await pool.query('DELETE FROM produksi_harian WHERE id_produksi = ?', [id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router