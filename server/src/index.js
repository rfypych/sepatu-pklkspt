import app from './app.js'

// Entry untuk dev lokal (Node langsung). Di Vercel, file api/index.js yang dipakai.
const PORT = Number(process.env.PORT || 3000)
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`)
})
