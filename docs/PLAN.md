# 구현 계획

한 번의 클라우드 세션이 이 문서를 위에서 아래로 끝까지 수행한다. 각 단계는 "완료 조건"을 모두 만족해야 끝난 것이다. 완료 조건을 확인하지 않고 다음 단계로 넘어가지 않는다.

공통 규칙
- 단계가 끝날 때마다 `npm run check`(lint + typecheck + test + build)를 통과시키고 커밋한다. 커밋 메시지는 `phase N: 요약` 형식.
- 단계가 끝날 때마다 `docs/PROGRESS.md`에 완료 조건별 확인 결과를 한 줄씩 적는다.
- 독립적인 작업은 서브에이전트로 병렬 처리한다 (예: 3단계와 6단계의 UI, 테스트 작성). 통합과 최종 검증은 메인 세션이 한다.
- 불확실한 것은 `docs/DECISIONS.md`의 "세션 결정"에 기록하고 진행한다. 질문으로 멈추지 않는다.

## 0단계. 부트스트랩

- 프레임워크 선택과 이유를 `docs/DECISIONS.md`에 기록.
- 프로젝트 스캐폴딩, TypeScript strict, ESLint, Prettier, 테스트 러너, E2E 도구.
- `package.json` 스크립트: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `check`(앞의 넷을 순서대로), `db:migrate`, `db:seed`.
- Prisma 초기화. `.env`가 없으면 `.env.example`을 복사하는 `scripts/bootstrap.sh`.
- README에 로컬 실행 방법 작성.

완료 조건: 새 클론에서 `bash scripts/bootstrap.sh && npm run check`가 통과한다. `npm run dev`로 빈 홈 화면이 뜬다.

## 1단계. 데이터 모델과 인증

- Prisma 스키마: `User`, `Session`(로그인 세션), `Conversation`(kind: chat|call, theme, durationSec, startedAt, endedAt, portfolioId?), `Message`(role, content, createdAt, index), `Report`(conversationId, json, createdAt), `UsageRecord`(userId, feature, model, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, costUsd, latencyMs, createdAt), `Portfolio`(userId, title, content, createdAt), `UserSettings`.
- 회원가입/로그인/로그아웃 API와 화면. 비밀번호 해시. 보호 라우트 미들웨어.
- 시드 스크립트: 개발용 사용자 2명 (`.env`의 `SEED_USER_PASSWORD`로 비밀번호 지정, 기본값 있음).

완료 조건: 회원가입→로그인→보호 페이지 접근→로그아웃이 통합 테스트로 검증된다. 마이그레이션이 깨끗한 DB에 적용된다.

## 2단계. Claude 서비스 계층

- 먼저 `/claude-api` 스킬을 로드하고 TypeScript README와 streaming, tool-use(structured outputs) 문서를 읽는다.
- `services/claude/`: 클라이언트 생성(키는 `LEO_ANTHROPIC_API_KEY`), `chatTurn()`(스트리밍), `generateReport()`(구조화 출력), `ClaudeProvider` 인터페이스와 `MockClaudeProvider`.
- 테마별 시스템 프롬프트 파일(`prompts/`), 리포트 JSON 스키마(`schemas/report.ts`)와 타입.
- 모든 호출에서 `usage`를 `UsageRecord`로 저장. 단가표 `config/pricing.ts`.
- 서버 측 턴 상한(통화당 60턴, 설정 가능).
- 단위 테스트: 모의 구현으로 스트리밍 조립, 리포트 스키마 검증, 사용량 기록, 턴 상한.
- 실제 API 호출 스모크 스크립트 `scripts/smoke-claude.ts`: `LEO_ANTHROPIC_API_KEY`가 있을 때만 1회 호출해 응답과 usage를 출력. 세션은 이 스크립트를 **한 번만** 실행해 키와 모델이 실제로 동작하는지 확인하고 결과를 PROGRESS에 기록한다. 키가 없으면 "미확인"으로 기록한다.

완료 조건: 단위 테스트 통과. 스모크 스크립트 실행 결과가 PROGRESS에 있다.

