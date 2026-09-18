#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

LOG="/tmp/ttpu-prod.log"
PID_FILE="/tmp/ttpu-prod.pid"
PORT="${PORT:-3000}"

echo "== TTPU LMS deploy =="

echo ">> 1/5 PostgreSQL ishga tushirilmoqda"
bash scripts/db.sh

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo ">> Eski production server to'xtatilmoqda (pid $(cat "$PID_FILE"))"
  kill "$(cat "$PID_FILE")" 2>/dev/null || true
  sleep 1
fi

echo ">> 2/5 Build (npm run build)"
npm run build

echo ">> 3/5 Server fon rejimida ishga tushirilmoqda"
nohup npm start >"$LOG" 2>&1 &
echo $! >"$PID_FILE"
echo "   pid: $(cat "$PID_FILE") | log: $LOG"

echo ">> 4/5 Health tekshiruvi (http://localhost:$PORT/api/health)"
HEALTH=""
for _ in $(seq 1 10); do
  sleep 1
  if HEALTH=$(curl -fsS "http://localhost:$PORT/api/health" 2>/dev/null); then
    break
  fi
done

echo ">> 5/5 Natija"
if printf '%s' "$HEALTH" | grep -q '"db":true'; then
  echo "== MUVAFFAQIYAT: TTPU LMS production ishlamoqda — http://localhost:$PORT =="
else
  echo "== XATO: server ko'tarilmadi yoki DB javob bermadi =="
  echo "   Log (oxirgi 20 qator):"
  tail -20 "$LOG" 2>/dev/null || true
  exit 1
fi

if [ "${TUNNEL:-0}" = "1" ]; then
  echo ""
  echo ">> TUNNEL=1: cloudflared tekshirilmoqda"
  if command -v cloudflared >/dev/null 2>&1; then
    echo "   cloudflared mavjud. Quick tunnel uchun:"
    echo "   cloudflared tunnel --url http://localhost:$PORT"
  else
    echo "   cloudflared topilmadi. O'rnatish:"
    echo "   https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  fi
fi
