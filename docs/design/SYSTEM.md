# 디자인 시스템 (3단계)

토큰의 단일 출처는 `src/design/tokens.ts`, 생성된 CSS 는 `src/app/tokens.css`(`npx tsx scripts/build-tokens.ts`), 대비는 `tests/unit/contrast.test.ts` 가 고정한다. 컴포넌트는 `src/components/ui/`. 근거는 `RESEARCH.md` 1부(WCAG, Apple HIG, Material 3, 폰트)와 3부(Linear, Vercel Geist, Grammarly, Meet), 원칙은 `PRINCIPLES.md`.

## 1. 색

### 1.1 역할(role) 기반 이름

Apple "의미(semantic) 단위로 정의, 같은 색을 다른 뜻에 재사용하지 않기", M3 color roles(surface/on-surface/primary/container/outline/outline-variant) 를 LEO 규모에 맞게 줄였다.

| 토큰 | 역할 | 쓰는 곳 | 쓰지 않는 곳 |
|---|---|---|---|
| `canvas` | 페이지 배경 | body | 카드 안 |
| `surface` | 카드·헤더·입력창·상대 말풍선 | 대부분의 컨테이너 | — |
| `surface-raised` | 다이얼로그·토스트·메뉴(위에 뜨는 면) | overlay | 일반 카드 |
| `surface-sunken` | 코드·비활성 영역·스켈레톤 | code, skeleton | 텍스트 배경 |
| `text` / `text-secondary` / `text-placeholder` | 주/보조/플레이스홀더 텍스트(Vercel Geist 의 3단 위계) | 본문 / 메타·설명 / 입력 힌트 | 장식 |
| `border` | 입력창·버튼·체크박스 경계(3:1) | 컨트롤 | 카드 경계 |
| `divider` | 장식 구분선, 카드 경계 | 목록 사이, 카드 | 컨트롤 경계(M3 "outline-variant 는 타깃 경계에 쓰지 않는다") |
| `accent` / `on-accent` | 1차 행동 버튼, 링크, "상대가 말하는 중", 점수 바, 포커스 | 화면당 1차 버튼 1개 | 2차 버튼, 장식 |
| `accent-subtle` / `on-accent-subtle` | 옅은 강조 배경 + 그 위 텍스트(배지, 선택된 탭) | 상태 배지 | 큰 면 |
| `positive` / `caution` / `negative` (+ `on-*`, `*-subtle`, `on-*-subtle`) | 결과·상태 의미색. 긍정=교정문·좋은 점수, 주의=1분 남음·경고, 부정=오류·끊기 | 상태 메시지, 점수 등급, 끊기 버튼 | 장식, 브랜드 |
| `focus` | 포커스 링 | :focus-visible | — |
| `bubble-me` / `on-bubble-me`, `bubble-partner` / `on-bubble-partner` | 말풍선 | 채팅·통화·대화 내용 | — |
| `scrim` | 다이얼로그 뒤 가림막 | Dialog | — |

색을 의미 없이 쓰지 않는다(P5). 강조색은 "지금 눌러야 할 것" 과 "지금 말하는 사람" 두 뜻으로만.

### 1.2 팔레트와 대비 (계산값, `scripts/build-tokens.ts --table`)

라이트는 M3 처럼 순백 아닌 캔버스(tone 98 급) 위에 흰 카드, 다크는 Apple 의 base/elevated 처럼 `canvas < surface < surface-raised` 로 밝아지는 3단 표면이다(반전이 아님). 텍스트 4.5:1, 큰 텍스트·UI 3:1(WCAG 1.4.3/1.4.11). 커스텀 색은 Apple 권고대로 7:1 을 지향했고 다크 모드 대부분이 AAA 다.

