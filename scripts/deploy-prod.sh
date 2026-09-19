#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-lms.ttpu.uz}"
APP_DIR="${APP_DIR:-/opt/ttpu-lms}"
APP_USER="${APP_USER:-ttpu}"
REPO_URL="${REPO_URL:-https://github.com/ozodbekprog/ttpu-lms.git}"
SRC_DIR="${SRC_DIR:-}"
NODE_MAJOR="${NODE_MAJOR:-22}"
PG_DB="${PG_DB:-ttpu_lms}"
PORT="${PORT:-3000}"
SERVICE_WEB="ttpu-lms"
SERVICE_BOT="ttpu-bot"

log() { printf '>> %s\n' "$*"; }
die() { printf 'XATO: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "root sifatida ishga tushiring: sudo bash scripts/deploy-prod.sh"

run_app() {
  runuser -u "$APP_USER" -- bash -lc "cd '$APP_DIR' && $*"
}

health_check() {
  local health=""
  for _ in $(seq 1 30); do
    sleep 1
    health="$(curl -fsS "http://localhost:${PORT}/api/health" 2>/dev/null || true)"
    if printf '%s' "$health" | grep -q '"db":true'; then
      log "Health OK: http://localhost:${PORT}/api/health"
      return 0
    fi
  done
  journalctl -u "$SERVICE_WEB" -n 20 --no-pager || true
  die "server ko'tarilmadi — journalctl -u $SERVICE_WEB"
}

log "TTPU LMS production deploy (domen: $DOMAIN, papka: $APP_DIR)"
export DEBIAN_FRONTEND=noninteractive

log "1/7 Tizim paketlari"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git rsync openssl postgresql

if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/^v//' | cut -d. -f1)" != "$NODE_MAJOR" ]; then
  log "Node.js $NODE_MAJOR o'rnatilmoqda"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

if ! command -v caddy >/dev/null 2>&1; then
  log "Caddy o'rnatilmoqda"
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

log "2/7 PostgreSQL"
systemctl enable --now postgresql

log "3/7 Foydalanuvchi: $APP_USER"
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "$APP_DIR" --shell /bin/bash "$APP_USER"
else
  log "Foydalanuvchi allaqachon mavjud"
fi

if [ -n "$SRC_DIR" ]; then
  log "4/7 rsync: $SRC_DIR -> $APP_DIR"
  [ -d "$SRC_DIR" ] || die "SRC_DIR topilmadi: $SRC_DIR"
  mkdir -p "$APP_DIR"
  rsync -a --delete --exclude .git --exclude node_modules --exclude .next --exclude .npm --exclude .env "$SRC_DIR/" "$APP_DIR/"
elif [ -d "$APP_DIR/.git" ]; then
  log "4/7 Repo yangilanmoqda (git pull)"
  git -C "$APP_DIR" pull --ff-only
else
  if [ -d "$APP_DIR" ] && [ -n "$(ls -A "$APP_DIR" 2>/dev/null)" ]; then
    die "$APP_DIR bo'sh emas va git repo ham emas (SRC_DIR dan foydalaning)"
  fi
  log "4/7 Repo klonlanmoqda (birinchi deploy)"
  git clone "$REPO_URL" "$APP_DIR"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  log "5/7 .env yaratilmoqda + PostgreSQL role/baza"
  DB_PASS="$(openssl rand -hex 16)"
  AUTH_SECRET="$(openssl rand -hex 32)"
  runuser -u postgres -- psql -v ON_ERROR_STOP=1 -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$APP_USER') THEN CREATE ROLE $APP_USER LOGIN PASSWORD '$DB_PASS'; ELSE ALTER ROLE $APP_USER WITH LOGIN PASSWORD '$DB_PASS'; END IF; END \$\$;"
  if ! runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_database WHERE datname = '$PG_DB'" | grep -q 1; then
    runuser -u postgres -- createdb -O "$APP_USER" "$PG_DB"
  fi
  cat > "$ENV_FILE" <<EOF
DATABASE_URL="postgresql://${APP_USER}:${DB_PASS}@localhost:5432/${PG_DB}?schema=public"
AUTH_SECRET="${AUTH_SECRET}"
UPLOAD_DIR="./public/uploads"
TELEGRAM_BOT_TOKEN=""
APP_URL="https://${DOMAIN}"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM="no-reply@ttpu.uz"
EOF
  chown "$APP_USER:$APP_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
else
  log "5/7 .env mavjud — o'zgartirilmadi ($ENV_FILE)"
fi

mkdir -p "$APP_DIR/public/uploads"
chown -R "$APP_USER:$APP_USER" "$APP_DIR/public/uploads"

log "6/7 Ilova: npm ci + prisma + build"
run_app "npm ci"
run_app "npx prisma generate"
run_app "npx prisma migrate deploy"
run_app "npm run build"

log "7/7 systemd + Caddy"
install -m 644 "$APP_DIR/deploy/${SERVICE_WEB}.service" "/etc/systemd/system/${SERVICE_WEB}.service"
install -m 644 "$APP_DIR/deploy/${SERVICE_BOT}.service" "/etc/systemd/system/${SERVICE_BOT}.service"
systemctl daemon-reload
systemctl enable "$SERVICE_WEB" "$SERVICE_BOT"

sed "s/lms\.ttpu\.uz/${DOMAIN}/g" "$APP_DIR/deploy/Caddyfile" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile >/dev/null
systemctl enable caddy
systemctl reload caddy 2>/dev/null || systemctl restart caddy
systemctl restart "$SERVICE_WEB" "$SERVICE_BOT"

health_check

cat <<EOF

== Deploy tayyor ==
Sayt:    https://${DOMAIN}
Health:  http://localhost:${PORT}/api/health
Servis:  systemctl status ${SERVICE_WEB} ${SERVICE_BOT} caddy
Log:     journalctl -u ${SERVICE_WEB} -f
Backup:  bash ${APP_DIR}/scripts/backup.sh

Keyingi qadam: ${ENV_FILE} ichida TELEGRAM_BOT_TOKEN va SMTP_* ni to'ldiring,
so'ng: systemctl restart ${SERVICE_WEB} ${SERVICE_BOT}
EOF
