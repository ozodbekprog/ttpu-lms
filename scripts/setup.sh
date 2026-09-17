#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== TTPU LMS setup =="

echo ">> 1/4 Kutubxonalar o'rnatilmoqda (npm install)"
npm install

echo ">> 2/4 PostgreSQL (user-space klaster)"
bash scripts/db.sh

echo ">> 3/4 .env yaratilmoqda"
if [ ! -f .env ]; then
  SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | cut -c1-64)
  cat > .env <<EOF
DATABASE_URL="postgresql://$USER@localhost:${PGPORT:-5433}/ttpu_lms?schema=public"
AUTH_SECRET="$SECRET"
UPLOAD_DIR="./public/uploads"
EOF
  echo "   .env yaratildi"
else
  echo "   .env allaqachon mavjud — o'zgartirilmadi"
fi

echo ">> 4/4 Migratsiya + demo ma'lumotlar"
npx prisma migrate deploy
npm run db:seed

echo ""
echo "== TAYYOR! =="
echo "Ishga tushirish:  npm run dev   ->  http://localhost:3000"
echo "Demo loginlar (parol: ttpu1234): admin@ttpu.uz | n.mahamatov@ttpu.uz | ozodbek@ttpu.uz"
