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

## 4단계. 전화 영어

- [x] 가짜 VoiceAdapter 주입 E2E 통화 시작→발화 3회→타이머 만료→리포트 — `e2e/call.spec.ts`: `window.__LEO_FAKE_VOICE` 로 가짜 어댑터 주입, 면접 테마·20초 통화(`LEO_ALLOW_SHORT_CALLS=1`), 마이크 권한 확인 → 다음 → 통화 시작, 첫 인사 TTS 확인, `__leoFakeVoice.say()` 3회마다 상대 답변 1개씩 추가, TTS 문장 4개 이상, 타이머 만료 후 `/history/{id}/report` 도착·점수 4개·면접 피드백 — 통과
- [x] 음소거/해제(인식 중지·재개)와 끊기→리포트, 음성 인식 미지원(가짜 어댑터 `stt:false`) 시 안내 문구와 텍스트 입력 대체 — 같은 spec 2개 통과 (3개, 37초)
- [x] VoiceAdapter 단위 테스트 — `tests/unit/voice.test.ts`(18개): 가짜 어댑터의 say→interim/final, speak 기록·취소, setSupport, 문장 분리기(스트리밍 델타·약어·소수점·줄바꿈·따옴표·flush) — 통과
- [x] 수동 점검 항목 README 에 기록(마이크 권한, TTS, 끼어들기, 음소거, 자동 재청취, 연장, 모바일 폭, 미지원 브라우저)
- 미확인: 실제 Chrome 에서 `SpeechRecognition`/`speechSynthesis` 동작(권한 팝업, 음성 재생, 끼어들기). 클라우드 세션에는 마이크·오디오 장치가 없어 사람이 README 체크리스트로 확인해야 한다

## 6단계. 사용량 페이지 (4단계와 병렬로 서브에이전트가 작성, 메인 세션이 검증)

- [x] 시드 데이터로 숫자 합산 테스트 — `tests/integration/usage-summary.test.ts`(6개): 사용자 2명·기능별 레코드를 알려진 값으로 넣고 전체 합계·사용자별·기능별 합, 기간 필터(30일은 40일 전 레코드 제외, 7d, today), `userId` 필터, 최근 호출 최신순·50건 상한(55건 삽입), GET `/api/usage` 401/400/200 — 통과
- [x] 화면 — `/usage`: 기간 선택(오늘/7일/30일/전체), 사용자 필터, 합계 카드(호출 수·토큰 4종·추정 비용), 사용자별·기능별·최근 50건 표(`caption`, `th scope`) — 빌드 통과, E2E `e2e/usage.spec.ts` 로 렌더 확인(아래 7단계 전 추가)

## 5단계. 리포트

- [x] 모의 리포트가 모든 항목을 렌더 — `tests/unit/report-view.test.tsx`: `ReportView` 를 `renderToStaticMarkup` 으로 렌더해 요약·종합 점수(4개, 포트폴리오면 5개)·문법 교정(원문/교정문/설명)·어휘 제안·더 나은 표현·다음 과제·면접 피드백·예상 질문이 모두 포함됨을 확인, 비면접 테마는 면접 항목 없음 — 통과. `e2e/report.spec.ts` 1번: 브라우저에서 7개 섹션 제목·점수 4개·교정 3개(원문 취소선/교정문) 확인, 기록 목록→트랜스크립트→리포트 이동 — 통과
- [x] 스키마 검증 실패 시 오류와 재시도 버튼(테스트 포함) — `e2e/report.spec.ts` 2번: `MOCK_INVALID_REPORT` 발화 후 채팅 화면에서 "리포트 형식이 올바르지 않아…" 오류, 리포트 페이지에서도 오류 + "다시 시도" 버튼, 정상 발화 추가 후 재시도 성공 — 통과. API 단에서는 `tests/integration/chat.test.ts` 가 502 `report_invalid` 와 미저장 확인
- [x] 기록 페이지(통화·채팅 목록, 리포트·트랜스크립트 열람) — `/history`, `/history/{id}`, `/history/{id}/report` 구현, E2E 로 이동 확인
- [x] 긴 트랜스크립트 처리 방식 결정 — DECISIONS 에 기록(전체 입력, 120,000자 초과 시 오래된 턴 제거), `trimTranscript` 구현

## 7단계. 확장 기능

- [x] E2E 포트폴리오 등록→포트폴리오 면접 통화→리포트에 면접 항목 — `e2e/portfolio.spec.ts` 1번: 텍스트 등록, PDF 업로드(`e2e/fixtures/sample.pdf`, 제목을 파일명에서 추출), 포트폴리오 면접 테마로 통화·발화 1회·끊기 → 리포트에 면접 피드백 + "기술 설명의 명확성" 포함 점수 5개 + 포트폴리오 제목, 삭제 — 통과
- [x] 연장 버튼 동작 테스트 — 같은 spec 2번: 20초 테스트 통화에서 "10분 연장" 표시 → 클릭 → 타이머 10:xx·"10:20 통화" 표시·버튼 숨김 — 통과. 단위: `tests/unit/call-duration.test.ts`(10/20/30 정규화, 테스트용 20초, 30분 상한)
- [x] API 통합 테스트 — `tests/integration/portfolio.test.ts`(5개): 텍스트 생성/목록/삭제/재삭제 404, 빈 내용·제목 400, PDF 추출(unpdf, Node 22 에서 동작 확인)과 multipart 업로드, 깨진 PDF 400, 포트폴리오 테마에 포트폴리오 필수·타인 포트폴리오 404, 시스템 프롬프트 고정 블록 — 통과 (`npm test` 70개)
- [x] 리포트 면접 전용 항목 — 면접·포트폴리오 테마에서 `interview`(구조 피드백, 예상 질문 3개), 포트폴리오에서 `technicalClarity` 추가 (5단계 렌더 테스트에 포함)

