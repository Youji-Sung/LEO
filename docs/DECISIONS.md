# 결정 기록

확정된 결정과 세션에 위임된 결정을 구분한다. 세션은 위임 항목을 스스로 정하고 아래 "세션 결정" 절에 근거와 함께 기록한다. 확정 항목은 바꾸지 않는다.

## 확정 (운영자 결정, 2026-11-03)

| 항목 | 결정 | 이유 |
|---|---|---|
| 음성 처리 | 브라우저 Web Speech API (STT `SpeechRecognition`, TTS `speechSynthesis`) | 추가 키·비용 없음. 외부 제공자로 교체할 수 있도록 `VoiceAdapter` 인터페이스 뒤에 둔다 |
| 데이터베이스 / ORM | Prisma + SQLite | 외부 서비스 없이 동작. 스키마는 Postgres 호환으로 작성(SQLite 전용 타입 금지) |
| 인증 | 이메일/비밀번호, 서버 세션 쿠키 | 사용자 2명. 소셜 로그인 불필요 |
| 사용량 정책 | 기록만, 제한 없음 | 사용자 2명. 폭주 방지용 턴 상한만 둔다 (SPEC 4) |
| Claude 모델 | `claude-opus-5` 기본, `LEO_CLAUDE_MODEL`로 변경 가능 | 품질 우선. 세션이 임의로 하위 모델로 바꾸지 않는다 |
| API 키 변수명 | `LEO_ANTHROPIC_API_KEY` | `ANTHROPIC_API_KEY`는 클라우드 세션의 Claude Code 인증과 충돌할 수 있음 |
| UI 언어 | 한국어 UI, 영어 대화 | 한국인 개발자 대상 |
| 테스트의 API 사용 | 금지. `CLAUDE_MOCK=1` 모의 구현 사용 | 테스트가 API 크레딧을 쓰지 않게 |
| 저장소 구조 | 단일 저장소, 단일 프로세스로 실행 가능해야 함 | 클라우드 세션 한 번으로 끝까지 만들기 위해 |

## 세션에 위임 (제약 안에서 세션이 결정)

| 항목 | 제약 |
|---|---|
| 웹 프레임워크 | Node.js/TypeScript 생태계 (Prisma 때문). 프론트와 API가 한 프로세스에서 돌아야 함. 세션이 가장 자신 있게 끝까지 완성할 수 있는 것을 고른다 |
| 스타일링 | 자유. 외부 디자인 시스템 의존 최소화 |
| 테스트 러너 / E2E 도구 | 자유. E2E는 클라우드 VM의 Chrome(`CHROME_PATH`)으로 헤드리스 실행 가능해야 함 |
| 비밀번호 해시, 세션 저장 방식 | 표준적인 방법 (예: bcrypt/argon2, DB 세션 테이블) |
| 디렉터리 구조 | 자유. 단, Claude 호출은 `services/claude` 같은 한 계층에 모으고 UI에서 직접 SDK를 부르지 않는다 |
| PDF 텍스트 추출 라이브러리 | 자유. 네이티브 바이너리 의존이 없는 것을 우선 |

## 세션 결정

(세션이 작업 중 내린 결정을 여기에 추가한다. 형식: 날짜 · 항목 · 선택 · 이유 · 대안)

