import { Router } from 'express'
import pool from '../db.js'
import { authRequired, attachUser, adminOnly } from '../auth.js'
import { todayStr } from '../date.js'

const router = Router()
router.use(authRequired, attachUser, adminOnly)

router.get('/periods', async (req, res) => {
  try {
    const today = todayStr()
    const [thnNow, blnNow] = today.split('-')
    const currentP1 = `${thnNow}-${blnNow}-1`
    const currentP2 = `${thnNow}-${blnNow}-2`

    const { rows } = await pool.query(
      `SELECT DISTINCT to_char(tanggal, 'YYYY-MM') || '-' ||
              (CASE WHEN EXTRACT(DAY FROM tanggal) <= 15 THEN '1' ELSE '2' END) AS periode
       FROM produksi_harian WHERE tanggal IS NOT NULL`,
    )
    const dbPeriods = rows.map((r) => r.periode)

    // Selalu pastikan Periode I dan Periode II bulan berjalan muncul, digabung dengan seluruh histori
    const periodSet = new Set([currentP2, currentP1, ...dbPeriods])
    const periodList = Array.from(periodSet).sort((a, b) => b.localeCompare(a))

    if (req.headers['user-agent']?.includes('okhttp') || req.query.format === 'objects') {
      const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      const mapped = periodList.map((p) => {
        const [thn, bln, no] = p.split('-')
        const y = Number(thn)
        const m = Number(bln)
        const mName = monthNames[m] || ''
        const lastDay = new Date(y, m, 0).getDate()
        const isFirst = no === '1'
        return {
          id: p,
          label: isFirst ? `1–15 ${mName} ${y} (Periode I)` : `16–${lastDay} ${mName} ${y} (Periode II)`,
          start_date: isFirst ? `${thn}-${bln.padStart(2, '0')}-01` : `${thn}-${bln.padStart(2, '0')}-16`,
          end_date: isFirst ? `${thn}-${bln.padStart(2, '0')}-15` : `${thn}-${bln.padStart(2, '0')}-${lastDay}`,
          status: 'Aktif',
        }
      })
      return res.json(mapped)
    }

    res.json(periodList)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/rekap', async (req, res) => {
  try {
    const { periode, start_date, end_date } = req.query
    let targetPeriode = periode
    if (!targetPeriode && start_date) {
      const day = Number(start_date.slice(8, 10))
      const ym = start_date.slice(0, 7)
      targetPeriode = `${ym}-${day <= 15 ? '1' : '2'}`
    }

    if (!targetPeriode) {
      const today = todayStr()
      const [thn, bln, dayStr] = today.split('-')
      const day = Number(dayStr)
      targetPeriode = `${thn}-${bln}-${day <= 15 ? '1' : '2'}`
    }

    const { rows } = await pool.query('SELECT * FROM v_rekap_gaji WHERE periode = $1', [targetPeriode])

    if (req.headers['user-agent']?.includes('okhttp')) {
      const workerMap = new Map()
      for (const r of rows) {
        const wid = String(r.id_pekerja)
        const cur = workerMap.get(wid) ?? {
          pekerja_id: wid,
          pekerja_nama: r.nama_pekerja,
          nik: `NIK-${wid.padStart(4, '0')}`,
          bagian: 'Produksi & Assembling',
          total_pasang: 0,
          total_upah: 0.0,
          hari_kerja: 15,
          rincian_model: [],
        }
        const psg = Number(r.total_pasang || 0)
        const uph = Number(r.total_gaji || 0)
        cur.total_pasang += psg
        cur.total_upah += uph
        cur.rincian_model.push({
          model_id: String(r.id_sepatu),
          nama_model: r.nama_model,
          total_pasang: psg,
          ongkos_satuan: psg > 0 ? (uph / psg) : 0,
          subtotal_upah: uph,
        })
        workerMap.set(wid, cur)
      }
      return res.json(Array.from(workerMap.values()))
    }

    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
