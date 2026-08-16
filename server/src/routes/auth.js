import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { findUserByUsername, findUserById, findUserByGroupAndRole } from '../store.js'
import { signToken, authRequired, attachUser } from '../auth.js'

const router = Router()

function toPublic(u) {
  const nama = u.nama === 'Si A' ? 'Admin' : u.nama
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    nama,
    status_aktif: u.status_aktif,
  }
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body ?? {}
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' })
    }
    const user = await findUserByUsername(username.trim())
    if (!user) return res.status(401).json({ error: 'Username atau password salah' })
    if (user.status_aktif !== 1) return res.status(401).json({ error: 'Akun dinonaktifkan' })

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Username atau password salah' })

    if (user.nama === 'Si A') {
      try {
        await pool.query("UPDATE users SET nama = 'Admin' WHERE id = $1", [user.id])
        user.nama = 'Admin'
      } catch {
        // abaikan
      }
    }

    const token = signToken(user)
    res.json({ token, user: toPublic(user) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/me', authRequired, attachUser, async (req, res) => {
  const user = await findUserById(req.userId)
  if (user && user.nama === 'Si A') {
    try {
      await pool.query("UPDATE users SET nama = 'Admin' WHERE id = $1", [user.id])
      user.nama = 'Admin'
    } catch {
      // abaikan
    }
  }
  res.json({ user: toPublic(user) })
})

// Ganti peran (admin <-> mandor) ke akun pasangan dalam switch_group yang sama.
// Tidak butuh password karena kedua akun sudah "diikat" oleh pemilik di grup.
router.post('/switch', authRequired, attachUser, async (req, res) => {
  try {
    const { role } = req.body ?? {}
    if (role !== 'admin' && role !== 'mandor') {
      return res.status(400).json({ error: 'Role tidak valid' })
    }
    const me = req.user
    if (me.switch_group == null) {
      return res.status(403).json({ error: 'Akun ini tidak diizinkan berpindah peran' })
    }
    if (me.role === role) {
      return res.json({ token: signToken(me), user: toPublic(me) })
    }
    const target = await findUserByGroupAndRole(me.switch_group, role)
    if (!target) {
      return res.status(404).json({ error: 'Belum ada akun untuk peran tersebut' })
    }
    const token = signToken(target)
    res.json({ token, user: toPublic(target) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
