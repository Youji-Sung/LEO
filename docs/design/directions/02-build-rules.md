# 시안 구현 규칙 (3단계, 메인 세션이 먼저 확정한 기준)

세 시안은 서브에이전트 셋이 병렬로 만든다. 이 문서는 셋이 같은 기준으로 비교되게 메인 세션이 먼저 정한 것이다. 각 시안의 고유한 결정은 `docs/design/directions/<이름>/README.md` 에 적는다.

## 1. 공통 규칙

### 건드리는 파일

- 시안 하나당 **`src/app/directions/<이름>.css` 한 파일**과 **`docs/design/directions/<이름>/README.md`** 만 쓴다. 다른 파일(컴포넌트, `globals.css`, `tokens.ts`, 문구, 테스트, 스크립트)은 고치지 않는다. 마크업은 세 시안이 공유한다.
- CSS 만으로 안 되는 것은 README 의 "CSS 만으로 못 한 것" 절에 적어 2차 세션으로 넘긴다. 그 자리에서 마크업을 고치지 않는다.
- 커밋하지 않는다(메인 세션이 한다). `npm run check`·E2E 도 메인이 돌린다.

### 전환과 선택자

- 루트 레이아웃이 `<html data-direction="<이름>">` 과 시안 폰트 `<link>` 를 넣는다(`src/lib/direction.ts`). 시안 CSS 는 **모든 규칙을 `[data-direction="<이름>"]` 아래**에 둔다. 쿠키가 없을 때 현행 화면이 1px 도 바뀌면 안 된다.
- 토큰 덮어쓰기 골격(라이트 → 시스템 다크 → 수동 다크 순서, 세 블록 모두 필요):

```css
:root[data-direction="study"] { /* 라이트 팔레트: tokens.css 의 --color-* 31개 전부 */ }
@media (prefers-color-scheme: dark) {
  :root[data-direction="study"]:not([data-theme="light"]) { /* 다크 팔레트 31개 전부 */ }
}
:root[data-direction="study"][data-theme="dark"] { /* 다크 팔레트 31개 전부(위와 같은 값) */ }
```

- 31개 색 토큰 이름: canvas, surface, surface-raised, surface-sunken, text, text-secondary, text-placeholder, border, divider, accent, on-accent, accent-subtle, on-accent-subtle, positive, on-positive, positive-subtle, on-positive-subtle, caution, on-caution, caution-subtle, on-caution-subtle, negative, on-negative, negative-subtle, on-negative-subtle, focus, bubble-me, on-bubble-me, bubble-partner, on-bubble-partner, scrim. 컴포넌트가 전부 이 변수를 쓰므로 하나라도 빠지면 현행 색이 섞인다.
- 컴포넌트 재정의는 `[data-direction="study"] .card { … }` 처럼 쓴다. `globals.css` 가 테마 선택자 아래에 둔 규칙(`:root[data-theme="dark"] .card`, `@media … :root:not([data-theme="light"]) .card`)을 덮을 때는 같은 구조로 특이도를 맞춘다.
- 서체·크기·간격·라운드·그림자 토큰(`--font-sans`, `--type-*`, `--radius-*`, `--shadow-*`, `--space-*`)도 같은 블록에서 덮을 수 있다.
- 화자 라벨처럼 숨겨진 텍스트를 보이게 쓰고 싶으면 `.sr-only` 를 그 자리에서만 되돌린다: `[data-direction="x"] .bubble > .sr-only { position: static; width: auto; height: auto; margin: 0; clip: auto; overflow: visible; white-space: normal; }`.
- `prefers-reduced-motion` 에서 새 애니메이션은 멈춰야 한다(`globals.css` 끝의 전역 규칙이 대부분 덮지만 새 `@keyframes` 를 쓰면 그 블록에서 끈다).

### 지키는 것 (시각과 독립)

