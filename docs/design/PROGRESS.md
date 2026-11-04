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

## 4단계. 화면별 재설계

- [x] `SCREENS.md` — 7개 영역(통화 중, 리포트·대화 내용, 통화 설정, 채팅, 홈, 기록·포트폴리오·사용량·설정·로그인, 전역) 모두 "문제(AUDIT) → 결정 → 근거 → 대안 → after" 로 기록. 통화·통화 설정·전역·설정은 메인 세션이, 리포트·채팅·홈 등은 서브에이전트 3개가 병렬로 구현하고 메인 세션이 통합·검증
- [x] 통화 중(핵심) — `(call)` 라우트 그룹으로 전역 헤더 제거, CallStatus(아이콘+글자+펄스), Timer(링+숫자, 60초 이하 주의색 + "1분 남았어요" status), 끊기 56px 중앙 고정·연장은 오른쪽 칸(`1fr auto 1fr` 격자라 끊기 위치 불변), Bubble 화자 라벨, 첫 인사 말풍선, 텍스트 폼을 고정 영역 안으로(C8 해결)
- [x] after 스크린샷 — `npx tsx scripts/screenshots.ts --phase after --axe`: before 와 같은 34개 상태 × 4변형 = 136장 + index.md + axe. 실패 0
- [x] axe(after) — 위반 3종 68노드가 모두 통화 화면(`(call)` 레이아웃)의 `landmark-one-main`·`page-has-heading-one`·`region` 였고, `<main>` + sr-only h1 + 배너를 `<header>` 에 넣어 수정(재검사는 6단계 전수 재검사에서). before 의 `color-contrast` 64건·`scrollable-region-focusable` 10건·채팅/통화 h1 44건은 0
- [x] E2E — 18개 통과(1.6분). 셀렉터 변경: 테마 select → `selectTheme()`(라디오 카드), 마이크 상태 testid, 포트폴리오 삭제 `window.confirm` → Dialog 버튼, 포트폴리오 select 범위 지정, 연장 후 총 길이 "10분 20초 통화". `npm run check` 종료 코드 0(vitest 33파일 251개)
- [x] 흐름 변경 없음. 홈 최근 목록에서 메시지 0개인 미완 통화를 숨기고 기록에서만 보이게 한 것(D1·K2)과 포트폴리오 목록을 폼 위로 올린 것(P2)은 화면 구성 변경이며 SCREENS 에 근거 기록
- 메모: 서브에이전트가 `portfolio.empty` 문구를 "위에서" → "아래에서" 로 고쳤다(폼이 목록 아래로 이동). STRINGS-REVISED 72행을 같이 고쳐 ko.ts 와 일치시켰다(6단계)
- 미확인: 전체 페이지 스크린샷에서 sticky 헤더가 스크롤 위치에 따라 중간에 찍히는 문제(chat-hints 390)는 촬영 스크립트에 "맨 위로 스크롤" 을 추가해 다음 촬영부터 해결. 이번 after 세트는 그대로 둔다(최종 세트는 5·6단계 뒤 재촬영)

## 5단계. 상태와 마이크로 인터랙션

- [x] 상태 표 — `STATES.md` 1절: 화면 14개 × 상태 55행, 각 행에 구현·스크린샷·테스트. 스크린샷이 없는 행은 사유 명시(순간 상태 4, 실제 브라우저 필요 3, 범위 밖 1)
- [x] 상태 스크린샷 추가 — `scripts/screenshots.ts` 에 9개 상태 추가(chat-refusal, chat-network-error, chat-remake-dialog, portfolios-delete-dialog, settings-saved, report-error 최종 샷, LEO_MAX_TURNS=1 서버 패스의 chat-turn-cap·call-turn-cap) → 36장 촬영, 실패 0
- [x] 모션 — `STATES.md` 2절 표 9항목, 전부 reduced-motion 대체 동작 정의. `after-reduced-motion/` 에 call-live·call-muted·call-ending·call-idle·chat-sending·settings-saved·report-call-interview 7상태 × 4 = 28장. call-live 에서 펄스 링이 없음을 눈으로 확인
- [x] 포커스 관리 — `STATES.md` 3절 규칙 10항목 구현: `RouteFocus`(클라이언트 이동 후 `<main>`), `Dialog`(취소 첫 포커스·복귀), `StatusMessage focus`(폼 오류 5곳), 채팅 전송 후 입력창, `scroll-padding-bottom`
- [x] 상태 촬영 중 발견해 고친 버그 2건 — (1) 채팅에서 서버가 상태 코드로 거절(대화 횟수 한도 429, 끝난 대화 409)하면 네트워크 끊김 문구가 나오던 문제: `ApiError` 면 서버 문구를 보여 주고 재전송 버튼은 한도·종료가 아닐 때만. (2) 통화에서 한도 도달 시 오류와 종료 안내가 둘 다 나오던 중복: 종료 안내만
- [x] 검증 — `npm run check` 종료 코드 0(251개), `npm run test:e2e` 18개 통과(1.6분), 수정 후 turn-cap 상태 재촬영 8장 실패 0

