# ops/ — Backup & Restore Database

Isi folder ini dijalankan di **VPS** (`ssh vps`), bukan di laptop.

## Di mana data aplikasi sebenarnya?

Ada **dua** database Postgres di proyek ini. Jangan tertukar:

| | Lokasi | Dipakai oleh | Status |
|---|---|---|---|
| **A. Neon (cloud)** | `DATABASE_URL` di env Production project `server` di Vercel | `web-phi-two-51.vercel.app` → `server-eta-six-49.vercel.app` | **INI YANG LIVE / DIPAKAI USER** |
| **B. VPS** | container `sepatu_postgres` di `157.15.1.177` (`/root/sepatu-pklkspt/docker-compose.yml`) | tidak ada yang menyambung dari luar | menganggur, isinya masih data seed |

Cara membuktikan API production **tidak** memakai VPS (sudah diuji 2026-08-26):
`log_connections=on` di Postgres VPS, lalu tembak `POST /api/auth/login` ke
`server-eta-six-49.vercel.app` beberapa kali → di log VPS **tidak muncul satu pun
koneksi remote**, hanya `[local]` dari `psql` dan `pg_isready`. Port 5432 juga
tidak bisa dijangkau dari internet (timeout), jadi Vercel memang tidak mungkin
menyambung ke sini.

> **Konsekuensi:** skrip backup di folder ini saat ini melindungi database **B (VPS)**,
> yang bukan data produksi. Selama produksi masih di Neon, backup ini belum melindungi
> data pabrik yang sesungguhnya. Dua jalan keluar: pindahkan produksi ke VPS, atau
> arahkan skrip ini ke Neon (butuh connection string Neon).

## Kenapa systemd timer, bukan cron

Server sering mati (token listrik habis). `cron` **melewatkan** jadwal yang jatuh saat
mesin mati dan tidak pernah mengejarnya. `systemd` timer dengan `Persistent=true`
mengejar jadwal yang terlewat **segera setelah VPS hidup kembali**. Untuk kasus
listrik byar-pet, ini bedanya antara punya backup dan tidak.

## Yang sudah terpasang di VPS

```
/root/sepatu-pklkspt/ops/backup-db.sh      # skrip backup
/root/sepatu-pklkspt/ops/restore-db.sh     # skrip restore (interaktif, minta konfirmasi)
/etc/systemd/system/sepatu-backup.service
/etc/systemd/system/sepatu-backup.timer    # enabled + running
/var/backups/sepatu/{harian,mingguan,bulanan}/
/var/log/sepatu-backup.log
```

Jadwal: **12:30 dan 21:30 WIB** (05:30 & 14:30 UTC). Jam 21:30 dipilih supaya shift 2
sudah selesai mencatat.

Retensi: 14 harian, 8 mingguan (tiap Senin), 6 bulanan (tiap tanggal 1). Salinan
mingguan/bulanan pakai *hard link*, jadi tidak memakan disk dua kali.

## Yang membedakan skrip ini dari `pg_dump` biasa

1. **Menunggu database benar-benar siap** (maks 60 detik). Setelah listrik mati,
   container bisa berstatus `Up` padahal Postgres masih *recovery* — dump di saat itu
   bisa gagal atau korup.
2. **Menguji hasil dump-nya sendiri** dengan `pg_restore --list` dan menghitung jumlah
   objek. Backup yang tidak pernah diuji bukan backup. Kalau file korup, ketahuan hari
   itu, bukan saat panik butuh restore.
3. **Menolak dump yang mencurigakan kecil** (<1KB atau ≤5 objek) daripada menimpa
   backup bagus dengan file kosong.
4. **Menulis penanda status** `/var/backups/sepatu/.last-success` dan `.last-failure`
   supaya mudah dipantau dari luar.

## Perintah harian

```bash
ssh vps

systemctl list-timers sepatu-backup      # kapan jalan berikutnya
tail -20 /var/log/sepatu-backup.log      # riwayat
ls -lh /var/backups/sepatu/harian/       # daftar backup
cat /var/backups/sepatu/.last-success    # terakhir sukses kapan
systemctl start sepatu-backup.service    # backup sekarang, manual
```

## Restore

```bash
ssh vps
/root/sepatu-pklkspt/ops/restore-db.sh                 # dari backup terbaru
/root/sepatu-pklkspt/ops/restore-db.sh /path/file.dump # dari file tertentu
docker restart sepatu_api                              # setelah restore
```

Skrip restore menampilkan jumlah baris **sebelum** dan **sesudah**, dan wajib
dikonfirmasi dengan mengetik `YA` karena menimpa seluruh data yang ada.

## Uji restore yang sudah dilakukan

Backup pertama (`sepatu_db-20260826-0229.dump`, 25 KB, 68 objek) di-restore ke database
sementara `uji_restore` — hasilnya: 2 users, 5 pekerja, 4 model, 9 ukuran, 0 produksi.
Cocok dengan isi database asli. Database uji langsung dihapus. Jadi jalur restore-nya
terbukti bekerja, bukan cuma diasumsikan.

## Yang BELUM aman (perlu keputusan)

1. **Backup masih satu mesin dengan databasenya.** Kalau disk VPS rusak atau VPS hilang,
   backup ikut hilang. Perlu salinan ke luar (Google Drive / R2 / B2 via `rclone`, atau
   `scp` terjadwal ke laptop).
2. **Kredensial di `docker-compose.yml` masih hardcoded dan lemah**
   (`POSTGRES_PASSWORD: sepatu_password_2026`, `JWT_SECRET: sepatu-super-secret-jwt-key-2026`).
   Sebaiknya dipindah ke file `.env` yang tidak masuk git.
3. **Port 5432 dipublikasikan ke `0.0.0.0`** oleh Docker dan `ufw` tidak aktif. Saat ini
   selamat hanya karena firewall di sisi provider/ISP. Kalau VPS nanti dipakai sebagai
   database produksi, port ini harus dibatasi.