## 3단계. 텍스트 채팅

- 채팅 화면: 대화 목록, 새 대화(테마 선택), 메시지 입력, 스트리밍 표시, 교정 힌트 토글, "리포트 생성" 버튼.
- API: 대화 생성/목록/조회, 메시지 전송(스트리밍 응답), 리포트 생성.
- 교정 힌트는 같은 호출에서 받는다(응답 형식에 힌트 구획을 두고 파싱) 또는 별도 저비용 호출. 세션이 정하고 기록.

완료 조건: 모의 모드 E2E로 로그인→새 채팅→메시지 3회→리포트 생성까지 통과. 새로고침 후 대화가 유지된다.

## 4단계. 전화 영어

- `VoiceAdapter` 인터페이스(`startListening`, `stopListening`, `speak`, `cancelSpeech`, `isSupported`)와 Web Speech 구현, 테스트용 가짜 구현.
- 통화 설정 화면(테마, 시간), 통화 화면(타이머, 실시간 트랜스크립트, 음소거, 끊기), 종료 흐름.
- 사용자가 말하는 중 TTS 중단, 인식 결과 확정 시 서버로 전송, 응답 텍스트를 스트리밍으로 받아 문장 단위로 TTS.
- 미지원 브라우저 대체 UI(텍스트 입력).
- 타이머 만료 시 자동 종료 후 리포트 화면으로 이동.

완료 조건: 가짜 VoiceAdapter를 주입한 E2E로 통화 시작→발화 3회→타이머 만료(테스트에서는 짧게)→리포트 화면 도달. 실제 브라우저에서 마이크 권한 흐름이 동작하는지 수동 점검 항목을 README에 적는다.

## 5단계. 리포트

- 리포트 생성 파이프라인: 트랜스크립트→`generateReport()`→저장→렌더링.
- 리포트 화면: SPEC 2.3의 모든 항목. 점수는 시각적으로, 교정은 원문/교정문 대비로.
- 기록 페이지: 통화·채팅 목록, 리포트와 트랜스크립트 열람.
- 긴 트랜스크립트 처리 방식 결정과 기록.

완료 조건: 모의 리포트가 모든 항목을 렌더링한다. 스키마 검증 실패 시 사용자에게 오류와 재시도 버튼을 보여 준다(테스트 포함).

## 6단계. 사용량 페이지

- 사용자별·기간별 합계(토큰, 비용), 기능별 분포, 최근 호출 50건.

완료 조건: 시드 데이터로 페이지가 숫자를 올바르게 합산한다(테스트).

## 7단계. 확장 기능

- 포트폴리오: 등록(텍스트/마크다운/PDF), 목록, 삭제. "포트폴리오 면접" 테마에서 선택한 포트폴리오를 시스템 프롬프트에 포함(캐시 가능하게 고정 위치에).
- 연장 통화: 10/20/30분 선택, 남은 1분에 연장 버튼, 최대 30분.
- 리포트에 면접 전용 항목.

완료 조건: E2E로 포트폴리오 등록→포트폴리오 면접 통화→리포트에 면접 항목 표시. 연장 버튼 동작 테스트.

## 8단계. 품질 마감

- 반응형 점검(모바일 폭에서 통화 화면), 접근성 기본(레이블, 포커스 순서).
- 오류 처리: API 키 없음, 네트워크 오류, refusal, 턴 상한 도달 각각에 사용자 메시지.
- 전체 코드 리뷰 패스: 서브에이전트에게 "정확성 버그만" 찾게 하고, 확인된 것만 고친다.
- README 완성: 설치, 실행, 환경 변수, 수동 점검 체크리스트, 알려진 제한.

완료 조건: `npm run check`와 `npm run test:e2e` 통과. PROGRESS에 모든 단계가 닫혀 있고, 닫지 못한 항목은 "미확인"으로 남아 있다.

## 9단계. 마무리 보고

- 브랜치 push.
- 세션 마지막 메시지에: 만든 것, 검증 방법과 결과, 미확인 항목, 운영자가 해야 할 일(키 설정, 수동 점검)을 적는다.