## 6단계. 접근성·반응형·성능 검증

- [x] axe 전 화면 재검사 — 최종 after 세트 재촬영(42개 상태 × 4 = 168장, `--axe`): **위반 0건**(`screenshots/after/axe.md`). before 118노드 → after 0. 4단계 중간 검사의 통화 화면 68노드(main·h1·region)는 수정 확인됨
- [x] 키보드만으로 3개 핵심 흐름 — `e2e/keyboard.spec.ts`(서브에이전트 작성, 메인 세션 검토): (1) 로그인→채팅(테마 화살표 선택, 힌트 Space, 메시지 2회, 리포트 만들기, 목차 앵커) (2) 로그인→통화(통화 시간 화살표, 마이크 확인, 다음, 통화 시작, 발화 2회, 끊기, 리포트) (3) 포트폴리오 추가→포트폴리오 면접 통화→리포트→삭제 다이얼로그(취소 첫 포커스 → Tab → 삭제). 첫 `goto` 뒤에는 `page.keyboard` 만 사용. 3개 통과(28.8초), 키보드로 할 수 없는 단계 0
- [x] 대비 전수 테스트 — `tests/unit/contrast.test.ts`: 토큰 조합 33 × 라이트/다크 = 66개 조합이 각각 텍스트 4.5:1 / UI 3:1 이상, `tokens.css` 가 `tokens.ts` 와 동일, 다크 표면 밝기 순서. 70개 테스트 통과(3단계부터 `npm run check` 에 포함)
- [x] 반응형 — `scripts/screenshots.ts --widths 360,640,768` 로 42개 상태 × 3폭 = 126장 촬영, 모든 장에서 `scrollWidth <= innerWidth` 를 자동 확인: 가로 스크롤 0장(`screenshots/after-widths/overflow-360-640-768.md`). 390·1280 은 after 기본 세트(136장)에서 확인. 768 에서 헤더 메뉴가 두 줄로 꺾이는 문제를 발견해 `white-space: nowrap` + 1024px 미만에서 사용자 이름 숨김으로 수정
- [x] 화면 확대 200% — 1280px 창의 200% 확대는 CSS 폭 640px 과 같다(브라우저 확대 = CSS px 축소). 640 폭 42개 상태 전부 가로 스크롤 없음, 모바일 메뉴로 전환되어 레이아웃 깨짐 없음(after-widths 의 `*--640-light.png`). 실제 브라우저 Ctrl/Cmd + 로의 확인은 운영자 수동 항목으로 남김
- [x] 성능 — `npm run build && npx tsx scripts/perf.ts`(프로덕션 서버, 캐시 없는 새 컨텍스트): `PERF.md` 표. CLS 는 12회 측정 중 최대 0.0001(/login 1280), 나머지 0. 전송량: CSS 41.6KB, JS 481~497KB(Next 런타임 포함), 폰트 128~368KB(서브셋 5~14파일, 화면의 글자 범위에 비례), HTML 11~18KB. DCL 34~553ms(첫 요청만 553ms, 서버 콜드 스타트)
- 미확인: 실제 Chrome 의 폰트 스왑 체감(FOUT)·Lighthouse 점수는 측정하지 않았다(Playwright 의 layout-shift 관측자로 CLS 만 측정). web.dev 의 CLS 임계값 원문은 읽지 않아 "일반적으로 알려진 0.1" 로만 적었다

## 7단계. 리뷰 패스

두 서브에이전트에게 자료만 주고 결론을 주지 않았다. 리뷰 원문은 세션 스크래치에 두고 결과만 여기 적는다.

