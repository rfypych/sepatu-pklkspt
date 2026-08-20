import { Router } from 'express'
import pool from '../db.js'
import { authRequired, attachUser } from '../auth.js'
import { todayStr } from '../date.js'
import { listPekerja, listTipeSepatu, listUkuran, listPo } from '../store.js'

const router = Router()
router.use(authRequired, attachUser)

async function formatProduksiRows(rows, cachedUkuran = null) {
  if (!rows || rows.length === 0) return rows

  const allUkuran = cachedUkuran || (await listUkuran())
  const idToLabel = {}
  for (const u of allUkuran) {
    idToLabel[u.id_ukuran] = u.label_ukuran
  }

  const prodIds = rows.map((r) => r.id_produksi)
  const { rows: allDetails } = await pool.query(
    'SELECT * FROM produksi_detail WHERE id_produksi = ANY($1::int[]) ORDER BY id_ukuran',
    [prodIds],
  )

  const detailsByProd = {}
  for (const d of allDetails) {
    if (!detailsByProd[d.id_produksi]) detailsByProd[d.id_produksi] = []
    detailsByProd[d.id_produksi].push(d)
  }

  for (const r of rows) {
    const detail = detailsByProd[r.id_produksi] || []
    r.detail = detail
    r.id = String(r.id_produksi)
    r.pekerja_id = String(r.id_pekerja)
    r.pekerja_nama = r.nama_pekerja
    r.po_id = r.id_po ? String(r.id_po) : ''
    r.nomor_po = r.no_po || ''
    r.model_id = String(r.id_sepatu)
    r.tanggal = String(r.tanggal).slice(0, 10)

    const sizes = { 36: 0, 37: 0, 38: 0, 39: 0, 40: 0, 41: 0, 42: 0, 43: 0, 44: 0 }
    let totalPasang = 0
    let totalUpah = 0
    let ongkosSatuan = 0

    for (const d of detail) {
      const lbl = idToLabel[d.id_ukuran] || String(d.id_ukuran)
      const q = Number(d.qty || 0)
      sizes[lbl] = q
      totalPasang += q
      ongkosSatuan = Number(d.ongkos_kerja_saat_ini || 0)
      totalUpah += q * ongkosSatuan
    }

    r.sizes = sizes
    r.total_pasang = totalPasang
    r.ongkos_satuan = ongkosSatuan
    r.ongkos_kerja_saat_ini = ongkosSatuan
    r.estimasi_upah = totalUpah
    r.subtotal_gaji = totalUpah
  }
  return rows
}

