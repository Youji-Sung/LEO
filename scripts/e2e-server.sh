#!/bin/bash
# E2E 전용 서버: 모의 Claude, 별도 SQLite 파일(프로젝트 루트의 e2e.db), 짧은 통화 시간 허용.
set -euo pipefail
cd "$(dirname "$0")/.."
port="${1:-3100}"
if [ -f e2e.db ]; then rm -f e2e.db; fi
if [ -f e2e.db-journal ]; then rm -f e2e.db-journal; fi
export DATABASE_URL="file:./e2e.db"
export CLAUDE_MOCK=1
export AUTH_SECRET="${AUTH_SECRET:-e2e-secret-e2e-secret-e2e-secret-0000}"
export SEED_USER_PASSWORD="${SEED_USER_PASSWORD:-leo-pass-1234}"
export LEO_ALLOW_SHORT_CALLS=1
npx prisma migrate deploy >/dev/null
npx tsx prisma/seed.ts >/dev/null
exec npx next dev --port "$port"