- [x] 리뷰 A(스크린샷 + PRINCIPLES/WRITING, 코드 비공개) — after 38개 상태를 폭·테마별로 봄. 발견 39건(중대 4, 경미 19, 외관 16), 잘된 점 10건
- [x] 리뷰 B(코드만: `src/components/**`, `src/app/**`, CSS, 토큰, `lib/theme`, `lib/format`, `api/settings`, `content/ko`) — 발견 23건(high 2, medium 7, low 14), 문제 아님으로 확인한 것 5건

### 리뷰 A 조치 (39건 중 조치 31, 미조치 8, 부분 조치는 표와 아래 목록에 함께 적음)

| 번호 | 내용 | 조치 |
|---|---|---|
| 1 | 모의 모드 배너가 모든 화면 상단 전폭 | 배너 제거, 헤더의 작은 칩 "모의 모드"(`banner.mockChip`)로. `ConfigBanner` 는 키 없음 경고만 남김 |
| 2 | 통화 화면에도 운영 배너 | `(call)` 레이아웃에서 배너 제거(헤더 랜드마크도 제거, B15 함께 해결) |
| 3 | 사용량 표가 모바일에서 잘림, 스크롤 힌트 없음 | `.table-wrap` 에 스크롤 그림자 배경 + 첫 열 sticky |
| 4 | 채팅 오류 시 내 메시지가 사라져 무엇을 재전송하는지 모름 | 실패한 말풍선을 남기고(`Bubble failed`) "보내지 못했어요" 라벨, 그 아래 다시 보내기 |
| 5 | 보조 버튼이 "~하기" | "채팅 시작", "마이크 확인", "포트폴리오 추가", "새 채팅 시작" 으로. 홈 빈 상태 버튼은 제거(9번). "리포트 만들기" 는 그 화면의 주 행동이라 유지(2.2) |
| 6 | 리포트 열기 라벨·모양이 둘 | 기록 목록도 "리포트 보기" 로 통일, 전부 테두리 버튼 |
| 7 | 빈 상태 버튼이 홈은 보조·기록은 1차 | 규칙으로 정해 SYSTEM 7절 EmptyState 에 적음: 화면에 이미 1차 버튼이 있으면 빈 상태에는 버튼 없음, 유일한 행동이면 1차 |
| 8 | 목록 메타 순서가 화면마다 다름 | 채팅 목록을 홈과 같은 순서(날짜 → 메시지 수 → 테마)로 |
| 9 | 홈에 "통화 시작하기" 가 두 번 | 홈 빈 상태의 버튼 제거, 문장만 |
| 10 | 로마자 뒤 조사 띄어쓰기 | ko.ts·모의 응답 전부 붙여쓰기, WRITING 2.5 에 규칙 추가, 리포트 프롬프트에도 지시 추가 |
| 11 | 헤더에 "님으로 로그인" 반복 | 헤더는 이름만, `aria-label="로그인한 사용자"` |
| 12 | "을(를)" 노출 | `"${title}" 포트폴리오를 …` 로 고정 조사 |
| 13 | 교정 힌트가 따옴표·괄호 형식 | 힌트 지시와 모의 응답을 `원문 → 교정 · 이유` 로 |
| 14 | 표현 제안이 교정과 같은 라벨·색 | 섹션 "표현 제안", 라벨 "이렇게도 말해요", `DiffText tone="suggest"` 강조색 |
| 15 | 음소거 상태 보조 문구가 버튼처럼, 1차 버튼 둘 | 보조 문구 "내 말이 들어가지 않아요.", 음소거 버튼은 secondary + `aria-pressed` 스타일 |
| 16 | 네트워크 오류에 버튼 없음 | [새로고침] 버튼 추가(요청이 서버에 닿았을 수 있어 재전송 대신 새로고침) |
| 17 | 비활성 버튼 이유 없음, 다크에서 활성과 같아 보임 | `:disabled` 에 채움·연한 글자 토큰. 리포트 만들기 비활성 사유는 이미 빈 상태 문장이 설명 |
| 18 | 글자 모드 입력 라벨이 채팅과 다름 | 플레이스홀더 "영어로 입력하고 Enter" + 버튼 "보내기" 로 두 화면 통일, 채팅의 키 안내는 입력창 아래 보조 문구 |
| 19 | 네이티브 파일 입력 영어 노출 | sr-only input + "PDF 고르기" 버튼 + 파일명 |
| 20 | 통화 대기 본문 3문장 | 2문장 + 불릿 3개(리포트 안내를 불릿으로) |
| 21 | 끝난 채팅에서 "다시 만들기" 가 "보기" 보다 눈에 띔 | 리포트 보기 secondary, 다시 만들기 ghost |
| 22 | 1280 에 햄버거 | `.site-header .menu-toggle{display:none}` (버튼 공통 규칙이 미디어 쿼리를 이기던 특이성 문제) |
| 23 | 통화 버튼 라벨 12px | 14px, 끊기 최소 폭 6.5rem |
| 24 | "한 번" 잡초 | 제거 |
| 25 | 플레이스홀더 중간 마침표 | 한 구절로 |
| 26 | 같은 라벨 다른 아이콘 | 통화 시작 버튼 전화 아이콘으로 통일 |
| 27 | 거절 안내가 오류색 | info 톤 |
| 28 | 종료 후 타이머 잔류 | 종료 중·종료 상태에서 타이머 숨김 |
| 29 | "최근 호출 50건", "지연(ms)" | 실제 건수, "응답 시간", 단위는 값에("20ms") |
| 30 | 기록에 종류가 두 번 | 메타 줄의 종류 칩 제거 |
| 39 | 가능 표현 | "만들어요" 로 |