| 조합 | 라이트 전경 | 라이트 배경 | 라이트 대비 | 다크 전경 | 다크 배경 | 다크 대비 | 요구 |
|---|---|---|---:|---|---|---:|---|
| 본문/캔버스 | #1b1b19 | #f4f4f1 | 15.65:1 (AAA) | #ededea | #131315 | 15.81:1 (AAA) | 4.5:1 |
| 본문/표면 | #1b1b19 | #ffffff | 17.24:1 (AAA) | #ededea | #1d1d21 | 14.32:1 (AAA) | 4.5:1 |
| 본문/올라온 표면 | #1b1b19 | #ffffff | 17.24:1 (AAA) | #ededea | #27272c | 12.67:1 (AAA) | 4.5:1 |
| 본문/가라앉은 표면 | #1b1b19 | #ebebe7 | 14.43:1 (AAA) | #ededea | #0f0f11 | 16.32:1 (AAA) | 4.5:1 |
| 보조 텍스트/캔버스 | #5b5b57 | #f4f4f1 | 6.18:1 (AA) | #b3b3ae | #131315 | 8.81:1 (AAA) | 4.5:1 |
| 보조 텍스트/표면 | #5b5b57 | #ffffff | 6.82:1 (AA) | #b3b3ae | #1d1d21 | 7.98:1 (AAA) | 4.5:1 |
| 보조 텍스트/가라앉은 표면 | #5b5b57 | #ebebe7 | 5.70:1 (AA) | #b3b3ae | #0f0f11 | 9.09:1 (AAA) | 4.5:1 |
| 플레이스홀더/표면 | #6b6b66 | #ffffff | 5.35:1 (AA) | #a3a39e | #1d1d21 | 6.63:1 (AA) | 4.5:1 |
| 경계/표면 | #8b8b86 | #ffffff | 3.42:1 (AA) | #8a8a90 | #1d1d21 | 4.89:1 (AAA) | 3:1 |
| 경계/캔버스 | #8b8b86 | #f4f4f1 | 3.10:1 (AA) | #8a8a90 | #131315 | 5.40:1 (AAA) | 3:1 |
| 강조 텍스트(링크)/캔버스 | #2554c7 | #f4f4f1 | 6.00:1 (AA) | #9fbcff | #131315 | 9.81:1 (AAA) | 4.5:1 |
| 강조 텍스트(링크)/표면 | #2554c7 | #ffffff | 6.62:1 (AA) | #9fbcff | #1d1d21 | 8.88:1 (AAA) | 4.5:1 |
| 강조 위 텍스트/강조 | #ffffff | #2554c7 | 6.62:1 (AA) | #0d1f4f | #9fbcff | 8.37:1 (AAA) | 4.5:1 |
| 옅은 강조 위 텍스트/옅은 강조 | #1b3f94 | #e3ebfb | 8.02:1 (AAA) | #c6d6ff | #1f2d52 | 9.29:1 (AAA) | 4.5:1 |
| 긍정 텍스트/표면 | #1e7340 | #ffffff | 5.86:1 (AA) | #7fd49a | #1d1d21 | 9.42:1 (AAA) | 4.5:1 |
| 긍정 텍스트/캔버스 | #1e7340 | #f4f4f1 | 5.32:1 (AA) | #7fd49a | #131315 | 10.41:1 (AAA) | 4.5:1 |
| 긍정 위 텍스트/긍정 | #ffffff | #1e7340 | 5.86:1 (AA) | #06301a | #7fd49a | 8.15:1 (AAA) | 4.5:1 |
| 옅은 긍정 위 텍스트/옅은 긍정 | #155a31 | #e1f3e6 | 7.15:1 (AAA) | #a6e4b8 | #17331f | 9.42:1 (AAA) | 4.5:1 |
| 주의 텍스트/표면 | #8a5300 | #ffffff | 6.32:1 (AA) | #f2c56b | #1d1d21 | 10.37:1 (AAA) | 4.5:1 |
| 주의 위 텍스트/주의 | #ffffff | #8a5300 | 6.32:1 (AA) | #3a2600 | #f2c56b | 8.90:1 (AAA) | 4.5:1 |
| 옅은 주의 위 텍스트/옅은 주의 | #6e4200 | #fff1d6 | 7.69:1 (AAA) | #f7d998 | #3a2e12 | 9.70:1 (AAA) | 4.5:1 |
| 부정 텍스트/표면 | #b8322a | #ffffff | 5.95:1 (AA) | #ff9a92 | #1d1d21 | 8.23:1 (AAA) | 4.5:1 |
| 부정 텍스트/캔버스 | #b8322a | #f4f4f1 | 5.40:1 (AA) | #ff9a92 | #131315 | 9.09:1 (AAA) | 4.5:1 |
| 부정 위 텍스트/부정 | #ffffff | #b8322a | 5.95:1 (AA) | #4a0e0a | #ff9a92 | 7.57:1 (AAA) | 4.5:1 |
| 옅은 부정 위 텍스트/옅은 부정 | #8f2620 | #fde7e5 | 7.19:1 (AAA) | #ffb9b3 | #46201e | 8.64:1 (AAA) | 4.5:1 |
| 포커스 링/표면 | #2554c7 | #ffffff | 6.62:1 (AAA) | #9fbcff | #1d1d21 | 8.88:1 (AAA) | 3:1 |
| 포커스 링/캔버스 | #2554c7 | #f4f4f1 | 6.00:1 (AAA) | #9fbcff | #131315 | 9.81:1 (AAA) | 3:1 |
| 내 말풍선 텍스트/내 말풍선 | #ffffff | #2554c7 | 6.62:1 (AA) | #f3f6ff | #2b4fa3 | 7.06:1 (AAA) | 4.5:1 |
| 상대 말풍선 텍스트/상대 말풍선 | #1b1b19 | #ffffff | 17.24:1 (AAA) | #ededea | #27272c | 12.67:1 (AAA) | 4.5:1 |
| 강조(UI: 점수 바·아이콘)/표면 | #2554c7 | #ffffff | 6.62:1 (AAA) | #9fbcff | #1d1d21 | 8.88:1 (AAA) | 3:1 |
| 긍정(UI)/표면 | #1e7340 | #ffffff | 5.86:1 (AAA) | #7fd49a | #1d1d21 | 9.42:1 (AAA) | 3:1 |
| 주의(UI)/표면 | #8a5300 | #ffffff | 6.32:1 (AAA) | #f2c56b | #1d1d21 | 10.37:1 (AAA) | 3:1 |
| 부정(UI)/표면 | #b8322a | #ffffff | 5.95:1 (AAA) | #ff9a92 | #1d1d21 | 8.23:1 (AAA) | 3:1 |