- 2026-11-03 · 웹 프레임워크 · **Next.js 16 (App Router, React 19)** · 프론트와 Route Handler(API)가 한 프로세스에서 돌고, 스트리밍 응답(`ReadableStream`)과 서버 컴포넌트로 인증·데이터 조회를 단순하게 처리할 수 있다. 세션이 가장 익숙한 스택. · 대안: Vite+React+Express(두 빌드를 묶어야 함), Remix/SvelteKit(경험 적음)
- 2026-11-03 · Prisma 버전 · **Prisma 7.10.1 + `@prisma/adapter-better-sqlite3`** · npm `latest` 태그가 8.0.0-rc라 안정판 7을 고정. Prisma 7은 드라이버 어댑터가 필수이며 `prisma-client` 생성기가 `src/generated/prisma`(커밋하지 않음)로 출력한다. · 대안: 8.0 rc(불안정), `@prisma/adapter-libsql`(동일하게 네이티브 바이너리)
- 2026-11-03 · 버전 고정 · TypeScript 5.9(7.0은 Go 포팅으로 생태계 호환 위험), ESLint 9.39(10은 플러그인 호환 위험), Vitest 4.1, Playwright 1.63(클라우드 VM에 설치된 브라우저와 동일 버전) · 처음 보는 메이저 버전으로 인한 시간 손실을 피한다 · `.npmrc`에 `legacy-peer-deps=true`: npm 10.9가 vitest 4의 peer 집합을 해석하다 내부 오류(`edgesOut`)를 내서 필요
- 2026-11-03 · 스타일링 · **전역 CSS + CSS 변수, 유틸리티 클래스 몇 개** · 외부 디자인 시스템 없음, 빌드 의존성 없음 · 대안: Tailwind(의존성 추가), CSS Modules(파일 수 증가)
- 2026-11-03 · 테스트 · 단위·통합은 Vitest(Node 환경, 통합 테스트는 Route Handler 함수를 직접 호출), E2E는 Playwright. E2E는 Playwright 번들 Chromium을 쓰고 없으면 `CHROME_PATH`로 대체(둘 다 클라우드 VM에서 실행 확인). E2E 서버는 포트 3100, `prisma/e2e.db`, `CLAUDE_MOCK=1`로 분리 · 대안: Cypress(무거움)
- 2026-11-03 · 비밀번호 해시 / 세션 · **Node 내장 `crypto.scrypt`**(의존성 없음) + DB `Session` 테이블에 토큰 해시 저장, `httpOnly` 쿠키 · 대안: bcrypt(네이티브), argon2(네이티브)
- 2026-11-03 · 디렉터리 구조 · `src/app`(화면·API), `src/services/claude`(Claude 호출 전부), `src/services/*`(도메인 서비스), `src/lib`(db·auth·유틸), `src/config`(단가표), `prisma/`, `tests/{unit,integration}`, `e2e/`
- 2026-11-03 · 환경 변수 로딩 · Next는 자체 `.env` 로딩, Prisma CLI·시드·스크립트는 `dotenv/config`. 둘 다 이미 설정된 프로세스 환경 변수를 덮어쓰지 않으므로 클라우드 환경 변수(`LEO_ANTHROPIC_API_KEY`)가 `.env`의 빈 값에 가려지지 않는다
- 2026-11-03 · 교정 힌트 전달 방식 · **같은 호출, 응답 마지막 줄 `[HINT] …` 구획** · 호출 1회로 끝나 비용·지연이 절반. 스트리밍 중 `HintSplitter` 가 마커 접두사를 보류해 힌트가 화면에 새지 않게 하고, 마커가 없으면 힌트 없음으로 처리 · 대안: 별도 저비용 호출(지연·비용 2배, 캐시 접두사 추가 관리)
- 2026-11-03 · 스모크 스크립트 호출 종류 · **`generateReport` 1회(짧은 면접 트랜스크립트)** · 한 번의 호출로 스트리밍 SDK 경로, `fallbacks: "default"` + 베타 헤더, `cache_control`, `output_config.format`(구조화 출력), `effort: high` 를 모두 실제로 검증할 수 있어 위험이 큰 경로를 우선함 · 대안: `chatTurn` 1회(구조화 출력 미검증)
- 2026-11-03 · Claude 호출 파라미터 · 모델 `claude-opus-5`(`LEO_CLAUDE_MODEL`), `thinking: {type:"adaptive"}`, 대화 `effort: low` / `max_tokens 2048`, 리포트 `effort: high` / `max_tokens 16000`, 둘 다 `client.beta.messages.stream` + `fallbacks: "default"` + `server-side-fallback-2026-07-01`. 리포트 JSON 은 `betaZodOutputFormat(reportSchema)` 로 받고 서버에서 zod 로 재검증한 뒤 정규화(점수 클램프, 배열 길이 제한). 스키마에 `minimum/maxItems` 같은 제약 키워드는 넣지 않아 구조화 출력 호환 문제를 피한다
- 2026-11-03 · 모의 구현 · `MockClaudeProvider` 는 결정적 응답을 7자 단위로 스트리밍하고, 사용자 메시지의 `MOCK_REFUSAL` / `MOCK_INVALID_REPORT` / `MOCK_ERROR` 문구로 거부·스키마 실패·API 오류를 재현한다(5·8단계 테스트용)
- 2026-11-03 · 대화 응답 스트리밍 전송 형식 · **NDJSON**(`{type: delta|done|error}` 한 줄씩, `Content-Type: application/x-ndjson`) · SSE 보다 fetch 로 다루기 쉽고 Route Handler 의 `ReadableStream` 으로 그대로 흘려보낼 수 있다. 첫 이벤트 전에 나는 오류(404·턴 상한 429)는 JSON 상태 코드로 응답 · 대안: SSE(EventSource 는 POST 불가), WebSocket(별도 서버 필요)
- 2026-11-03 · 리포트 입력 길이 · **전체 트랜스크립트 입력, 120,000자 초과 시 오래된 턴부터 제거** · 통화 1회는 최대 60턴·30분이라 Opus 5 의 1M 컨텍스트에 비해 매우 작다. 요약 후 분석은 비용과 정확도 손실만 더한다 · 대안: 요약 후 분석(불필요)
- 2026-11-03 · 통화 시작 방식 · **통화 화면의 "통화 시작" 버튼 클릭으로 시작**(설정 화면은 "다음") · Chrome 은 사용자 제스처 없이 `speechSynthesis.speak()`·마이크 접근을 막는다. 같은 문서 안의 클릭으로 시작해야 첫 인사 TTS 와 인식이 확실히 동작한다 · 대안: 화면 진입 시 자동 시작(자동재생 정책에 막힐 수 있음)
- 2026-11-03 · 상대의 첫 인사 · **테마별 고정 문구를 클라이언트에서만 표시·TTS, 서버에 저장하지 않음** · Claude API 는 첫 메시지가 user 여야 한다. 저장하지 않으면 히스토리 제약을 어기지 않고도 상대가 먼저 말을 거는 흐름을 만들 수 있다 · 대안: 가짜 사용자 메시지로 인사 유도(기록이 지저분해짐)
- 2026-11-03 · TTS 문장 단위 재생과 끼어들기 · 스트리밍 델타를 `SentenceSplitter` 로 문장 단위로 잘라 순차 재생. 음성 인식의 interim 결과가 들어오면 `cancelSpeech()` 와 세대 카운터로 남은 문장 재생을 모두 버린다 · 대안: 응답 완료 후 한 번에 읽기(지연 큼)
- 2026-11-03 · 테스트용 짧은 통화 · `LEO_ALLOW_SHORT_CALLS=1` 일 때만 `durationMin: 0` → 20초 통화 옵션이 생긴다(E2E 서버·vitest 에서만 설정). 운영 기본값과 UI 는 10/20/30분 그대로
- 2026-11-03 · PDF 텍스트 추출 · **`unpdf` 2.1**(PDF.js 서버리스 빌드, 네이티브 의존성 없음) · README 는 Node 24+ 를 말하지만 Node 22 에서 손으로 만든 PDF 추출이 동작함을 확인. 서버에서 동적 import 로 로드하고 `serverExternalPackages` 에 등록 · 대안: `pdf-parse`(유지보수 뜸함)
- 2026-11-03 · 포트폴리오 프롬프트 위치 · 테마 시스템 프롬프트(고정, 캐시) 뒤에 두 번째 system 블록으로 포트폴리오 전문을 넣고 둘 다 `cache_control` · 포트폴리오가 바뀌어도 테마 블록 캐시는 유지되고, 같은 포트폴리오로 이어지는 턴은 둘 다 캐시 적중
