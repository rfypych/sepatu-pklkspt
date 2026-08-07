import pg from 'pg'

const { Pool, types } = pg

// Neon/Postgres mengembalikan kolom DATE sebagai string 'YYYY-MM-DD' oleh
// parser bawaan, dan NUMERIC sebagai string juga (sama seperti MySQL dateStrings).
// Biarkan parser default; driver pg sudah menangani keduanya.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon memerlukan TLS; nonaktifkan hanya untuk dev lokal (PGSSL=false).
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export default pool