AA 미달 조합: 0. 요구가 없는 조합(옅은 배지 배경/표면 1.19:1, 표면/캔버스 1.10:1)은 텍스트·경계·그림자로 식별하므로 1.4.11 대상이 아니다.

### 1.3 테마 전환

- 기본은 `prefers-color-scheme` (BRIEF). `tokens.css` 의 `@media (prefers-color-scheme: dark)` 블록이 `:root:not([data-theme="light"])` 에 다크 값을 넣는다.
- 설정 페이지의 "테마 모드"(시스템/라이트/다크)는 `UserSettings.theme`(마이그레이션 `add_theme`)에 저장하고, 같은 값을 쿠키 `leo_theme` 에도 둔다. 루트 레이아웃이 쿠키를 읽어 `<html data-theme="light|dark">` 를 서버에서 렌더하므로 첫 페인트부터 올바른 테마다(FOUC 없음). "시스템" 이면 속성을 두지 않는다.
- `color-scheme` 를 함께 선언해 스크롤바·폼 컨트롤·`<select>` 팝업도 테마를 따른다.
- 확인 방법: 6단계에서 Playwright 로 `data-theme=dark` 쿠키를 넣고 첫 요청 HTML 에 속성이 있는지, 라이트↔다크 전환 시 레이아웃 시프트가 없는지 확인.
- 기각: localStorage + 인라인 스크립트(쿠키 없이도 가능하나 SSR HTML 과 불일치가 생기고 CSP 인라인 스크립트가 필요), 앱 내 토글 없음(Apple 은 비권장하지만 BRIEF 확정 사항).

## 2. 타이포그래피

### 2.1 서체 결정: Pretendard Variable (다이나믹 서브셋, jsDelivr)

- 비교: Pretendard(OFL, 9굵기+Variable, Inter 기반 라틴, 다이나믹 서브셋 CSS 공식 제공) / Noto Sans KR(OFL, Google Fonts, 라틴이 Noto Sans 라 영어 대화 텍스트가 평범하고 한 파일이 큼) / Spoqa Han Sans Neo(OFL, 4굵기, Variable·다이나믹 서브셋 없음) / 시스템 서체(현행; Windows 맑은 고딕은 500·600 굵기가 없고 플랫폼마다 행간이 달라 AUDIT G11).
- 선택 이유: 한국어·영어를 한 서체로(Apple "서체 수 최소화"), Variable 1종으로 400~700 을 쓰고, 다이나믹 서브셋이 92개 유니코드 범위로 쪼개져 실제 쓰인 글자 범위만 받는다(확인: CDN CSS 에 `@font-face` 92개, 모두 `font-display: swap`, `font-weight: 45 920`).
- 로딩: `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>` + 서브셋 CSS `<link>`. 특정 woff2 프리로드는 다이나믹 서브셋 특성상 어떤 파일이 필요한지 미리 알 수 없어 하지 않는다. 폴백 스택은 Pretendard README 의 스택 그대로(`--font-sans`). swap 전환의 CLS 는 6단계에서 측정한다.
- 없으면 안 되는 것: 굵기 500/600 의 위계(Windows), 영어 대화 텍스트와 한국어 설명의 시각적 통일, 숫자 tabular(`font-variant-numeric: tabular-nums` 를 Pretendard 가 지원).
- 기각: `next/font/local` 셀프호스팅(2MB 급 파일을 저장소에 넣거나 빌드 시 받아야 함. 사용자 2명에 CDN 의존이 더 가볍다), Inter 별도 로드(불필요, Pretendard 라틴이 Inter 기반).

