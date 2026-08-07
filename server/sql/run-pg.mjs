import fs from 'fs'
import pg from 'pg'

const url = process.argv[2]
const file = process.argv[3]

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
const sql = fs.readFileSync(file, 'utf8')
await client.query(sql)
console.log(`OK: ${file}`)
await client.end()