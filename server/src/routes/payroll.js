import { Router } from 'express'
import pool from '../db.js'
import { authRequired, attachUser } from '../auth.js'

const router = Router()
router.use(authRequired, attachUser)

router.get('/periods', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT CONCAT(DATE_FORMAT(tanggal,'%Y-%m'), '-',
              IF(DAY(tanggal) <= 15,'1','2')) AS periode
       FROM produksi_harian ORDER BY periode DESC`,
    )
    res.json(rows.map((r) => r.periode))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/rekap', async (req, res) => {
  try {
    const { periode } = req.query
    if (!periode) return res.status(400).json({ error: 'Periode wajib diisi' })
    const [rows] = await pool.query('SELECT * FROM v_rekap_gaji WHERE periode = ?', [periode])
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router