// Batch Init Endpoint: Menyatukan seluruh master data & produksi hari ini dalam 1 HTTP roundtrip
const mandorInitHandler = async (req, res) => {
  try {
    const today = todayStr()
    const [pekerja, model, ukuran, po, todayProdRows] = await Promise.all([
      listPekerja(true),
      listTipeSepatu(true),
      listUkuran(true),
      listPo(true),
      pool.query(
        `SELECT ph.*, p.nama AS nama_pekerja, ts.nama_model, po.no_po
         FROM produksi_harian ph
         JOIN pekerja p      ON p.id_pekerja = ph.id_pekerja
         JOIN tipe_sepatu ts ON ts.id_sepatu = ph.id_sepatu
         LEFT JOIN master_po po ON po.id_po = ph.id_po
         WHERE ph.tanggal = $1
         ORDER BY ph.created_at DESC`,
        [today],
      ),
    ])

    const todayProd = todayProdRows.rows
    await formatProduksiRows(todayProd, ukuran)

    res.json({
      pekerja: pekerja.map((r) => ({
        ...r,
        id: String(r.id_pekerja),
        id_pekerja: Number(r.id_pekerja),
        nama: r.nama,
        aktif: r.status_aktif === 1,
        status_aktif: r.status_aktif,
      })),
      model: model.map((r) => ({
        ...r,
        id: String(r.id_sepatu),
        id_sepatu: Number(r.id_sepatu),
        nama_model: r.nama_model,
        ongkos_kerja: Number(r.ongkos_kerja || 0),
        aktif: r.status_aktif === 1,
        status_aktif: r.status_aktif,
      })),
      ukuran,
      po: po.map((r) => ({
        ...r,
        id: String(r.id_po),
        id_po: Number(r.id_po),
        target_qty: Number(r.target_qty || 0),
        achieved_qty: Number(r.achieved_qty || 0),
        status_aktif: r.status_aktif,
      })),
      todayProduksi: todayProd,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
router.get('/mandor-init', mandorInitHandler)
router.get('/init', mandorInitHandler)

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
    await formatProduksiRows(rows)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// List dengan filter
const listProduksiHandler = async (req, res) => {
  try {
    const { tanggal, pekerja, pekerja_id, dari, sampai, po_id } = req.query
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
    if (dari) {
      params.push(dari)
      sql += ` AND ph.tanggal >= $${params.length}`
    }
    if (sampai) {
      params.push(sampai)
      sql += ` AND ph.tanggal <= $${params.length}`
    }
    const resolvedPekerja = pekerja || pekerja_id
    if (resolvedPekerja) {
      params.push(Number(resolvedPekerja))
      sql += ` AND ph.id_pekerja = $${params.length}`
    }
    if (po_id) {
      params.push(Number(po_id))
      sql += ` AND ph.id_po = $${params.length}`
    }
    sql += ' ORDER BY ph.tanggal DESC, ph.shift'
    const { rows } = await pool.query(sql, params)
    await formatProduksiRows(rows)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
router.get('/', listProduksiHandler)
router.get('/riwayat', listProduksiHandler)
router.get('/terbaru', listProduksiHandler)

// Simpan produksi single
router.post('/', async (req, res) => {
  const client = await pool.connect()
  try {
    const { tanggal, shift, id_pekerja, pekerja_id, id_sepatu, model_id, id_po, po_id, sizes, qtyPerUkuran, catatan } = req.body ?? {}
    const resolvedTgl = tanggal || todayStr()
    const resolvedShift = Number(shift || 1)
    const resolvedPekerja = Number(id_pekerja || pekerja_id)
    const resolvedSepatu = Number(id_sepatu || model_id)
    const resolvedPo = id_po ? Number(id_po) : (po_id ? Number(po_id) : null)

    if (!resolvedTgl || !resolvedShift || !resolvedPekerja || !resolvedSepatu) {
      return res.status(400).json({ error: 'Data tidak lengkap' })
    }

    const { rows: sepatu } = await client.query('SELECT ongkos_kerja FROM tipe_sepatu WHERE id_sepatu = $1', [resolvedSepatu])
    const ongkos = Number(sepatu[0]?.ongkos_kerja ?? 0)

    const allUkuran = await listUkuran()
    const labelToId = {}
    for (const u of allUkuran) labelToId[u.label_ukuran] = u.id_ukuran

    let itemsDetail = qtyPerUkuran
    if (!Array.isArray(itemsDetail) && sizes && typeof sizes === 'object') {
      itemsDetail = Object.entries(sizes).map(([lbl, q]) => ({
        id_ukuran: labelToId[lbl] || Number(lbl),
        qty: Number(q) || 0,
      }))
    }

    await client.query('BEGIN')
    const { rows: hdr } = await client.query(
      `INSERT INTO produksi_harian (tanggal, shift, id_pekerja, id_sepatu, id_po, catatan, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_produksi`,
      [resolvedTgl, resolvedShift, resolvedPekerja, resolvedSepatu, resolvedPo, catatan || null, req.user.id],
    )
    const idProduksi = Number(hdr[0].id_produksi)

    if (Array.isArray(itemsDetail)) {
      for (const d of itemsDetail) {
        const qty = Number(d.qty) || 0
        if (qty <= 0) continue
        await client.query(
          'INSERT INTO produksi_detail (id_produksi, id_ukuran, qty, ongkos_kerja_saat_ini) VALUES ($1, $2, $3, $4)',
          [idProduksi, Number(d.id_ukuran), qty, ongkos],
        )
      }
    }
    await client.query('COMMIT')
    res.json({ id_produksi: idProduksi, id: String(idProduksi) })
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
})

// Simpan batch produksi
router.post('/batch', async (req, res) => {
  const client = await pool.connect()
  try {
    const { tanggal, shift, id_pekerja, pekerja_id, id_po, po_id, items, catatan } = req.body ?? {}
    const resolvedTgl = tanggal || todayStr()
    const resolvedShift = Number(shift || 1)
    const resolvedPekerja = Number(id_pekerja || pekerja_id)
    const resolvedPo = id_po ? Number(id_po) : (po_id ? Number(po_id) : null)

    if (!resolvedTgl || !resolvedShift || !resolvedPekerja || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data tidak lengkap' })
    }

    const allUkuran = await listUkuran()
    const labelToId = {}
    for (const u of allUkuran) labelToId[u.label_ukuran] = u.id_ukuran

    await client.query('BEGIN')
    const idProduksiList = []
    const createdEntries = []

    for (const it of items) {
      const idSepatu = Number(it.id_sepatu || it.model_id)
      if (!idSepatu) continue

      const { rows: sepatu } = await client.query('SELECT nama_model, ongkos_kerja FROM tipe_sepatu WHERE id_sepatu = $1', [idSepatu])
      const ongkos = Number(sepatu[0]?.ongkos_kerja ?? 0)
      const namaModel = sepatu[0]?.nama_model ?? ''

      const { rows: hdr } = await client.query(
        `INSERT INTO produksi_harian (tanggal, shift, id_pekerja, id_sepatu, id_po, catatan, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id_produksi`,
        [resolvedTgl, resolvedShift, resolvedPekerja, idSepatu, resolvedPo, catatan || null, req.user.id],
      )
      const id = Number(hdr[0].id_produksi)
      idProduksiList.push(id)

      let detailList = it.qtyPerUkuran
      if (!Array.isArray(detailList) && it.sizes && typeof it.sizes === 'object') {
        detailList = Object.entries(it.sizes).map(([lbl, q]) => ({
          id_ukuran: labelToId[lbl] || Number(lbl),
          qty: Number(q) || 0,
        }))
      }

      let itemTotalPasang = 0
      if (Array.isArray(detailList)) {
        for (const d of detailList) {
          const qty = Number(d.qty) || 0
          if (qty <= 0) continue
          itemTotalPasang += qty
          await client.query(
            'INSERT INTO produksi_detail (id_produksi, id_ukuran, qty, ongkos_kerja_saat_ini) VALUES ($1, $2, $3, $4)',
            [id, Number(d.id_ukuran), qty, ongkos],
          )
        }
      }

      createdEntries.push({
        id: String(id),
        id_produksi: id,
        pekerja_id: String(resolvedPekerja),
        model_id: String(idSepatu),
        nama_model: namaModel,
        shift: resolvedShift,
        tanggal: resolvedTgl,
        total_pasang: itemTotalPasang,
        ongkos_satuan: ongkos,
        estimasi_upah: itemTotalPasang * ongkos,
      })
    }

    await client.query('COMMIT')

    // Jika dipanggil dari Retrofit (Android)
    if (req.headers['user-agent']?.includes('okhttp')) {
      return res.json(createdEntries)
    }

    res.json({ id_produksi: idProduksiList[0], id_produksi_list: idProduksiList, jumlah: idProduksiList.length })
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
})

// Ganti detail (edit qty)
router.put('/:id/detail', async (req, res) => {
  const client = await pool.connect()
  try {
    const id = Number(req.params.id)
    const { qtyPerUkuran, sizes } = req.body ?? {}

    const { rows } = await client.query('SELECT * FROM produksi_harian WHERE id_produksi = $1', [id])
    if (!rows[0]) return res.status(404).json({ error: 'Data tidak ditemukan' })

    // Batasan: mandor hanya boleh mengubah data tanggal hari ini
    if (req.user.role === 'mandor') {
      const today = todayStr()
      const tgl = String(rows[0].tanggal).slice(0, 10)
      if (tgl !== today) {
        return res.status(403).json({ error: 'Mandor hanya bisa mengubah data tanggal hari ini' })
      }
    }

    let { rows: lama } = await client.query(
      'SELECT ongkos_kerja_saat_ini FROM produksi_detail WHERE id_produksi = $1 AND ongkos_kerja_saat_ini > 0 LIMIT 1',
      [id],
    )
    let ongkos = Number(lama[0]?.ongkos_kerja_saat_ini ?? 0)
    if (ongkos <= 0 && rows[0].id_sepatu) {
      const { rows: sepatu } = await client.query(
        'SELECT ongkos_kerja FROM tipe_sepatu WHERE id_sepatu = $1',
        [rows[0].id_sepatu],
      )
      ongkos = Number(sepatu[0]?.ongkos_kerja ?? 0)
    }

    const allUkuran = await listUkuran()
    const labelToId = {}
    for (const u of allUkuran) labelToId[u.label_ukuran] = u.id_ukuran

    let detailItems = qtyPerUkuran
    if (!Array.isArray(detailItems) && sizes && typeof sizes === 'object') {
      detailItems = Object.entries(sizes).map(([lbl, q]) => ({
        id_ukuran: labelToId[lbl] || Number(lbl),
        qty: Number(q) || 0,
      }))
    }

    await client.query('BEGIN')
    await client.query('DELETE FROM produksi_detail WHERE id_produksi = $1', [id])
    if (Array.isArray(detailItems)) {
      for (const d of detailItems) {
        const qty = Number(d.qty) || 0
        if (qty <= 0) continue
        await client.query(
          'INSERT INTO produksi_detail (id_produksi, id_ukuran, qty, ongkos_kerja_saat_ini) VALUES ($1, $2, $3, $4)',
          [id, Number(d.id_ukuran), qty, ongkos],
        )
      }
    }
    await client.query('COMMIT')
    res.json({ ok: true, id: String(id), id_produksi: id })
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
})

// Update full entry
router.put('/:id', async (req, res) => {
  const client = await pool.connect()
  try {
    const id = Number(req.params.id)
    const { sizes, qtyPerUkuran, shift, id_sepatu, model_id } = req.body ?? {}
    const resolvedSepatu = id_sepatu || model_id

    await client.query('BEGIN')
    if (shift !== undefined) {
      await client.query('UPDATE produksi_harian SET shift = $1 WHERE id_produksi = $2', [Number(shift), id])
    }
    if (resolvedSepatu !== undefined) {
      await client.query('UPDATE produksi_harian SET id_sepatu = $1 WHERE id_produksi = $2', [Number(resolvedSepatu), id])
    }
    if (sizes || qtyPerUkuran) {
      // update detail
      const allUkuran = await listUkuran()
      const labelToId = {}
      for (const u of allUkuran) labelToId[u.label_ukuran] = u.id_ukuran

      let detailItems = qtyPerUkuran
      if (!Array.isArray(detailItems) && sizes && typeof sizes === 'object') {
        detailItems = Object.entries(sizes).map(([lbl, q]) => ({
          id_ukuran: labelToId[lbl] || Number(lbl),
          qty: Number(q) || 0,
        }))
      }

      let { rows: lama } = await client.query(
        'SELECT ongkos_kerja_saat_ini FROM produksi_detail WHERE id_produksi = $1 AND ongkos_kerja_saat_ini > 0 LIMIT 1',
        [id],
      )
      const ongkos = Number(lama[0]?.ongkos_kerja_saat_ini ?? 0)

      await client.query('DELETE FROM produksi_detail WHERE id_produksi = $1', [id])
      if (Array.isArray(detailItems)) {
        for (const d of detailItems) {
          const qty = Number(d.qty) || 0
          if (qty <= 0) continue
          await client.query(
            'INSERT INTO produksi_detail (id_produksi, id_ukuran, qty, ongkos_kerja_saat_ini) VALUES ($1, $2, $3, $4)',
            [id, Number(d.id_ukuran), qty, ongkos],
          )
        }
      }
    }
    await client.query('COMMIT')
    res.json({ id: String(id), id_produksi: id, ok: true })
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
})

// Hapus produksi
router.delete('/:id', async (req, res) => {
  const client = await pool.connect()
  try {
    const id = Number(req.params.id)
    const { rows } = await client.query('SELECT * FROM produksi_harian WHERE id_produksi = $1', [id])
    if (!rows[0]) return res.status(404).json({ error: 'Data tidak ditemukan' })

    if (req.user.role === 'mandor') {
      const today = todayStr()
      const tgl = String(rows[0].tanggal).slice(0, 10)
      if (tgl !== today) {
        return res.status(403).json({ error: 'Mandor hanya bisa menghapus data tanggal hari ini' })
      }
    }

    await client.query('BEGIN')
    await client.query('DELETE FROM produksi_detail WHERE id_produksi = $1', [id])
    await client.query('DELETE FROM produksi_harian WHERE id_produksi = $1', [id])
    await client.query('COMMIT')
    res.json({ ok: true, success: true })
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
})

export default router
