import { Router } from 'express'
import pool from '../db.js'
import { authRequired, attachUser } from '../auth.js'

const router = Router()
router.use(authRequired, attachUser)

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const [rows] = await pool.query('SELECT * FROM v_total_per_produksi WHERE tanggal = ? ORDER BY shift', [today])
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router