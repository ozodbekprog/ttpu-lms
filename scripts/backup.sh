#!/usr/bin/env bash
set -euo pipefail
umask 077

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
PG_DB="${PG_DB:-ttpu_lms}"
STAMP="$(date +%F-%H%M)"
OUT="$BACKUP_DIR/ttpu-lms-$STAMP.sql.gz"
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"

mkdir -p "$BACKUP_DIR"
trap 'rm -f "$OUT"' ERR

if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump --no-owner --clean --if-exists "$DATABASE_URL" | gzip >"$OUT"
elif [ "$(id -un)" = "postgres" ]; then
  pg_dump --no-owner --clean --if-exists "$PG_DB" | gzip >"$OUT"
elif [ "$(id -u)" -eq 0 ] && command -v runuser >/dev/null 2>&1; then
  runuser -u postgres -- pg_dump --no-owner --clean --if-exists "$PG_DB" | gzip >"$OUT"
elif command -v sudo >/dev/null 2>&1; then
  sudo -u postgres pg_dump --no-owner --clean --if-exists "$PG_DB" | gzip >"$OUT"
else
  echo "XATO: pg_dump uchun DATABASE_URL yoki postgres/sudo huquqi kerak" >&2
  exit 1
fi

gzip -t "$OUT"
find "$BACKUP_DIR" -maxdepth 1 -name 'ttpu-lms-*.sql.gz' -type f -mtime "+${KEEP_DAYS}" -delete

echo "Backup tayyor: $OUT ($(du -h "$OUT" | cut -f1))"
echo "Rotation: ${KEEP_DAYS} kun | papka: $BACKUP_DIR"
echo "Kunlik cron (root): 0 3 * * * $SELF >> /var/log/ttpu-backup.log 2>&1"
