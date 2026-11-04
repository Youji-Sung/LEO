# UI/UX 개선 진행 기록

단계별 완료 조건의 확인 결과를 적는다. 형식: `- [x|미확인] 조건 — 확인 방법 — 결과(수치)`

## 0단계. 현황 조사와 도구

- [x] 스크린샷 스크립트 — `scripts/screenshots.ts` 작성, `npx tsx scripts/screenshots.ts --phase before --axe` 실행 — 자체 Next 개발 서버(포트 3150, `shots.db`, `CLAUDE_MOCK=1`, 가짜 VoiceAdapter) 2회 기동(모의 모드 → API 키 없음 모드), 34개 상태 × 4변형(1280·390 × 라이트·다크) = 136장, 실패 0, 소요 약 8분. 상태 목록은 `screenshots/before/index.md`
- [x] before 스크린샷 전부 — PLAN 의 요구 상태 17종(로그인, 회원가입, 홈, 채팅 빈/대화 중/힌트, 통화 설정, 통화 중, 종료 중, 리포트, 리포트 오류, 기록, 포트폴리오 빈/목록, 사용량, 설정, API 키 없음 배너) 모두 포함 + 추가 17종(로그인 오류, 빈 상태 5종, 통화 설정 포트폴리오 없음·마이크 확인 후, 통화 시작 전·음소거·텍스트 모드, 채팅 전송 중·오류·종료, 리포트 없음, 트랜스크립트, PDF 모드, API 키 없음 채팅 오류). 용량 9.1MB(1x PNG)
- [x] 휴리스틱 평가 — `AUDIT.md`: 12개 화면 영역, 81건(심각도 3 = 13, 2 = 46, 1 = 22), 각 항목에 휴리스틱 번호·증거 스크린샷 파일명. 심각도 척도는 NN/g 0~4
- [x] axe 자동 점검 — 136장 전부 검사(`screenshots/before/axe.md`, `axe.json`) — 위반 3종 118노드: `color-contrast` 64(리포트 교정문 초록 4.32:1), `page-has-heading-one` 44(채팅·통화 화면 h1 없음), `scrollable-region-focusable` 10(사용량 표). 대비 실제 값 23조합을 `src/lib/contrast.ts` 로 계산해 AUDIT 표에 기록(AA 미달 5조합)
- [x] UI 문자열 전수 인벤토리 — `STRINGS.md`: `grep -rn -P "[가-힣]" src`(주석·generated 제외) 후보 368줄을 368/368 읽고 분류. 사용자 노출 316줄 → 347행(서로 다른 문구 281, 비한글 11행 포함), 제외 30줄, 모의 응답 22줄. 316 + 30 + 22 = 368 검산
- [x] `npm run check`(lint·typecheck·vitest 76개·build) 종료 코드 0, `npm run test:e2e` 18개 통과(1.4분), 종료 코드 0 — 둘 다 순차 실행
- 메모: 클라우드 컨테이너에 한글 글꼴이 없어 `apt-get install fonts-noto-cjk` 로 Noto Sans CJK 를 설치한 뒤 촬영했다(저장소 변경 아님). 다른 환경에서 재촬영하면 글꼴이 달라질 수 있다
- 메모: 다크 변형 68장은 코드에 다크 모드가 없어 라이트와 바이트 단위로 동일(`cmp` 로 2쌍 확인)
- 미확인: 360px·768px 폭은 0단계 범위(1280·390)에 없어 찍지 않았다. 6단계 반응형 검증에서 촬영한다

## 1단계. 조사와 원칙

