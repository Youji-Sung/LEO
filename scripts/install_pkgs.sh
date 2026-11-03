#!/bin/bash
# 클라우드 세션에서만 동작. package.json 이 아직 없으면(0단계 전) 아무것도 하지 않는다.

if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 1

if [ ! -f package.json ]; then
  exit 0
fi

hashes=node_modules/.install_pkgs.sha256
lock=package-lock.json
[ -f pnpm-lock.yaml ] && lock=pnpm-lock.yaml
[ -f yarn.lock ] && lock=yarn.lock

if ! sha256sum --check --status "$hashes" 2>/dev/null; then
  rm -f "$hashes"
  ok=0
  case "$lock" in
    pnpm-lock.yaml) pnpm install --frozen-lockfile && ok=1 ;;
    yarn.lock)      yarn install --frozen-lockfile && ok=1 ;;
    *)              npm install && ok=1 ;;
  esac
  if [ "$ok" = "1" ]; then
    mkdir -p node_modules
    sha256sum scripts/install_pkgs.sh package.json "$lock" > "$hashes" 2>/dev/null || rm -f "$hashes"
  fi
fi

if [ -f prisma/schema.prisma ] && [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

exit 0