미조치(이유)
- 31 호버 잔상 회색 카드: 캡처 시 마우스 위치 때문. 호버는 테두리+배경 둘 다 쓰는 것이 선택 카드 관례라 유지. 비활성 카드는 쓰지 않아 혼동 없음
- 32 전체 페이지 캡처에서 고정 입력창·스크림 위치: 캡처 아티팩트(`fullPage` 가 고정 요소를 문서 좌표로 찍음). 뷰포트 캡처로 바꾸면 긴 화면 하단이 안 보여 그대로 두고 `after/index.md` 에 적음
- 33 폼형 화면 폭: 폼은 입력 줄 길이를 제한하는 것이 읽기·입력에 유리(RESEARCH 폼 가이드). 제목 폭도 같은 컨테이너라 들쭉날쭉은 폼 영역만. 유지
- 34 말풍선 화자 라벨: sr-only 라벨이 이미 있고, 좌우·색·꼬리로 시각 구분. 보이는 라벨은 통화 화면에서 노이즈(P5). 유지
- 35 토스트 위치: 하단 가장자리로 내리면 고정 입력창(채팅)과 겹친다. 설정 화면만의 문제라 유지
- 36 픽스처 이름: 모의 트리거 문자열(MOCK_*)은 E2E 와 공유하는 계약이라 바꾸지 않음. 모의 리포트 요약은 실제 모델 출력이 아니므로 유지
- 37 "테스트 20초": `LEO_ALLOW_SHORT_CALLS=1` 일 때만 보인다(운영에서 꺼짐). 이미 운영자 전용
- 38 다크 1차 버튼 무게: 대비 표에 묶인 토큰(`accent-on` 4.5:1)이라 바꾸면 3단계 결정을 흔든다. 미확인 항목으로 남김(실제 기기에서 운영자 확인)
- 5 의 "리포트 만들기": 위 표 참조(주 행동이라 "~하기" 유지)
- 17 의 비활성 사유 보조 문구: 빈 상태 문장이 이미 설명. 별도 툴팁 없음
- 20 의 불릿 제거: 끼어들기·연장은 알 수 없는 기능이라 남김(AUDIT), 본문만 줄임

### 리뷰 B 조치 (23건 중 조치 19, 미조치 4)

| 번호 | 내용 | 조치 |
|---|---|---|
| 1 | 통화 자동 스크롤이 no-op | `lastElementChild.scrollIntoView` |
| 2 | `StatusMessage focus` 의 div autoFocus 가 무시됨 | `useEffect` 로 `focus()`, ChatView 는 성공 시에만 입력창 복귀 |
| 3 | 첫 인사 말풍선이 첫 답변과 함께 사라짐 | 항상 렌더(서버 저장은 흐름 변경이라 안 함) |
| 4 | `next` 오픈 리다이렉트 | `/^\/(?![\/\\])/` 검사 |
| 5 | 스트리밍·interim 이 live region 안 | `aria-live="off"` 래퍼, 채팅 log 의 중복 aria-live 제거 |
| 6 | 점수 카드 전체 `role=img` 로 코멘트 숨김 | `.score-bar` 에만 role/aria-label |
| 7 | 서버·클라이언트 시간대 불일치 | 표시 시간대 `Asia/Seoul` 고정(`Intl.DateTimeFormat`), 테스트는 UTC 입력 |
| 8 | 로딩 중 `disabled` 로 포커스 유실 | 로딩이 끝나면 버튼이 포커스를 되찾음(`Button` effect). `disabled` 자체는 유지(E2E 가 `toBeDisabled` 로 로딩을 판정) |
| 9 | 미저장 테마가 SPA 내내 유지 | `savedThemeRef` 로 언마운트·실패 시 복원 |
| 12 | 삭제 후 포커스 body | `#portfolio-list-title` 로 이동 |
| 13 | 토스트 타이머 누수 | arm 전 clear, 밀려난 항목 clear, 언마운트 정리 |
| 14 | 로그아웃 busy 고정 | try/catch |
| 15 | 빈 header 랜드마크 | 통화 레이아웃에서 제거 |
| 16 | `100dvh` 폴백 | `100vh` 선행 선언 |
| 18 | 목소리 목록 미로딩 힌트 깜빡임 | `voices: VoiceInfo[] \| null` |
| 19 | 비치명 STT 오류 잔류 | 4초 뒤 자동 해제 |
| 21 | 추가 성공 메시지 두 번 | 토스트 제거(인라인 status 유지) |
| 22 | 죽은 CSS·`.correction` | 미사용 선택자 제거 |
| 23 | themeColor 가 강제 테마 무시 | 쿠키 테마가 light/dark 면 단일 값 |

