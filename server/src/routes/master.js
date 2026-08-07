import { Router } from 'express'
import pool from '../db.js'
import { listPekerja, listTipeSepatu, listUkuran, listPo } from '../store.js'
import { authRequired, attachUser, adminOnly } from '../auth.js'

const router = Router()
router.use(authRequired, attachUser)

// ---------------- PEKERJA ----------------
router.get('/pekerja', async (req, res) => {
  try {
    res.json(await listPekerja(req.query.aktif === 'true'))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/pekerja', adminOnly, async (req, res) => {
  try {
    const nama = (req.body.nama || '').trim()
    if (!nama) return res.status(400).json({ error: 'Nama wajib diisi' })
    const { rows } = await pool.query('INSERT INTO pekerja (nama) VALUES ($1) RETURNING id_pekerja', [nama])
    res.json({ id_pekerja: Number(rows[0].id_pekerja), nama })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.patch('/pekerja/:id', adminOnly, async (req, res) => {
  try {
    const { nama, status_aktif } = req.body ?? {}
    const id = Number(req.params.id)
    if (nama !== undefined) await pool.query('UPDATE pekerja SET nama = $1 WHERE id_pekerja = $2', [nama.trim(), id])
    if (status_aktif !== undefined) await pool.query('UPDATE pekerja SET status_aktif = $1 WHERE id_pekerja = $2', [status_aktif ? 1 : 0, id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ---------------- TIPE SEPATU ----------------
router.get('/tipe-sepatu', async (req, res) => {
  try {
    res.json(await listTipeSepatu(req.query.aktif === 'true'))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/tipe-sepatu', adminOnly, async (req, res) => {
  try {
    const nama = (req.body.nama_model || '').trim()
    const ongkos = Number(req.body.ongkos_kerja || 0)
    if (!nama) return res.status(400).json({ error: 'Nama model wajib diisi' })
    const { rows } = await pool.query(
      'INSERT INTO tipe_sepatu (nama_model, ongkos_kerja) VALUES ($1, $2) RETURNING id_sepatu',
      [nama, ongkos],
    )
    res.json({ id_sepatu: Number(rows[0].id_sepatu), nama_model: nama, ongkos_kerja: ongkos })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.patch('/tipe-sepatu/:id', adminOnly, async (req, res) => {
  try {
    const { nama_model, ongkos_kerja, status_aktif } = req.body ?? {}
    const id = Number(req.params.id)
    if (nama_model !== undefined) await pool.query('UPDATE tipe_sepatu SET nama_model = $1 WHERE id_sepatu = $2', [nama_model.trim(), id])
    if (ongkos_kerja !== undefined) await pool.query('UPDATE tipe_sepatu SET ongkos_kerja = $1 WHERE id_sepatu = $2', [Number(ongkos_kerja), id])
    if (status_aktif !== undefined) await pool.query('UPDATE tipe_sepatu SET status_aktif = $1 WHERE id_sepatu = $2', [status_aktif ? 1 : 0, id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ---------------- UKURAN ----------------
router.get('/ukuran', async (req, res) => {
  try {
    res.json(await listUkuran(req.query.aktif === 'true'))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/ukuran', adminOnly, async (req, res) => {
  try {
    const label = String(req.body.label_ukuran || '').trim()
    if (!label) return res.status(400).json({ error: 'Ukuran wajib diisi' })
    const { rows: maxRows } = await pool.query('SELECT COALESCE(MAX(urutan),0) AS m FROM master_ukuran')
    const urutan = Number(maxRows[0].m) + 1
    const { rows } = await pool.query(
      'INSERT INTO master_ukuran (label_ukuran, urutan) VALUES ($1, $2) RETURNING id_ukuran',
      [label, urutan],
    )
    res.json({ id_ukuran: Number(rows[0].id_ukuran), label_ukuran: label, urutan })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.patch('/ukuran/:id', adminOnly, async (req, res) => {
  try {
    const { status_aktif } = req.body ?? {}
    await pool.query('UPDATE master_ukuran SET status_aktif = $1 WHERE id_ukuran = $2', [status_aktif ? 1 : 0, Number(req.params.id)])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ---------------- PO ----------------
router.get('/po', async (req, res) => {
  try {
    res.json(await listPo(req.query.aktif === 'true'))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/po', adminOnly, async (req, res) => {
  try {
    const noPo = (req.body.no_po || '').trim()
    if (!noPo) return res.status(400).json({ error: 'No PO wajib diisi' })
    const customer = (req.body.nama_customer || '').trim() || null
    const { rows } = await pool.query(
      'INSERT INTO master_po (no_po, nama_customer) VALUES ($1, $2) RETURNING id_po',
      [noPo, customer],
    )
    res.json({ id_po: Number(rows[0].id_po), no_po: noPo, nama_customer: customer })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.patch('/po/:id', adminOnly, async (req, res) => {
  try {
    const { status_aktif } = req.body ?? {}
    await pool.query('UPDATE master_po SET status_aktif = $1 WHERE id_po = $2', [status_aktif ? 1 : 0, Number(req.params.id)])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