- 문구는 그대로(`src/content/ko.ts`). `content:` 로 글자를 더할 때는 장식 기호(`$`, `//`, `+`, `−`, 번호)만. 한국어 문장을 CSS 로 만들지 않는다.
- 대비: 텍스트 4.5:1, 큰 텍스트(24px 이상 또는 18.66px 굵게) 3:1, UI 경계·포커스 링 3:1. `src/design/tokens.ts` 의 `contrastPairs` 33쌍이 기준이며, 시안 팔레트로 같은 쌍을 계산해 README 에 표로 남긴다(라이트·다크). 계산은 `src/lib/contrast.ts` 의 `contrastRatio` 를 쓰는 작은 스크립트로 한다.
- 터치 타깃 44px, 통화 주요 버튼 56px. 포커스 링은 지우지 않는다(색은 바꿔도 된다).
- 320px 에서 가로 스크롤 없음(촬영 스크립트가 `overflow.md` 에 보고한다).
- 화면 구조·흐름·기능은 그대로. CSS `order`·`grid` 로 배치를 바꾸는 것은 된다.

### 촬영과 확인

- `npx tsx scripts/screenshots.ts --direction <이름> --port <포트> --axe` 가 `docs/design/directions/<이름>/shots/` 에 9개 상태(로그인, 홈, 통화 설정, 통화 시작 전, 통화 중→음소거→종료 중→통화 리포트, 채팅 힌트, 채팅 리포트, 기록, 설정) × 1280/390 × 라이트/다크 = 48장과 `index.md`, `axe.md`, `overflow.md` 를 만든다. 포트는 시안마다 다르다: study 3151, stage 3152, console 3153.
- 찍은 PNG 를 **직접 열어 본다**(Read 도구). 최소 두 번 돌리며 고친다. 마지막 결과의 `axe.md` 위반 0, `overflow.md` 가로 스크롤 0 을 README 에 적는다. 0 이 아니면 이유를 적는다.
- 실제 Claude API 는 호출하지 않는다(스크립트가 `CLAUDE_MOCK=1` 로 띄운다).

### README 한 쪽 (운영자가 세 장을 나란히 읽는다. 700~1,000자 안팎, 표 포함)

1. 한 줄 — 이 방향은 서비스를 무엇으로 보이게 하는가
2. 왜 이 서비스에 맞는다고 보는가 (00-understanding 4절의 다섯 가지에 어떻게 답하는가)
3. 어떤 사용자 이해에서 나왔는가 (긴장을 다루는 방식)
4. 구성 요소 — 색(라이트·다크 핵심값), 서체, 형태, 밀도, 대화·통화·리포트 표현
5. 참고한 것 — `01-exploration.md` 1절의 출처 중 실제로 쓴 것만 URL 로. 새로 읽은 것이 있으면 URL 과 함께 추가. 읽지 않은 것은 인용하지 않는다
6. 이 방향을 택하면 포기하는 것
7. 이전 산출물에서 바꾼 것 — `PRINCIPLES.md`·`SYSTEM.md` 의 어떤 원칙·토큰을 왜 바꿨는가
8. 추가한 외부 의존성과 이유(폰트 등; 라이선스 출처)
9. 대비 표(라이트·다크, 33쌍, 최저값 표시)와 axe·overflow 결과
10. CSS 만으로 못 한 것 (2차 세션에서 마크업·컴포넌트를 고쳐야 할 목록)

## 2. 시안별 확정 사항

아래는 메인 세션이 정한 뼈대다. 값은 대비를 맞추며 조정해도 되지만 **은유·온도·서체 계열·형태 언어**는 바꾸지 않는다.

### study — 서재

