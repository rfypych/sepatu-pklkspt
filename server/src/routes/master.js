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
    const [r] = await pool.execute('INSERT INTO pekerja (nama) VALUES (?)', [nama])
    res.json({ id_pekerja: r.insertId, nama })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.patch('/pekerja/:id', adminOnly, async (req, res) => {
  try {
    const { nama, status_aktif } = req.body ?? {}
    const id = Number(req.params.id)
    if (nama !== undefined) await pool.execute('UPDATE pekerja SET nama = ? WHERE id_pekerja = ?', [nama.trim(), id])
    if (status_aktif !== undefined) await pool.execute('UPDATE pekerja SET status_aktif = ? WHERE id_pekerja = ?', [status_aktif ? 1 : 0, id])
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
    const [result] = await pool.query(
      'INSERT INTO tipe_sepatu (nama_model, ongkos_kerja) VALUES (?, ?)',
      [nama, ongkos],
    )
    res.json({ id_sepatu: Number(result.insertId), nama_model: nama, ongkos_kerja: ongkos })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.patch('/tipe-sepatu/:id', adminOnly, async (req, res) => {
  try {
    const { nama_model, ongkos_kerja, status_aktif } = req.body ?? {}
    const id = Number(req.params.id)
    if (nama_model !== undefined) await pool.execute('UPDATE tipe_sepatu SET nama_model = ? WHERE id_sepatu = ?', [nama_model.trim(), id])
    if (ongkos_kerja !== undefined) await pool.execute('UPDATE tipe_sepatu SET ongkos_kerja = ? WHERE id_sepatu = ?', [Number(ongkos_kerja), id])
    if (status_aktif !== undefined) await pool.execute('UPDATE tipe_sepatu SET status_aktif = ? WHERE id_sepatu = ?', [status_aktif ? 1 : 0, id])
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
    const [max] = await pool.query('SELECT COALESCE(MAX(urutan),0) AS m FROM master_ukuran')
    const urutan = Number(max[0].m) + 1
    const [result] = await pool.query(
      'INSERT INTO master_ukuran (label_ukuran, urutan) VALUES (?, ?)',
      [label, urutan],
    )
    res.json({ id_ukuran: Number(result.insertId), label_ukuran: label, urutan })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.patch('/ukuran/:id', adminOnly, async (req, res) => {
  try {
    const { status_aktif } = req.body ?? {}
    await pool.execute('UPDATE master_ukuran SET status_aktif = ? WHERE id_ukuran = ?', [status_aktif ? 1 : 0, Number(req.params.id)])
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
    const [result] = await pool.query(
      'INSERT INTO master_po (no_po, nama_customer) VALUES (?, ?)',
      [noPo, customer],
    )
    res.json({ id_po: Number(result.insertId), no_po: noPo, nama_customer: customer })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.patch('/po/:id', adminOnly, async (req, res) => {
  try {
    const { status_aktif } = req.body ?? {}
    await pool.execute('UPDATE master_po SET status_aktif = ? WHERE id_po = ?', [status_aktif ? 1 : 0, Number(req.params.id)])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router