미조치(이유)
- 10 `router.refresh()`: 서버 데이터가 바뀐 경우(답변이 저장된 뒤 끊김)를 위해 둔다. 메시지 상태는 새로고침 안내로 보완
- 11 음소거 토글: 라벨 "음소거"/"음소거 해제" 는 용어집·E2E 가 참조한다. `aria-pressed` 를 빼면 CSS 상태 스타일 근거가 없어져, 라벨 변경 + aria-pressed 조합을 유지. 스크린리더 낭독 중복은 미확인
- 17 `:has()` 폴백: 지원 브라우저(Chrome 105+, Safari 15.4+, Firefox 121+)가 BRIEF 의 대상(최신 Chrome)을 덮는다. 유지
- 20 첫 문장 끼어들기 경쟁: 음성 어댑터(`lib/voice`)는 범위 밖. 미확인

### 검증

- `npm run check` 종료 코드 0(단위 252개: ScoreGauge 테스트를 `.score-bar` 배치로 갱신, format 테스트를 UTC 입력으로 갱신)
- `npm run test:e2e` 21개 통과(1.7분). 포트폴리오 스펙의 성공 문구 단언을 새 문구로 갱신
- after 세트 재촬영(`--axe`): 42개 상태 × 4 = 168장, 실패 0, **axe 위반 0건**, 가로 스크롤 0장. 첫 재촬영에서 실패한 채팅 말풍선(opacity 0.75)이 대비 3.9:1 로 axe 4노드에 걸려 negative-subtle 토큰 쌍으로 고치고 전체를 다시 찍었다(`fix:` 커밋). 거절 상태(chat-refusal)는 info 톤이 되어 촬영 스크립트의 대기 조건을 role=status 로 바꿨다
- `--widths 360,640,768`: 126장, 가로 스크롤 0장. `--reduced-motion` 7상태 × 4 = 28장
- 미확인: 음소거 토글의 스크린리더 낭독(라벨 변경 + aria-pressed 조합), 다크 모드 1차 버튼의 시각 무게(리뷰 A 38), 첫 문장 끼어들기 경쟁(리뷰 B 20)은 실제 기기·실제 음성에서만 확인할 수 있어 남긴다

## 8단계. 마무리

- [x] `docs/design/README.md` — 문서 지도(7단계 항목 추가), before/after 대표 화면 6쌍, 결정 요약, 검증 수치 갱신(단위 252, E2E 21, axe 0/168장, 가로 스크롤 0/294장, 리뷰 조치 50/62)
- [x] 프로젝트 `README.md` — 기술 스택·스크립트(스크린샷·토큰·성능 스크립트), 설정 기능(테마), 모의 모드 칩·배너 설명, 수동 점검 항목 갱신
- [x] 최종 `npm run check`·`npm run test:e2e` 통과 뒤 push(아래 수치)
- 미확인(전 단계 누적): 실제 마이크·스피커·TTS 끼어들기(클라우드 세션에 장치 없음), 실제 Claude 응답 문체(모의 모드만), 브라우저 확대 200% 의 실제 조작(CSS 폭 640 으로 대체), Lighthouse 점수, 스크린리더 실제 낭독(VoiceOver/NVDA), 다크 모드 1차 버튼의 시각 무게
