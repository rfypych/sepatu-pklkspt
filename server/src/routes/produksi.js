import { Router } from 'express'
import pool from '../db.js'
import { authRequired, attachUser } from '../auth.js'
import { todayStr } from '../date.js'

const router = Router()
router.use(authRequired, attachUser)

// Hari ini (semua pengguna melihat data hari ini)
router.get('/hari-ini', async (req, res) => {
  try {
    const today = todayStr()
    const sql = `
      SELECT ph.*, p.nama AS nama_pekerja, ts.nama_model, po.no_po
      FROM produksi_harian ph
      JOIN pekerja p      ON p.id_pekerja = ph.id_pekerja
      JOIN tipe_sepatu ts ON ts.id_sepatu = ph.id_sepatu
      LEFT JOIN master_po po ON po.id_po = ph.id_po
      WHERE ph.tanggal = $1
      ORDER BY ph.created_at DESC
    `
    const { rows } = await pool.query(sql, [today])

    for (const r of rows) {
      const { rows: detail } = await pool.query(
        'SELECT * FROM produksi_detail WHERE id_produksi = $1 ORDER BY id_ukuran',
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
      params.push(tanggal)
      sql += ` AND ph.tanggal = $${params.length}`
    }
    if (pekerja) {
      params.push(Number(pekerja))
      sql += ` AND ph.id_pekerja = $${params.length}`
    }
    sql += ' ORDER BY ph.tanggal DESC, ph.shift'
    const { rows } = await pool.query(sql, params)

    for (const r of rows) {
      const { rows: detail } = await pool.query(
        'SELECT * FROM produksi_detail WHERE id_produksi = $1 ORDER BY id_ukuran',
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
  const client = await pool.connect()
  try {
    const { tanggal, shift, id_pekerja, id_sepatu, id_po, qtyPerUkuran } = req.body ?? {}
    if (!tanggal || !shift || !id_pekerja || !id_sepatu || !Array.isArray(qtyPerUkuran)) {
      return res.status(400).json({ error: 'Data tidak lengkap' })
    }

    const { rows: sepatu } = await client.query('SELECT ongkos_kerja FROM tipe_sepatu WHERE id_sepatu = $1', [Number(id_sepatu)])
    const ongkos = Number(sepatu[0]?.ongkos_kerja ?? 0)

    await client.query('BEGIN')
    const { rows: hdr } = await client.query(
      `INSERT INTO produksi_harian (tanggal, shift, id_pekerja, id_sepatu, id_po, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_produksi`,
      [tanggal, Number(shift), Number(id_pekerja), Number(id_sepatu), id_po ? Number(id_po) : null, req.user.id],
    )
    const idProduksi = Number(hdr[0].id_produksi)

    for (const d of qtyPerUkuran) {
      const qty = Number(d.qty) || 0
      if (qty <= 0) continue
      await client.query(
        'INSERT INTO produksi_detail (id_produksi, id_ukuran, qty, ongkos_kerja_saat_ini) VALUES ($1, $2, $3, $4)',
        [idProduksi, Number(d.id_ukuran), qty, ongkos],
      )
    }
    await client.query('COMMIT')
    res.json({ id_produksi: idProduksi })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
})

// Ganti detail (edit qty)
router.put('/:id/detail', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { qtyPerUkuran } = req.body ?? {}
    if (!Array.isArray(qtyPerUkuran)) return res.status(400).json({ error: 'Data tidak lengkap' })

    const { rows } = await pool.query('SELECT * FROM produksi_harian WHERE id_produksi = $1', [id])
    if (!rows[0]) return res.status(404).json({ error: 'Data tidak ditemukan' })

    // batasan: mandor hanya boleh mengubah data tanggal hari ini
    if (req.user.role === 'mandor') {
      const today = todayStr()
      // pg mengembalikan DATE sebagai string 'YYYY-MM-DD'
      if (String(rows[0].tanggal).slice(0, 10) !== today) {
        return res.status(403).json({ error: 'Mandor hanya bisa mengubah data tanggal hari ini' })
      }
    }

    const { rows: lama } = await pool.query(
      'SELECT ongkos_kerja_saat_ini FROM produksi_detail WHERE id_produksi = $1 LIMIT 1',
      [id],
    )
    const ongkos = Number(lama[0]?.ongkos_kerja_saat_ini ?? 0)

    await pool.query('DELETE FROM produksi_detail WHERE id_produksi = $1', [id])
    for (const d of qtyPerUkuran) {
      const qty = Number(d.qty) || 0
      if (qty <= 0) continue
      await pool.query(
        'INSERT INTO produksi_detail (id_produksi, id_ukuran, qty, ongkos_kerja_saat_ini) VALUES ($1, $2, $3, $4)',
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
    const { rows } = await pool.query('SELECT * FROM produksi_harian WHERE id_produksi = $1', [id])
    if (!rows[0]) return res.status(404).json({ error: 'Data tidak ditemukan' })

    if (req.user.role === 'mandor') {
      const today = todayStr()
      if (String(rows[0].tanggal).slice(0, 10) !== today) {
        return res.status(403).json({ error: 'Mandor hanya bisa menghapus data tanggal hari ini' })
      }
    }
    await pool.query('DELETE FROM produksi_harian WHERE id_produksi = $1', [id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