- [x] 외부 가이드라인 읽기 — `RESEARCH.md` 1부(WCAG 2.2 조항 19개 + Understanding 6편, Apple HIG 5페이지, Material 3 6페이지 + M2 접근성, 한국어 타이포 2편, 폰트 4종), 2부(NN/g 6편, Google 대체 2편, Microsoft 5편, Polaris 저장소 원본 4편, Atlassian 7편, 국립국어원 길잡이 PDF·KRDS, 토스 4편 + 해요체/버튼 관련 6편, Duolingo 4편), 3부(제품 16개) — 서브에이전트 3개가 WebFetch 로 읽고 URL·발췌·적용을 적음. 메인 세션이 전문을 읽고 통합. "읽음: 예" 표기 80건, "확인 못 함" 표기 36줄(접근 실패 목록 3개 표, `grep -c` 로 셈)
- [x] 접근 실패 명시 — Material 3 콘텐츠 디자인 5페이지(SPA/404 → Google Codelab 대체), Polaris voice-and-tone·actionable-language(삭제됨 → 저장소 원본 empty-state 로 대체), Apple HIG(JS 렌더링 → JSON 엔드포인트), OpenAI 헬프센터(403), ChatGPT 오브 상태별 모양·Zoom 화자 테두리 색·카카오·네이버 가이드 등은 "확인 못 함" 으로 남김
- [x] 레퍼런스 분석 — 3부에 제품 16개(언어 학습 4, 면접 3, 통화 UI 5, 리포트·타이포 3)마다 본 자료·관찰·가져올 것·가져오지 않을 것·이유
- [x] 사용자·상황 분석 — `PRINCIPLES.md` 1절: 핵심 순간 3개 × 인지 부하·감정·손/눈·바라는 것·하면 안 되는 것 표
- [x] 톤 결정 — `PRINCIPLES.md` 2절: 후보 3개를 순간 3개 × 레퍼런스로 비교, "차분한 코치(목소리) + 개발자 도구(시각) + 온기(시작·칭찬)" 채택, 기각 이유 기록. Voice & tone 차트 7상황(시작·통화 중·실수·칭찬·오류·비용/한도·운영 상태)
- [x] 디자인 원칙 5개 — 각각 "하지 않는 것" 포함, AUDIT 81건과의 대응표 포함
- [x] `npm run check`·`npm run test:e2e` — 1단계는 문서만 바꿔 코드 변경이 없다. 0단계 통과 결과(76 단위·18 E2E)가 그대로 유효
- 미확인: WCAG 2.2 본문 마지막 69,706자(용어 정의)·Apple Typography JSON 뒤 81,026자·M3 라이트/다크 기본 톤 표는 읽지 못했다. 필요한 수치는 Understanding 페이지·Apple Accessibility 표·Material Web 토큰 소스로 대신 확인했다

## 2단계. UX 라이팅 가이드와 문구 개정

- [x] `WRITING.md` — 경어(해요체 전면, 근거 3건), 버튼(주 CTA "~하기"·보조 명사형·확인 대화 행동 이름), 길이·구조, 구두점, 영어 혼용, 숫자·시간, 오류 구조, 빈 상태, 로딩, 확인 대화, 칭찬·교정 균형, 금지 표현 12항, 용어집 24항
- [x] 개정표 — `STRINGS-REVISED.md`: STRINGS 347행 전부에 개정/유지/삭제와 이유(유지 183, 개정 151, 삭제 13, 합 347 검산), 신규 문구 72개(키·문구·이유). 서브에이전트가 스크립트로 행 번호 1~347 의 유일성과 개정 문구 = `ko.ts` 값 일치를 확인
- [x] 코드 반영 — `src/content/ko.ts` 한 곳에 모으고 컴포넌트·페이지·서비스·API·음성 어댑터가 참조. 확인: `LC_ALL=C.UTF-8 grep -rn -P "[가-힣]" src/components src/app --include=*.tsx` 에서 주석 아닌 줄 0개(주석 14줄만 남음); `src/lib src/services src/app/api` 에는 ko.ts 임포트, 주석, zod `.describe()`(모델용), 프롬프트, 모의 응답, `ClaudeConfigError`(운영자용 내부 예외), 정규식, AUTH_SECRET 개발 오류만 남음. 이모지 0개
- [x] 리포트 문체 지시 — `prompts/themes.ts` `REPORT_SYSTEM_PROMPT` 에 한국어 문체 규칙(해요체, 느낌표·과장 금지, 요약 첫 문장은 한 일, 판정어 금지, 코멘트 한 줄, 과제는 "~해 보기") 추가. 모의 응답(`mock-provider.ts`)도 같은 문체로 바꿔 화면·테스트에서 확인. 실제 API 호출 0회
- [x] 숫자·시간 규칙 구현 — `formatDateTime`(오늘/어제/월일/연도), `formatUsd`(둘째 자리, 1센트 미만), `formatDurationWords` + `tests/unit/format.test.ts` 8개
- [x] 테스트 — `npm run check` 종료 코드 0(vitest 79개), `npm run test:e2e` 18개 통과(1.8분). E2E·스크린샷 스크립트·단위 테스트는 문구를 `src/content/ko` 에서 임포트해 바뀐 문구 25종(채팅 시작하기, 리포트 만들기, 마이크 확인하기, 테스트 20초, 포트폴리오 추가하기, 대화 내용, 점수, 끝난 대화예요 등)에 맞춤
- 메모: 2단계 결과는 기존 화면 구조 위에 문구만 바꾼 상태라 after 스크린샷은 4단계 재설계 뒤에 찍는다

