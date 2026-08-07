import { Router } from 'express'
import pool from '../db.js'
import { authRequired, attachUser, adminOnly } from '../auth.js'

const router = Router()
router.use(authRequired, attachUser)

// Rekap harian dalam rentang periode — dipakai tabel gaya Excel (pekerja x tanggal)
// Body/query: ?dari=YYYY-MM-DD&sampai=YYYY-MM-DD
router.get('/harian', adminOnly, async (req, res) => {
  try {
    const { dari, sampai } = req.query
    if (!dari || !sampai) return res.status(400).json({ error: 'Periode dari & sampai wajib diisi' })
    const { rows } = await pool.query(
      `SELECT ph.tanggal, ph.id_pekerja, p.nama AS nama_pekerja,
         COALESCE(SUM(pd.qty), 0) AS total_pasang,
         COALESCE(SUM(pd.qty * pd.ongkos_kerja_saat_ini), 0) AS total_gaji
       FROM produksi_harian ph
       JOIN pekerja p        ON p.id_pekerja = ph.id_pekerja
       JOIN produksi_detail pd ON pd.id_produksi = ph.id_produksi
       WHERE ph.tanggal BETWEEN $1 AND $2
       GROUP BY ph.tanggal, ph.id_pekerja, p.nama
       ORDER BY ph.tanggal, p.nama`,
      [dari, sampai],
    )
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router