## 8단계. 품질 마감

- [x] 반응형 — `e2e/responsive-a11y.spec.ts`: 390×844 뷰포트에서 통화 화면이 가로 스크롤 없이 타이머·답변·끊기 버튼을 뷰포트 안에 표시, 리포트 화면도 가로 스크롤 없음(스크린샷 `test-results/call-mobile.png` 로 직접 확인, 헤더 이름 줄바꿈만 수정) — 통과
- [x] 접근성 기본 — 같은 spec: 로그인 폼 Tab 순서(이메일→비밀번호→버튼)와 Enter 제출, 주 메뉴·폼·로그·입력·체크박스에 접근 가능한 이름 — 통과. 모든 버튼·입력에 레이블, 상태 메시지는 `role=status/alert`
- [x] 오류 처리 — API 키 없음: `services/claude/errors.ts` 가 `ClaudeConfigError` 를 안내 문구로 바꾸고 `(app)` 레이아웃의 `ConfigBanner` 가 키 없음/모의 모드를 상단에 표시; 네트워크·인증·한도·일반 API 오류를 SDK 오류 클래스로 분류(`tests/unit/claude-errors.test.ts`, 키 없이 `AnthropicProvider` 호출 시 네트워크 접근 없이 즉시 실패); refusal → 채팅/통화 error 이벤트·리포트 422; 턴 상한 → 429 를 `ApiError(code)` 로 받아 통화를 끝냄(`tests/unit/client-fetch.test.ts`) — 통과
- [x] 코드 리뷰 패스 — 서브에이전트 2개(서버/클라이언트)에게 코드만 주고 "정확성 버그만" 찾게 함. 확인 후 고친 것:
  - 만료·삭제된 세션 쿠키로 `/` ↔ `/login` 무한 리다이렉트(proxy 가 쿠키 존재만으로 공개 경로를 튕김) → proxy 의 그 분기 제거, 로그인/가입 페이지는 실제 세션이 유효할 때만 홈으로. E2E 추가
  - 같은 대화에 동시 전송 시 메시지 index 충돌·턴 상한 우회 → 대화별 직렬화 락 + 마지막 index 기준 채번. 통합 테스트(동시 2건 → index 0..3) 추가
  - 응답 실패·거부 시 사용자 턴이 고아로 남아 턴 상한을 소모하고 재시도가 중복 저장 → 서버가 해당 사용자 턴을 삭제, 클라이언트는 말풍선을 내리고 같은 내용으로 재시도. 네트워크 단절은 재시도 대신 새로고침 안내
  - 동시 가입의 unique 위반이 500 → 409. 진행 중 통화가 쓰는 포트폴리오 삭제 → 409 (통합 테스트)
  - 통화 화면: 턴 상한 429 가 catch 로 빠져 통화가 안 끝남 → `ApiError.code` 로 종료; 끼어들기 후 같은 응답의 뒷문장이 다시 읽힘 → 응답 시작 세대로 판정; 끊기/만료 시 진행 중 답변을 기다리지 않아 리포트에 누락 → 최대 30초 대기; 권한 거부 등 치명적 STT 오류에서 300ms 재시작 루프 → fatal 플래그로 텍스트 입력 전환; 언마운트 후 재청취 타이머 누수 → 정리; 연장 더블클릭 → 가드; 새로고침 시 타이머 초기화·인사 반복 → 서버 `startedAt` 기준으로 남은 시간 복원, 재개 시 인사 생략; Chrome 첫 발화에 설정 음성 미적용 → `voiceschanged` 대기; TTS 체인 거부 시 이후 무음 → catch
  - 고치지 않은 것(환경 의존·설계): 헤드폰 없이 스피커로 들으면 마이크가 상대 음성을 받아 적을 수 있음(README 제한 사항). 통화 시작 전 새로고침은 전체 시간으로 다시 시작
- [x] README 완성 — 설치·실행, 환경 변수 표, 스크립트, 수동 점검 체크리스트 12항목, 알려진 제한
- [x] `npm run check`(lint·typecheck·76 테스트·build) 와 `npm run test:e2e`(18개) 통과

## 미확인 항목 요약

- 실제 Chrome 의 마이크 권한 팝업, `SpeechRecognition` 인식, `speechSynthesis` 재생, 끼어들기 — README 체크리스트로 사람이 확인
- 실제 API 로 `chatTurn` 경로(effort low, `[HINT]` 형식) — 스모크 1회 규칙으로 리포트 경로만 실제 호출(README 체크리스트 12번)
- 메모: `npm test` 와 `npm run test:e2e` 를 동시에 돌리면 서로의 DB 초기화와 겹쳐 "table … does not exist" 가 날 수 있다(서브에이전트가 1회 관찰). 순차 실행하면 재현되지 않음