## 3단계. 디자인 시스템

- [x] 토큰 — `src/design/tokens.ts`(색 31역할 × 라이트/다크, 간격 10, 라운드 5, 타이포 9, 그림자 3, 모션 7, 브레이크포인트 3, 타깃 2) → `src/app/tokens.css` 생성(`scripts/build-tokens.ts`). `SYSTEM.md` 1~5절에 표와 근거
- [x] 대비 — `scripts/build-tokens.ts --table` 로 33조합 × 2테마 계산, AA 미달 0. 라이트 최저: 경계/캔버스 3.10:1(UI 3:1), 텍스트 최저 긍정/캔버스 5.32:1. 다크 최저: 경계/표면 4.89:1. `tests/unit/contrast.test.ts` 가 66조합 + tokens.css 동기화 + 다크 표면 밝기 순서를 고정(70개 테스트 통과)
- [x] 폰트 — Pretendard Variable 다이나믹 서브셋(jsDelivr v1.3.9, `@font-face` 92개 모두 `font-display: swap` 확인) + preconnect, 폴백 스택. CLS 측정은 6단계
- [x] 아이콘 — `lucide-react` 1.67.0(ISC) 설치, 아이콘 22종 존재 확인. 규칙은 SYSTEM 6절
- [x] 컴포넌트 17종 구현 — `src/components/ui/`: Button·ButtonLink, Spinner·Skeleton, TextField·TextArea·Select, Choice·ChoiceGroup·CheckRow, Card, Badge, StatusMessage(polite 옵션), Dialog(`<dialog>`), Segmented, EmptyState, Timer, CallStatus, ScoreGauge, DiffText, Bubble, Toast, ThemeSelect. 단위 테스트 `tests/unit/ui/*.test.tsx` 17파일 100개 통과(역할·aria·라벨·변형)
- [x] 전역 CSS 재작성 — `globals.css` 를 토큰 변수만 쓰도록 전부 다시 씀(reset·타이포·레이아웃·헤더·배너·카드·버튼·폼·선택 카드·배지·상태 메시지·다이얼로그·세그먼트·빈 상태·스피너·목록·말풍선·리포트·사용량·통화·토스트·reduced-motion)
- [x] 테마 전환 — `UserSettings.theme` + 마이그레이션 `20261104020000_add_theme`, `/api/settings` 가 `theme` 을 받아 쿠키 `leo_theme` 설정, 루트 레이아웃이 쿠키로 `<html data-theme>` 서버 렌더(FOUC 없음), 설정 화면의 ThemeSelect 가 즉시 미리보기. 다크 모드는 토큰 CSS 로 전 화면에 적용(스크린샷 확인은 4단계 after 촬영에서)
- [x] 전역 헤더 — 데스크톱 가로 메뉴 + 현재 페이지 `aria-current`, 768px 미만은 메뉴 버튼(aria-expanded/controls)으로 여닫는 세로 메뉴. 로그아웃은 ghost 버튼
- [x] 검증 — `npm run check` 종료 코드 0(lint·typecheck·vitest 33파일 248개·build). `npm run test:e2e` 는 같은 작업 트리에 4단계 통화 설정 재설계가 섞여 있어 18개 중 17개 통과, 실패 1개(포트폴리오 스펙의 `getByLabel("포트폴리오")` 가 테마 카드와 select 두 요소에 걸림)는 셀렉터를 `select#call-portfolio` 로 좁혀 재실행 2/2 통과. 전체 재실행은 4단계 끝에서
