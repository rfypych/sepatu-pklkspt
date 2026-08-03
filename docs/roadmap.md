# Roadmap Implementasi

Urutan kerja dipecah supaya bisa **langsung dicoba Si A lebih awal** (fitur input mandor duluan) dan risiko kecil.

## Fase 0 — Persiapan (1–2 hari)
- [ ] Setup repo git.
- [ ] Setup project `web/` (Vite + React + TS + Tailwind).
- [ ] Setup Supabase project + jalankan `docs/database-schema.sql` sebagai migrasi awal.
- [ ] Seed data awal: 4 model sepatu (ongkos sementara), ukuran 36–44, beberapa akun user & pekerja uji.

## Fase 1 — Autentikasi (1 hari)
- [ ] Halaman login (username + password) memakai Supabase Auth.
- [ ] Role `admin` vs `mandor` → routing terpisah setelah login.
- [ ] Proteksi route (belum login → arahkan ke /login).

## Fase 2 — Modul Mandor (3–5 hari) — PRIORITAS TERTINGGI
- [ ] Layout mobile-first, tombol besar, sticky button.
- [ ] Wizard input: Pekerja → Shift → Model → Qty per ukuran → Ringkasan & SIMPAN.
- [ ] Input qty pakai numpad (`type="number"`), default 0, validasi qty >= 0.
- [ ] Simpan header + detail dengan snapshot ongkos (sekali transaksi).
- [ ] Halaman "Riwayat Hari Ini": daftar data yang sudah diinput + edit/hapus (hari yang sama).

## Fase 3 — Modul Admin: Master Data (2–3 hari)
- [ ] Kelola Pekerja (CRUD + aktif/nonaktif).
- [ ] Kelola Model & Ongkos Kerja (CRUD + aktif/nonaktif).
- [ ] Kelola Ukuran aktif (checkbox 36–44 + tambah ukuran baru).
- [ ] Kelola pengguna (buat akun mandor baru).

## Fase 4 — Dashboard & Payroll (2–3 hari)
- [ ] Dashboard live: total produksi hari ini, filter pekerja/model/tanggal.
- [ ] Subscriptions Realtime supaya update otomatis saat mandor simpan.
- [ ] Payroll: pilih bulan → otomatis 2 periode → tabel rekap per pekerja + per model.
- [ ] Total gaji = Σ (qty × ongkos snapshot).
- [ ] Export Excel / PDF / cetak.

## Fase 5 — Pengujian & Perbaikan (2–3 hari)
- [ ] Uji alur mandor di HP sungguhan (bukan emulator).
- [ ] Uji kalkulasi gaji dengan data contoh → bandingkan dengan hitungan manual.
- [ ] Uji kasus: ubah harga model → cek rekap periode lama tidak berubah.
- [ ] Minta feedback Si A & 1–2 mandor lapangan.

## Fase 6 — Go-Live & Mobile Wrapper (opsional, 1–2 hari)
- [ ] Deploy frontend ke Vercel.
- [ ] Bungkus WebView → APK untuk HP mandor (opsional).
- [ ] Backup database terjadwal (Supabase automatic backup / manual export).

---

## Estimasi Total: ± 2–3 minggu kerja efektif

## Urutan Prioritas Jika Waktu Terbatas
1. **Fase 2 (input mandor)** — inti bisnis, tanpa ini mandor tetap catat manual.
2. **Fase 4 (payroll)** — alasan utama Si A mau "otomatis".
3. **Fase 3 (master data)** — biar Si A bisa ubah-ubah sendiri.
4. **Fase 6 (APK/deploy)** — penyempurnaan.
