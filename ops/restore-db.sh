#!/usr/bin/env bash
# ==========================================================================
# Restore database sepatu-pklkspt dari file backup.
#
# Pakai:
#   ./restore-db.sh                       -> pakai backup harian TERBARU
#   ./restore-db.sh /path/ke/file.dump    -> pakai file tertentu
#
# Skrip ini SENGAJA bertanya konfirmasi karena menimpa seluruh data
# yang ada sekarang.
# ==========================================================================
set -uo pipefail

CONTAINER="sepatu_postgres"
DB_NAME="sepatu_db"
DB_USER="sepatu_user"
DEST="/var/backups/sepatu"

SUMBER="${1:-}"
if [ -z "$SUMBER" ]; then
  SUMBER=$(ls -1t "$DEST"/harian/*.dump 2>/dev/null | head -1)
  [ -n "$SUMBER" ] || { echo "Tidak ada file backup di $DEST/harian"; exit 1; }
fi
[ -f "$SUMBER" ] || { echo "File tidak ditemukan: $SUMBER"; exit 1; }

echo "File backup : $SUMBER"
echo "Ukuran      : $(stat -c%s "$SUMBER") byte"
echo "Dibuat      : $(stat -c%y "$SUMBER")"
echo
echo "Isi backup (jumlah baris per tabel akan dipulihkan ke kondisi saat backup dibuat)."
echo "PERINGATAN: seluruh data di database '$DB_NAME' SEKARANG akan DITIMPA."
read -r -p "Lanjutkan? ketik YA: " jawab
[ "$jawab" = "YA" ] || { echo "Dibatalkan."; exit 0; }

# Kondisi sekarang, untuk dibandingkan setelah restore.
echo
echo "--- sebelum restore ---"
docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
  "SELECT (SELECT count(*) FROM produksi_harian) AS produksi, (SELECT count(*) FROM pekerja) AS pekerja;"

# --clean --if-exists: hapus objek lama dulu, jadi hasilnya bersih
# bukan campuran data lama + baru.
docker exec -i "$CONTAINER" pg_restore -U "$DB_USER" -d "$DB_NAME" \
  --clean --if-exists --no-owner --no-privileges < "$SUMBER"

echo
echo "--- sesudah restore ---"
docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
  "SELECT (SELECT count(*) FROM produksi_harian) AS produksi, (SELECT count(*) FROM produksi_detail) AS detail, (SELECT count(*) FROM pekerja) AS pekerja, (SELECT count(*) FROM users) AS users;"
echo "Selesai. Restart API supaya koneksi pool-nya segar:  docker restart sepatu_api"
