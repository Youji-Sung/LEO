# 진행 기록

세션이 단계별 완료 조건을 확인한 결과를 적는다. 형식: `- [x|미확인] 조건 — 확인 방법 — 결과`

## 0단계. 부트스트랩

- [x] 새 클론에서 `bash scripts/bootstrap.sh && npm run check` 통과 — 추적 파일만 tar 로 복사한 빈 디렉터리에서 실행(node_modules·.env·generated 없음) — bootstrap 29초(.env 생성, AUTH_SECRET 생성, npm install, prisma generate, migrate deploy, seed), check 13초, 종료 코드 0
- [x] `npm run dev`로 빈 홈 화면 — `next dev --port 3200` 띄우고 `curl /` — `<h1>LEO</h1>`와 안내 문구 응답(HTTP 200)
- [x] E2E 브라우저 — Playwright 번들 Chromium(1243)과 `CHROME_PATH`(/usr/bin/google-chrome 153) 둘 다 `chromium.launch()`로 페이지 렌더 확인
- [x] 스크립트 목록 — `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `check`, `db:migrate`, `db:seed`(추가: `db:migrate:dev`, `db:generate`)
