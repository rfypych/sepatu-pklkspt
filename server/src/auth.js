import jwt from 'jsonwebtoken'
import { findUserById } from './store.js'

const SECRET = process.env.JWT_SECRET || 'sepatu-dev-secret'
const EXPIRES = '30d'

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: EXPIRES })
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Belum login' })
  try {
    const payload = jwt.verify(token, SECRET)
    req.userId = payload.id
    req.userRole = payload.role
    next()
  } catch {
    return res.status(401).json({ error: 'Sesi tidak valid, silakan login ulang' })
  }
}

export async function attachUser(req, res, next) {
  try {
    req.user = await findUserById(req.userId)
    if (!req.user || req.user.status_aktif !== 1) {
      return res.status(401).json({ error: 'Akun tidak aktif' })
    }
    next()
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

export function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Khusus admin' })
  }
  next()
}
