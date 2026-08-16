import { Router } from 'express'
import pool from '../db.js'
import { authRequired, attachUser } from '../auth.js'
import { todayStr } from '../date.js'

const router = Router()
router.use(authRequired, attachUser)

router.get('/today', async (req, res) => {
  try {
    const today = todayStr()
    const { rows } = await pool.query('SELECT * FROM v_total_per_produksi WHERE tanggal = $1 ORDER BY shift', [today])

    if (req.headers['user-agent']?.includes('okhttp') || req.query.format === 'summary') {
      const { rows: workers } = await pool.query('SELECT COUNT(*) AS cnt FROM pekerja WHERE status_aktif = 1')
      const { rows: pos } = await pool.query('SELECT COUNT(*) AS cnt FROM master_po WHERE status_aktif = 1')

      let totalPasang = 0
      let estimasiUpah = 0
      let shift1 = 0
      let shift2 = 0
      const modelCount = {}

      for (const r of rows) {
        const psg = Number(r.total_pasang || 0)
        const uph = Number(r.subtotal_gaji || 0)
        totalPasang += psg
        estimasiUpah += uph
        if (r.shift === 1) shift1 += psg
        if (r.shift === 2) shift2 += psg
        if (r.nama_model) {
          modelCount[r.nama_model] = (modelCount[r.nama_model] || 0) + psg
        }
      }

      let topModel = null
      let maxPsg = -1
      for (const [m, c] of Object.entries(modelCount)) {
        if (c > maxPsg) {
          maxPsg = c
          topModel = m
        }
      }

      return res.json({
        total_pasang: totalPasang,
        estimasi_upah: estimasiUpah,
        pekerja_aktif_count: Number(workers[0]?.cnt || 0),
        po_berjalan_count: Number(pos[0]?.cnt || 0),
        shift_1_pasang: shift1,
        shift_2_pasang: shift2,
        top_model: topModel,
        target_harian: 500,
      })
    }

    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
