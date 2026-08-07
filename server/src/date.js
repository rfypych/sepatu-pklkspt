// Tanggal "hari ini" dalam zona waktu pabrik (default WIB / UTC+7).
// Serverless (Vercel) berjalan di UTC, jadi new Date().toISOString()
// bisa menghasilkan tanggal H-1 saat jam 00:00-06:59 WIB.
// Bisa disesuaikan lewat env TZ_OFFSET_HOURS bila pabrik di zona lain.
const OFFSET_HOURS = Number(process.env.TZ_OFFSET_HOURS || 7)

export function todayStr() {
  const d = new Date(Date.now() + OFFSET_HOURS * 3600 * 1000)
  return d.toISOString().slice(0, 10)
}