- 은유: 읽고 소리 내는 책·대본. 자극을 빼서 긴장을 낮춘다.
- 색: 라이트는 따뜻한 종이(캔버스 #f5f0e6 근처, 표면은 같은 종이이거나 아주 옅은 차이) 위 잉크(#221c15). 다크는 따뜻한 검정(#171310 근처) 위 크림. **강조색은 잉크**(1차 버튼은 잉크 면에 종이색 글자, 다크는 반대) — 색이 아니라 활자가 주인공. 의미색은 교정 초록, 오류 빨강, 주의 황토 세 개만, 모두 저채도.
- 서체: 한국어 제목·브랜드 `"Noto Serif KR"`, 영어 대화·예문·교정문(`[lang="en"]`) `"Newsreader"`(18~19px, 이탤릭 축 사용 가능), 한국어 UI·본문 Pretendard 그대로.
- 형태: 모서리 2~4px, 그림자 없음, 가는 괘선(1px divider) 으로 구획. 카드 배경을 없애고 위 괘선이나 여백으로 섹션을 나눈다. 넓은 여백. 영어 본문 줄 길이 60~70자.
- 대화: 말풍선 없음. 대본처럼 양쪽 다 왼쪽 정렬, 화자 라벨("나"/"상대")을 작은 산세리프로 보이게, 상대 대사는 왼쪽 괘선, 내 대사는 Newsreader 이탤릭 또는 들여쓰기. 힌트는 여백 주석처럼.
- 통화: 시계는 Newsreader 큰 숫자(48~56px, tabular), 상태는 한 줄 글자와 작은 점, 끊기는 빨강 면, 음소거·연장은 괘선 버튼.
- 리포트: 장(章)처럼 세리프 제목과 번호, 점수는 "6 / 10" 큰 세리프 숫자와 가는 막대, 교정 두 줄은 원문 Newsreader 보통, 교정문 Newsreader 600 초록.
- 포기하는 것: 활기. 처음엔 밋밋해 보일 수 있다.

### stage — 무대

- 은유: 연습 무대·코트. 크게 보여 주고 응원해서 긴장을 밀어낸다.
- 색: 라이트는 크림(캔버스 #fff6e9 근처) 위 거의 검정 글자, **브랜드색 하나(코랄, #d63a18 근처)** 를 면(面)으로 크게 쓴다(홈 상단 블록, 현재 메뉴 알약, 1차 버튼, 점수 타일). 다크는 따뜻한 검정(#141210 근처) 위 밝은 코랄(#ff7a5c 근처). 코랄을 글자로 쓸 때는 4.5:1 이 되는 진한 값으로 따로 둔다.
- 서체: Pretendard 그대로, **굵기 800~900** 과 큰 크기(h1 32~36px, 통화 시계 64~72px), 자간 -0.02~-0.03em. 영어 대화도 Pretendard 로 크게(18px).
- 형태: 알약(버튼 999px), 카드 20~24px 라운드에 2px 테두리 또는 색 블록, 그림자 없음. 입력창 2px 테두리. 점수 막대 12px 알약.
- 대화: 큰 알약 말풍선(내 말은 코랄 면, 상대는 흰/어두운 면), 힌트는 작은 알약.
- 통화: **라이트·다크 모두 어두운 무대**(`.call-shell` 배경 #141210 근처)에 거대한 시계, 큰 알약 상태, 끊기 알약(빨강), 음소거·연장 알약. 이유를 README 에 적는다.
- 리포트: 점수는 큰 숫자 타일(등급색 면), 교정은 굵은 왼쪽 막대, 다음 행동 버튼은 큰 알약.
- 포기하는 것: 조용함. 10분 통화 내내 색이 강하다.

### console — 콘솔

- 은유: 세션 로그·터미널. 수치와 기록으로 통제감을 준다.
- 색: **다크 우선**. 다크 캔버스 #0d1117 근처, 패널 #161b22, 경계 #30363d, 글자 #e6edf3, 강조는 시안(cyan, #39c5e0 근처; 1차 버튼·링크·"상대가 말하는 중"), 교정 초록 #3fb950, 오류 빨강 #ff7b72, 주의 황색 #d29922. 라이트는 종이 같은 터미널: 캔버스 #f6f8fa, 패널 #ffffff, 글자 #1f2328, 강조 틸 #0e7490, 초록 #1a7f37, 빨강 #cf222e, 황색 #9a6700. (값은 대비 계산으로 조정)
- 서체: 한국어 UI `"IBM Plex Sans KR"`, 영어 대화·숫자·시각·배지·표·메타 `"IBM Plex Mono"`. 본문 15px, 메타 12px.
- 형태: 모서리 0~3px, 1px 패널 경계, 그림자 없음, 밀도 높게(간격 토큰을 한 단계씩 줄임). 헤더는 상태줄처럼.
- 대화: 말풍선 없음. 로그 행 = 화자 열(모노, "나"/"상대" 보이게) + 본문 열. 상대 행은 옅은 패널색, 내 행은 캔버스색. 힌트는 `//` 접두사 주석 행(초록 모노).
- 통화: 상단 상태줄(● + 상태 + 모노 시계 40~48px), 전사는 로그, 컨트롤은 사각 키(끊기 빨강 면).
- 리포트: 교정은 diff — 원문 행 앞 `−` 와 옅은 빨강 배경, 교정문 행 앞 `+` 와 옅은 초록 배경(둘 다 모노). 점수는 모노 "6/10" 과 분할 막대. 목차는 탭 줄.
- 포기하는 것: 온기. 리포트가 차갑게 읽힐 위험이 있다.
