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

## 2단계. Claude 서비스 계층

- [x] `/claude-api` 스킬 로드 후 TypeScript README·streaming·structured outputs·모델 마이그레이션(Opus 5 fallbacks) 문서 확인, 설치된 SDK 1.4.0 타입 정의로 `fallbacks: "default"`, `output_config.format`, `betaZodOutputFormat` 시그니처 대조
- [x] 단위 테스트 — `tests/unit/{hint-splitter,mock-provider,report-schema,pricing}.test.ts`: 모의 스트리밍 조립(델타 합 = 최종 텍스트, 힌트 분리), 리포트 스키마 검증·정규화(점수 1~10 클램프, 항목 수 제한), 단가 계산, 거부/오류/스키마 실패 트리거 — 통과
- [x] 사용량 기록·턴 상한 — `tests/integration/usage-and-turncap.test.ts`: `recordUsage` 가 토큰 4종·추정 비용·지연 저장, `assertTurnAllowed` 가 상한 도달 시 `TurnCapError`, `LEO_MAX_TURNS` 파싱 — 통과 (`npm test` 26개 통과)
- [x] 실제 API 스모크(1회) — `npx tsx scripts/smoke-claude.ts`, 6줄 면접 트랜스크립트로 `generateReport` 1회 — `stop_reason=end_turn`, `model=claude-opus-5`, 지연 49.6초, usage input 258 / output 3360 / cache_write 3237 / cache_read 0, 추정 비용 $0.1055. 리포트 파싱 성공: 교정 8개, 어휘 10개, 과제 3개, 면접 항목 포함, 요약·코멘트 한국어
- 미확인: 실제 API 로 `chatTurn`(effort low, 힌트 형식) 은 호출하지 않았다(스모크 1회 규칙). 리포트 호출로 스트리밍·`fallbacks: "default"`·`cache_control`·구조화 출력은 검증됨

## 3단계. 텍스트 채팅

- [x] 모의 모드 E2E 로그인→새 채팅→메시지 3회→리포트 생성 — `e2e/chat.spec.ts`: 면접 테마·힌트 켬으로 새 채팅, 메시지 3회(스트리밍 말풍선이 사라지고 저장된 답변 3개 확인, 힌트 표시), 새로고침 후 사용자·상대 메시지 3개씩 유지, "리포트 생성" → `/history/{id}/report` 로 이동해 요약·점수 4개·면접 피드백 렌더, 채팅으로 돌아가면 종료 표시 — 통과. 힌트 끔 시 힌트 없음도 통과 (2개, 18초)
- [x] API 통합 테스트 — `tests/integration/chat.test.ts`(10개): 대화 생성/목록/조회, 잘못된 테마 400, 타인 대화 404, NDJSON 스트림(델타 합 = 최종 답변, 힌트·제목·사용량 저장), 힌트 끔, 거부→error(refusal) 이벤트와 사용자 메시지 유지, 제공자 오류→error 이벤트, 턴 상한 429, 리포트 생성·조회·대화 종료·사용량 기록, 스키마 실패 502, 클라이언트가 스트림을 끊어도 답변 저장 — 통과
- [x] `npm run check` 통과 후 커밋
- 발견한 버그: 스트림 제너레이터가 클라이언트 연결 종료 시 중간에 닫혀 답변이 저장되지 않았다(E2E 새로고침에서 발견). 제공자 호출을 큐 기반 파이프라인으로 분리해 소비자와 무관하게 끝까지 저장하도록 고침