### 2.2 스케일 (`--type-*`)

M3 type scale 의 body-large 16/24(1.5)·label 14 medium 을 기준으로 줄였고, 한국어 본문 줄 간격은 WCAG 1.4.12 하한 1.5 를 넘는 1.6 으로 올렸다(RESEARCH 1부 D). 자간은 한글에 양(+) 자간을 주지 않는다(M3 tracking 은 라틴 기준).

| 이름 | 크기 | 줄 높이 | 굵기 | 자간 | 쓰는 곳 |
|---|---|---|---|---|---|
| display | 2.5rem(40px) | 1.15 | 700 | -0.02em | 통화 타이머, 점수 큰 숫자 (`tabular-nums`) |
| headline | 1.5rem(24px) | 1.3 | 700 | -0.01em | 페이지 제목 h1 |
| title | 1.125rem(18px) | 1.4 | 600 | 0 | 카드·섹션 제목 h2 |
| body | 1rem(16px) | 1.6 | 400 | 0 | 한국어 본문, 설명, 오류 |
| body-strong | 1rem | 1.6 | 600 | 0 | 강조, 교정문 |
| small | 0.875rem(14px) | 1.5 | 400 | 0 | 메타 정보, 힌트 |
| label | 0.875rem(14px) | 1.3 | 500 | 0 | 버튼, 탭, 배지, 폼 레이블(한 줄) |
| caption | 0.75rem(12px) | 1.4 | 400 | 0 | 표 머리글, 보조 캡션. 하한 12px(Apple 최소 11pt 보다 한글은 큼) |
| english | 1.0625rem(17px) | 1.55 | 400 | 0 | 영어 대화·예문(말풍선, 교정 원문/교정문) |

- 모바일 본문 16px 를 유지하고(iOS 입력창 자동 확대 방지에도 16px 이상 필요), 영어 대화는 1px 크게 해 한글과 x-height 차이를 보정한다.
- 줄 길이: 리포트·채팅 본문 컨테이너 `max-width: 46rem`(한글 약 46자, RESEARCH 1부 D "50자 이내").
- 200% 확대: 모든 크기가 rem 이고 고정 높이 컨테이너가 없어야 한다(6단계 확인).

## 3. 간격·라운드·고도

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `--space-1`~`--space-10` | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px | 4px 격자. 컨트롤 안 8/12, 카드 안 16/20, 섹션 사이 24/32, 페이지 상하 40/48 |
| `--radius-sm/md/lg/xl/full` | 6, 10, 14, 20, 999px | 배지/입력·버튼/카드/말풍선·큰 버튼/알약 |
| `--shadow-sm/md/lg` | 표 참고 | 카드(sm, 라이트만)/드롭다운·토스트(md)/다이얼로그(lg). 다크 모드는 그림자 대신 표면 밝기 차이(Apple base/elevated) |
| 터치 타깃 `--target-min` 44px, `--target-call` 56px | WCAG 24px 하한 → Apple 44pt 기본, 통화 주요 버튼은 M2 48dp 보다 큰 56px | 모든 버튼·체크박스·라디오의 히트 영역 44px, 끊기·음소거 56px, 인접 타깃 간격 ≥8px |

## 4. 모션

