import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import masterRoutes from './routes/master.js'
import produksiRoutes from './routes/produksi.js'
import payrollRoutes from './routes/payroll.js'
import dashboardRoutes from './routes/dashboard.js'
import devRoutes from './routes/dev.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api', devRoutes)
app.use('/api', masterRoutes)
app.use('/api/produksi', produksiRoutes)
app.use('/api/payroll', payrollRoutes)
app.use('/api/dashboard', dashboardRoutes)

// 404
app.use((_req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan' }))

// error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

export default app
