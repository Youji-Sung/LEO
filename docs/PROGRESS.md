# 진행 기록

세션이 단계별 완료 조건을 확인한 결과를 적는다. 형식: `- [x|미확인] 조건 — 확인 방법 — 결과`

## 0단계. 부트스트랩

- [x] 새 클론에서 `bash scripts/bootstrap.sh && npm run check` 통과 — 추적 파일만 tar 로 복사한 빈 디렉터리에서 실행(node_modules·.env·generated 없음) — bootstrap 29초(.env 생성, AUTH_SECRET 생성, npm install, prisma generate, migrate deploy, seed), check 13초, 종료 코드 0
- [x] `npm run dev`로 빈 홈 화면 — `next dev --port 3200` 띄우고 `curl /` — `<h1>LEO</h1>`와 안내 문구 응답(HTTP 200)
- [x] E2E 브라우저 — Playwright 번들 Chromium(1243)과 `CHROME_PATH`(/usr/bin/google-chrome 153) 둘 다 `chromium.launch()`로 페이지 렌더 확인
- [x] 스크립트 목록 — `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `check`, `db:migrate`, `db:seed`(추가: `db:migrate:dev`, `db:generate`)

## 1단계. 데이터 모델과 인증

- [x] 회원가입→로그인→보호 페이지 접근→로그아웃 통합 테스트 — `tests/integration/auth.test.ts`: Route Handler 를 `NextRequest` 로 직접 호출(가입 201·중복 409·잘못된 입력 400, `/api/auth/me` 200→로그아웃 후 401, 잘못된 비밀번호 401, 대소문자 다른 이메일 로그인 200) — 7개 테스트 통과(`npm test`)
- [x] 브라우저 흐름 — `e2e/auth.spec.ts`: 미로그인 `/`→`/login` 리다이렉트, 로그인→홈(이름 표시)→로그아웃→다시 `/login`, 잘못된 비밀번호 오류 표시, 회원가입 직후 로그인 상태 — 4개 통과(13초)
- [x] 마이그레이션이 깨끗한 DB 에 적용 — 빈 경로에 `DATABASE_URL=file:…/clean.db prisma migrate deploy` 후 `migrate status` 와 sqlite_master 조회 — "Database schema is up to date", 테이블 8개(Conversation, Message, Portfolio, Report, Session, UsageRecord, User, UserSettings)
- [x] 시드 — `npm run db:seed` 가 dev1@leo.local, dev2@leo.local 2명을 upsert(비밀번호 `SEED_USER_PASSWORD`, 기본 leo-pass-1234)
- 메모: Next 16 개발 서버는 `127.0.0.1` 로 접근하면 HMR/RSC 요청을 교차 출처로 차단해 하이드레이션이 끝나지 않는다. `next.config.ts` 의 `allowedDevOrigins` 에 127.0.0.1 을 넣고 E2E 는 `localhost` 를 쓴다. 프로덕션(`next start`)은 영향 없음(하이드레이션 214ms 확인).
