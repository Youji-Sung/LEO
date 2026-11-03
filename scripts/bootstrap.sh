#!/bin/bash
# 새 클론에서 한 번 실행: .env 준비 → 의존성 설치 → Prisma 생성 → 마이그레이션 → 시드.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[bootstrap] .env 를 .env.example 에서 만들었습니다."
fi

# AUTH_SECRET 이 비어 있으면 임의 값으로 채운다.
if grep -qE '^AUTH_SECRET=[[:space:]]*$' .env; then
  secret=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")
  node -e "
const fs = require('fs');
const s = fs.readFileSync('.env', 'utf8').replace(/^AUTH_SECRET=.*$/m, 'AUTH_SECRET=' + process.argv[1]);
fs.writeFileSync('.env', s);
" "$secret"
  echo "[bootstrap] AUTH_SECRET 을 생성했습니다."
fi

if [ ! -d node_modules ] || [ ! -f node_modules/.package-lock.json ]; then
  npm install
fi

npx prisma generate
npx prisma migrate deploy
npm run db:seed
echo "[bootstrap] 완료. npm run dev 로 시작하세요."