M3 easing/duration 토큰 값에서 세 단계만 쓴다(RESEARCH 1부 C). Standard 스킴(바운스 없음) — 면접 연습 도구의 성격.

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `--motion-fast` | 150ms | hover/press/토글, 탭 전환 |
| `--motion-base` | 250ms | 패널·토스트·다이얼로그 등장, 상태 메시지 |
| `--motion-slow` | 400ms | 페이지 전환 페이드, 통화 → 리포트 |
| `--motion-pulse` | 1600ms | "듣는 중"·"상대가 말하는 중" 반복 펄스(느리고 작게) |
| `--motion-ease-standard` | cubic-bezier(0.2, 0, 0, 1) | 기본 |
| `--motion-ease-enter` / `-exit` | (0,0,0,1) / (0.3,0,1,1) | 등장 / 퇴장 |

`prefers-reduced-motion: reduce` 에서는 모든 duration 토큰이 0ms 가 되어 전환이 즉시 일어나고, 반복 펄스는 정적 표시(아이콘 + 텍스트)로 대체된다(Apple "자동·반복 애니메이션 줄이기", WCAG 2.2.2/2.3.3). 모션만으로 전하는 정보는 없다(P1·P4).

## 5. 브레이크포인트

| 이름 | 값 | 레이아웃 |
|---|---|---|
| (기본) | <480px | 1열, 전폭 버튼, 하단 고정 컨트롤 |
| `sm` | ≥480px | 버튼 자동 폭 |
| `md` | ≥768px | 헤더 메뉴를 가로로, 리포트 점수 2열 |
| `lg` | ≥1024px | 컨테이너 `max-width: 64rem`, 리포트 목차 사이드 |

320px(1.4.10 Reflow) 에서도 가로 스크롤이 없어야 한다. 360·390·768·1280 은 6단계에서 스크린샷으로 확인한다.

## 6. 아이콘

- 결정: `lucide-react` 1.x (ISC 라이선스, 24px 격자, 1.5~2px 선, 트리 셰이킹으로 쓰는 아이콘만 번들). 쓰는 아이콘 약 16개: mic, mic-off, phone, phone-off, message-square, send, clock, check, alert-circle, info, x, chevron-down/right, menu, sun, moon, monitor, loader, arrow-right, volume-2, file-text, trash-2.
- 없으면 안 되는 것: 통화 상태를 색·텍스트와 함께 아이콘으로 동시에 전달(P1), 음소거의 "마이크+사선" 관습(Zoom), 끊기의 수화기 아이콘(iOS/Android). 손으로 그리면 선 굵기·정렬이 어긋나고(AUDIT G8 의 이모지 문제를 다른 형태로 반복), Material Symbols 는 폰트 전체를 받는다.
- 규칙: 레이블이 있는 버튼의 아이콘은 `aria-hidden="true"`. 아이콘만 있는 버튼(모바일 메뉴 열기, 다이얼로그 닫기)은 반드시 `aria-label`. 아이콘 크기 20px(본문 옆), 24px(통화 컨트롤), 색은 `currentColor`.
- 기각: 이모지(플랫폼마다 다르고 aria 에 섞임), Heroicons(MIT, 비슷하나 Lucide 가 아이콘 수·일관성에서 나음), 직접 SVG(일관성).

## 7. 컴포넌트 (`src/components/ui/`)

모든 컴포넌트는 토큰만 쓰고 색상 하드코딩이 없다. 상태: hover / focus-visible(2px 링 + 2px 오프셋, 3:1) / active / disabled(`aria-disabled` 또는 `disabled`, 대비 유지한 채 불투명도 대신 색 토큰으로) / loading(`aria-busy`, 라벨 유지 + 스피너).

