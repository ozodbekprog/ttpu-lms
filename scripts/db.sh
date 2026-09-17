#!/usr/bin/env bash
set -euo pipefail

PGDATA="${PGDATA:-$HOME/.local/share/ttpu-pg/data}"
LOGDIR="$HOME/.local/share/ttpu-pg"
PORT="${PGPORT:-5433}"

mkdir -p "$LOGDIR"

if [ ! -d "$PGDATA" ]; then
  echo ">> PostgreSQL klasterini yaratish: $PGDATA"
  initdb -D "$PGDATA" -U "$USER" --auth=trust --encoding=UTF8 --locale=C.UTF-8 >/dev/null
fi

if ! pg_ctl -D "$PGDATA" status >/dev/null 2>&1; then
  echo ">> PostgreSQL ishga tushirilmoqda (port $PORT)"
  pg_ctl -D "$PGDATA" -o "-p $PORT -k /tmp" -l "$LOGDIR/log" start >/dev/null
  sleep 1
fi

createdb -h localhost -p "$PORT" -U "$USER" ttpu_lms 2>/dev/null || true

echo ">> DB tayyor: postgresql://$USER@localhost:$PORT/ttpu_lms"
