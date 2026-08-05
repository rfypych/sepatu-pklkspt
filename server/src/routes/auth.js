import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { findUserByUsername, findUserById } from '../store.js'
import { signToken, authRequired, attachUser } from '../auth.js'

const router = Router()

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

    const token = signToken(user)
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nama: user.nama,
        status_aktif: user.status_aktif,
      },
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/me', authRequired, attachUser, async (req, res) => {
  const user = await findUserById(req.userId)
  res.json({ user })
})

export default router
