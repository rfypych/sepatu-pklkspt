import { Router } from 'express'
import pool from '../db.js'
import { listPekerja, listTipeSepatu, listUkuran, listPo } from '../store.js'
import { authRequired, attachUser, adminOnly } from '../auth.js'

const router = Router()
router.use(authRequired, attachUser)

// ---------------- PEKERJA ----------------
router.get('/pekerja', async (req, res) => {
  try {
    const raw = await listPekerja(req.query.aktif === 'true')
    const mapped = raw.map((r) => ({
      ...r,
      id: String(r.id_pekerja),
      id_pekerja: Number(r.id_pekerja),
      nama: r.nama,
      nik: `NIK-${String(r.id_pekerja).padStart(4, '0')}`,
      bagian: 'Produksi & Assembling',
      shift: 1,
      aktif: r.status_aktif === 1,
      status_aktif: r.status_aktif,
    }))
    res.json(mapped)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/pekerja', adminOnly, async (req, res) => {
  try {
    const nama = (req.body.nama || '').trim()
    if (!nama) return res.status(400).json({ error: 'Nama wajib diisi' })
    const { rows } = await pool.query('INSERT INTO pekerja (nama) VALUES ($1) RETURNING id_pekerja', [nama])
    const id = Number(rows[0].id_pekerja)
    res.json({
      id: String(id),
      id_pekerja: id,
      nama,
      nik: `NIK-${String(id).padStart(4, '0')}`,
      bagian: 'Produksi & Assembling',
      shift: 1,
      aktif: true,
      status_aktif: 1,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const updatePekerjaHandler = async (req, res) => {
  try {
    const { nama, status_aktif, aktif } = req.body ?? {}
    const id = Number(req.params.id)
    if (nama !== undefined) await pool.query('UPDATE pekerja SET nama = $1 WHERE id_pekerja = $2', [String(nama).trim(), id])
    const resolvedAktif = status_aktif !== undefined ? (status_aktif ? 1 : 0) : (aktif !== undefined ? (aktif ? 1 : 0) : undefined)
    if (resolvedAktif !== undefined) await pool.query('UPDATE pekerja SET status_aktif = $1 WHERE id_pekerja = $2', [resolvedAktif, id])
    res.json({
      id: String(id),
      id_pekerja: id,
      nama: nama || '',
      aktif: resolvedAktif === 1,
      status_aktif: resolvedAktif ?? 1,
      ok: true,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
router.patch('/pekerja/:id', adminOnly, updatePekerjaHandler)
router.put('/pekerja/:id', adminOnly, updatePekerjaHandler)

router.delete('/pekerja/:id', adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rows } = await pool.query('SELECT COUNT(*) AS c FROM produksi_harian WHERE id_pekerja = $1', [id])
    if (Number(rows[0]?.c || 0) > 0) {
      await pool.query('UPDATE pekerja SET status_aktif = 0 WHERE id_pekerja = $1', [id])
      return res.json({ ok: true, softDeleted: true, message: 'Pekerja dinonaktifkan karena memiliki riwayat produksi' })
    }
    await pool.query('DELETE FROM pekerja WHERE id_pekerja = $1', [id])
    res.json({ ok: true, hardDeleted: true, message: 'Pekerja berhasil dihapus permanen' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ---------------- TIPE SEPATU / MODEL ----------------
const listModelHandler = async (req, res) => {
  try {
    const raw = await listTipeSepatu(req.query.aktif === 'true')
    const mapped = raw.map((r) => ({
      ...r,
      id: String(r.id_sepatu),
      id_sepatu: Number(r.id_sepatu),
      kode_model: r.nama_model,
      nama_model: r.nama_model,
      kategori: 'Model',
      ongkos_per_pasang: Number(r.ongkos_kerja || 0),
      ongkos_kerja: Number(r.ongkos_kerja || 0),
      status_aktif: r.status_aktif,
    }))
    res.json(mapped)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
router.get('/tipe-sepatu', listModelHandler)
router.get('/model', listModelHandler)

const createModelHandler = async (req, res) => {
  try {
    const nama = (req.body.nama_model || req.body.kode_model || '').trim()
    const ongkos = Number(req.body.ongkos_kerja ?? req.body.ongkos_per_pasang ?? 0)
    if (!nama) return res.status(400).json({ error: 'Nama model wajib diisi' })
    const { rows } = await pool.query(
      'INSERT INTO tipe_sepatu (nama_model, ongkos_kerja) VALUES ($1, $2) RETURNING id_sepatu',
      [nama, ongkos],
    )
    const id = Number(rows[0].id_sepatu)
    res.json({
      id: String(id),
      id_sepatu: id,
      kode_model: nama,
      nama_model: nama,
      kategori: 'Model',
      ongkos_per_pasang: ongkos,
      ongkos_kerja: ongkos,
      status_aktif: 1,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
router.post('/tipe-sepatu', adminOnly, createModelHandler)
router.post('/model', adminOnly, createModelHandler)

const updateModelHandler = async (req, res) => {
  try {
    const { nama_model, kode_model, ongkos_kerja, ongkos_per_pasang, status_aktif } = req.body ?? {}
    const id = Number(req.params.id)
    const nama = (nama_model || kode_model || '').trim()
    if (nama) await pool.query('UPDATE tipe_sepatu SET nama_model = $1 WHERE id_sepatu = $2', [nama, id])
    const ongkos = ongkos_kerja !== undefined ? Number(ongkos_kerja) : (ongkos_per_pasang !== undefined ? Number(ongkos_per_pasang) : undefined)
    if (ongkos !== undefined) await pool.query('UPDATE tipe_sepatu SET ongkos_kerja = $1 WHERE id_sepatu = $2', [ongkos, id])
    if (status_aktif !== undefined) await pool.query('UPDATE tipe_sepatu SET status_aktif = $1 WHERE id_sepatu = $2', [status_aktif ? 1 : 0, id])
    res.json({
      id: String(id),
      id_sepatu: id,
      kode_model: nama,
      nama_model: nama,
      ongkos_per_pasang: ongkos ?? 0,
      ongkos_kerja: ongkos ?? 0,
      status_aktif: status_aktif ?? 1,
      ok: true,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
router.patch('/tipe-sepatu/:id', adminOnly, updateModelHandler)
router.put('/tipe-sepatu/:id', adminOnly, updateModelHandler)
router.patch('/model/:id', adminOnly, updateModelHandler)
router.put('/model/:id', adminOnly, updateModelHandler)

const deleteModelHandler = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rows } = await pool.query('SELECT COUNT(*) AS c FROM produksi_harian WHERE id_sepatu = $1', [id])
    if (Number(rows[0]?.c || 0) > 0) {
      await pool.query('UPDATE tipe_sepatu SET status_aktif = 0 WHERE id_sepatu = $1', [id])
      return res.json({ ok: true, softDeleted: true, message: 'Model dinonaktifkan karena memiliki riwayat produksi' })
    }
    await pool.query('DELETE FROM tipe_sepatu WHERE id_sepatu = $1', [id])
    res.json({ ok: true, hardDeleted: true, message: 'Model berhasil dihapus permanen' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
router.delete('/tipe-sepatu/:id', adminOnly, deleteModelHandler)
router.delete('/model/:id', adminOnly, deleteModelHandler)

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

const updateUkuranHandler = async (req, res) => {
  try {
    const { label_ukuran, status_aktif } = req.body ?? {}
    const id = Number(req.params.id)
    if (label_ukuran !== undefined) {
      await pool.query('UPDATE master_ukuran SET label_ukuran = $1 WHERE id_ukuran = $2', [String(label_ukuran).trim(), id])
    }
    if (status_aktif !== undefined) {
      await pool.query('UPDATE master_ukuran SET status_aktif = $1 WHERE id_ukuran = $2', [status_aktif ? 1 : 0, id])
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
router.patch('/ukuran/:id', adminOnly, updateUkuranHandler)
router.put('/ukuran/:id', adminOnly, updateUkuranHandler)

router.delete('/ukuran/:id', adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rows } = await pool.query('SELECT COUNT(*) AS c FROM produksi_detail WHERE id_ukuran = $1', [id])
    if (Number(rows[0]?.c || 0) > 0) {
      await pool.query('UPDATE master_ukuran SET status_aktif = 0 WHERE id_ukuran = $1', [id])
      return res.json({ ok: true, softDeleted: true, message: 'Ukuran dinonaktifkan karena memiliki riwayat produksi' })
    }
    await pool.query('DELETE FROM master_ukuran WHERE id_ukuran = $1', [id])
    res.json({ ok: true, hardDeleted: true, message: 'Ukuran berhasil dihapus permanen' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ---------------- PO ----------------
router.get('/po', async (req, res) => {
  try {
    const raw = await listPo(req.query.aktif === 'true')
    const mapped = raw.map((r) => ({
      ...r,
      id: String(r.id_po),
      id_po: Number(r.id_po),
      nomor_po: r.no_po,
      no_po: r.no_po,
      nama_po: r.nama_customer || r.no_po,
      nama_customer: r.nama_customer,
      target_pasang: Number(r.target_qty || 0),
      target_qty: Number(r.target_qty || 0),
      selesai_pasang: Number(r.achieved_qty || 0),
      achieved_qty: Number(r.achieved_qty || 0),
      status: r.target_qty > 0 && Number(r.achieved_qty) >= Number(r.target_qty) ? 'Selesai' : 'Berjalan',
      status_aktif: r.status_aktif,
    }))
    res.json(mapped)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/po', async (req, res) => {
  try {
    const noPo = (req.body.no_po || req.body.nomor_po || '').trim()
    if (!noPo) return res.status(400).json({ error: 'No PO wajib diisi' })
    const customer = (req.body.nama_customer || req.body.nama_po || '').trim() || null
    const target = Math.max(0, Math.floor(Number(req.body.target_qty ?? req.body.target_pasang) || 0))
    const { rows } = await pool.query(
      'INSERT INTO master_po (no_po, nama_customer, target_qty) VALUES ($1, $2, $3) RETURNING id_po',
      [noPo, customer, target],
    )
    const id = Number(rows[0].id_po)
    res.json({
      id: String(id),
      id_po: id,
      nomor_po: noPo,
      no_po: noPo,
      nama_po: customer || noPo,
      nama_customer: customer,
      target_pasang: target,
      target_qty: target,
      selesai_pasang: 0,
      achieved_qty: 0,
      status: 'Berjalan',
      status_aktif: 1,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const updatePoHandler = async (req, res) => {
  try {
    const { no_po, nomor_po, nama_customer, nama_po, target_qty, target_pasang, status_aktif } = req.body ?? {}
    const id = Number(req.params.id)
    if (no_po !== undefined || nomor_po !== undefined) {
      const resolvedNoPo = (no_po || nomor_po || '').trim()
      if (resolvedNoPo) await pool.query('UPDATE master_po SET no_po = $1 WHERE id_po = $2', [resolvedNoPo, id])
    }
    if (nama_customer !== undefined || nama_po !== undefined) {
      const resolvedCust = (nama_customer || nama_po || '').trim() || null
      await pool.query('UPDATE master_po SET nama_customer = $1 WHERE id_po = $2', [resolvedCust, id])
    }
    const resolvedTarget = target_qty !== undefined ? Number(target_qty) : (target_pasang !== undefined ? Number(target_pasang) : undefined)
    if (resolvedTarget !== undefined) await pool.query('UPDATE master_po SET target_qty = $1 WHERE id_po = $2', [Math.max(0, Math.floor(resolvedTarget)), id])
    if (status_aktif !== undefined) await pool.query('UPDATE master_po SET status_aktif = $1 WHERE id_po = $2', [status_aktif ? 1 : 0, id])
    res.json({
      id: String(id),
      id_po: id,
      ok: true,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
router.patch('/po/:id', adminOnly, updatePoHandler)
router.put('/po/:id', adminOnly, updatePoHandler)

router.delete('/po/:id', adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rows } = await pool.query('SELECT COUNT(*) AS c FROM produksi_harian WHERE id_po = $1', [id])
    if (Number(rows[0]?.c || 0) > 0) {
      await pool.query('UPDATE master_po SET status_aktif = 0 WHERE id_po = $1', [id])
      return res.json({ ok: true, softDeleted: true, message: 'PO dinonaktifkan karena memiliki riwayat produksi' })
    }
    await pool.query('DELETE FROM master_po WHERE id_po = $1', [id])
    res.json({ ok: true, hardDeleted: true, message: 'PO berhasil dihapus permanen' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ---------------- RESET / BERSIHKAN DATABASE (ADMIN ONLY) ----------------
router.post('/reset-database', adminOnly, async (req, res) => {
  const client = await pool.connect()
  try {
    const { mode } = req.body || {} // 'produksi_only' | 'factory_reset'
    await client.query('BEGIN')

    if (mode === 'factory_reset') {
      await client.query('TRUNCATE TABLE produksi_detail, produksi_harian, master_po, tipe_sepatu, pekerja RESTART IDENTITY CASCADE')
      await client.query('COMMIT')
      return res.json({ ok: true, mode: 'factory_reset', message: 'Semua data produksi, PO, model, dan pekerja berhasil dibersihkan!' })
    } else {
      await client.query('TRUNCATE TABLE produksi_detail, produksi_harian RESTART IDENTITY CASCADE')
      await client.query('COMMIT')
      return res.json({ ok: true, mode: 'produksi_only', message: 'Seluruh data transaksi produksi harian berhasil dibersihkan!' })
    }
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
})

export default router