| 컴포넌트 | 변형·크기 | 접근성 요구 | 쓰는 곳 |
|---|---|---|---|
| Button | variant: primary / secondary / danger / ghost · size: md(44px) / lg(56px) · `loading`, `icon`, `iconOnly`(aria-label 필수), `href` 면 링크 | `type="button"` 기본, 로딩 중 `aria-busy` 와 라벨 유지, 비활성은 `disabled` + 설명 텍스트 동반(P4) | 전부 |
| TextField / TextArea / Select | label 필수(숨김 가능), `hint`, `error`(`aria-describedby`, `aria-invalid`), `autoResize`(TextArea) | 3:1 경계, 포커스 링, 오류 텍스트 + 아이콘 | 폼 전부 |
| Choice (Radio/Checkbox 카드) | `kind: radio/checkbox`, 카드형(제목+설명) | 네이티브 input 을 시각적으로 숨기고 44px 히트 영역, `fieldset/legend` | 테마 선택, 통화 시간, 입력 방식 |
| Card | `padding: sm/md`, `as` | 의미 요소(section/article) 지정 가능 | 전부 |
| Badge | tone: neutral / accent / positive / caution / negative · `icon` | 텍스트 필수(색만으로 뜻 전달 금지) | 점수 등급, 상태, 종류 |
| StatusMessage | tone: info / success / warning / error · `role`: info·success → `status`, warning·error → `alert` (WCAG 4.1.3) · `action` 버튼 | 아이콘 + 텍스트, 오류는 `aria-live="assertive"` 가 아닌 role=alert 로 | 오류·성공·안내 전부 |
| Dialog | `open`, `title`(필수, `aria-labelledby`), `description`, `actions`, `danger` | `<dialog>` 기반: 포커스 트랩·Esc·스크림 클릭 닫기, 열릴 때 첫 포커스 = 취소 또는 첫 입력, 닫히면 트리거로 복귀 | 포트폴리오 삭제, 리포트 다시 만들기 |
| Tabs / Segmented | `items[{id,label,href?}]`, `value` · 링크형(기록 필터, 사용량 기간)은 `aria-current="page"` | `role="tablist"` 는 패널 전환일 때만; 필터는 `nav` + `aria-current` | 기록 필터, 사용량 필터, 포트폴리오 입력 방식 |
| EmptyState | `title`, `body`, `action`(Button 1개), `icon` | 제목 h2/h3, 행동 1개(WRITING 2.8) | 홈·채팅·기록·포트폴리오·사용량 빈 상태 |
| Spinner / Skeleton | Spinner: `label`(sr-only, 필수), size 16/24 · Skeleton: `lines`, `height` | Spinner `role="status"`, Skeleton `aria-hidden` + 상위에 `aria-busy` | 2~10초 대기 / 화면 로드 |
| Timer | `remainingSec`, `totalSec`, `warnAtSec=60` · 링 + 숫자 | `role="timer"`, `aria-live="off"`, 60초 이하 `caution` 색 + 텍스트 "1분 남았어요" 는 별도 `role=status` | 통화 중 |
| CallStatus | state: listening / speaking / thinking / muted / waiting / ending · 아이콘 + 라벨 + 펄스 | `role="status"` 1개 영역, reduced-motion 에서 정적 | 통화 중 |
| ScoreGauge | `score`(1~10), `label`, `comment` · 바 + 숫자 + 등급 배지 | `role="img"` + aria-label "문법 6점, 10점 만점, 괜찮아요"; 색은 등급(positive/accent/caution)과 텍스트 동반 | 리포트 |
| DiffText | `original`, `corrected`, `explanation` · 두 줄(내가 한 말 / 이렇게 말해요), 취소선 없음 | 각 줄에 보이는 라벨, 영어는 `lang="en"` | 리포트 교정·어휘·표현 |
| Bubble | `role: me/partner`, `hint`, `interim` | 화자 라벨 텍스트(sr-only 또는 보임) + `lang="en"`, 힌트는 말풍선 밖 별도 블록 | 채팅·통화·대화 내용 |
| Toast | `message`, `tone`, 자동 닫힘 5초, 호버 시 정지 | `role="status"`, 포커스 가능한 요소 위에 겹치지 않음(2.4.11) | 설정 저장, 포트폴리오 추가·삭제 |
| ThemeSelect | system / light / dark | 라디오 그룹, 즉시 적용 + 저장 | 설정 |

각 컴포넌트는 `tests/unit/ui/*.test.tsx` 에서 `renderToStaticMarkup` 으로 역할·속성·라벨을 확인한다(기존 테스트 방식과 동일, DOM 없이).

## 8. 전역 CSS 재작성

`src/app/globals.css` 를 토큰 기반으로 다시 쓴다: reset → 타이포 유틸(`.t-display` …) → 레이아웃(`.container`, `.stack`, `.row`) → 컴포넌트 CSS(`ui/*.css` 를 각 컴포넌트 옆에 두지 않고 `globals.css` 한 파일의 섹션으로 둔다 — 빌드 체계 변경 없이 CSS 변수만으로 충분하고, 파일 하나가 전수 확인에 유리). 기존 클래스 이름 중 E2E 가 참조하는 것(`.chat`, `.correction`, `.orig`, `.fixed`)은 유지하거나 테스트를 함께 바꾼다.
