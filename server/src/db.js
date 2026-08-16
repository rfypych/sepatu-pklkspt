import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'

// Auto-load .env jika belum ter-load di local environment
if (!process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
  for (const name of ['.env', '.env.local', '../.env', '../.env.local']) {
    const envPath = path.resolve(process.cwd(), name)
    if (fs.existsSync(envPath)) {
      try {
        process.loadEnvFile(envPath)
        if (process.env.DATABASE_URL) break
      } catch {
        // abaikan
      }
    }
  }
}

const { Pool, types } = pg

// OID 1082 = DATE type in PostgreSQL.
// Pastikan tipe DATE dikembalikan sebagai string murni 'YYYY-MM-DD'
// bukan objek JavaScript Date, agar konsisten di serverless UTC vs waktu lokal WIB.
types.setTypeParser(1082, (val) => val)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon memerlukan TLS; nonaktifkan hanya untuk dev lokal (PGSSL=false).
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  max: Number(process.env.PG_MAX_POOL || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
})

export default pool
