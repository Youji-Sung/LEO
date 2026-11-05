# 방향 탐색 (2단계)

출발점은 `00-understanding.md` 4절("시각 방향이 반드시 해야 하는 일"). 후보 8개를 넓게 늘어놓고, 서로 가장 멀리 떨어진 셋을 골랐다. 참고 자료는 실제로 읽은 것만 적었고(2026-11-04, WebFetch), 읽지 못한 것은 "확인 못 함"으로 남겼다.

## 1. 참고한 것

### 제품(같은 문제를 푸는 서비스가 자신을 어떻게 보이게 하는가)

| 출처 | 읽음 | 가져온 것 |
|---|---|---|
| Speak — https://www.speak.com/ | 예 | "Real conversation. No pressure.", "Receive feedback on what actually matters, and the freedom to go again as many times as you need." 말하기 연습을 **부담 없는 반복**으로 프레이밍. 업beat 한 톤. → 무대 시안의 "기세로 긴장을 다룬다" 가설의 근거 |
| Cambly — https://www.cambly.com/english | 예 | "Learn from mistakes, without fear or judgment." 통화 경험을 **판단 없는 자리**로 프레이밍 → 세 시안 공통: 실수를 보여 주는 화면(리포트)이 판정처럼 보이면 안 된다 |
| interviewing.io — https://interviewing.io/ | 예 | "Get detailed, actionable feedback from experts", 익명·오디오 전용 세션. 진지함과 신뢰를 로고·전문가로 세움. → 콘솔 시안의 "정확함이 곧 신뢰" 근거 |
| Headspace — https://www.headspace.com/ | 예(텍스트만; 그림은 alt 텍스트뿐) | "A playground for your mind", 불안을 "해결 가능한 목표"로 긍정적으로 다룸. 그림 스타일은 확인 못 함 → 파스텔·웰니스 후보(G)는 텍스트 톤만 참고 |
| Linear — https://linear.app/ | 예 | "Reduces noise and restores momentum", "Designed for speed". 흰 여백 + 제품 스크린샷, "Fig 0.1" 식 캡션. 이전 세션이 시각 언어로 택한 계열 → 현행과 같은 축이라 후보 E(스위스 미니멀)의 기준점 |
| Warp — https://www.warp.dev/ | 예(2026-11 현재 터미널이 아니라 "software factory" 를 전면에 둠) | "fig. 1 — the factory" 식 도식 캡션, 블록 문자 글리프로 상태 표시, YAML 패널. **도식·로그 미학**은 확인, 다크 테마 여부는 텍스트로 확인 못 함 → 콘솔 시안 |
| iA Writer — https://ia.net/writer | 예 | "No buttons, no popups, no title bar", "Nothing distracts, nothing decorates", "Keep your hands on the keys and your mind in the text" → 서재 시안의 "장식 없이 글만" 과 콘솔 시안의 모노스페이스 글쓰기면 |
| Duolingo 디자인 허브 — https://blog.duolingo.com/hub/design/ (design.duolingo.com 은 301) | 예(목록만) | 글 4편 제목과 Duo 일러스트 alt 텍스트만 있고 색·서체 규칙은 없음 → 마스코트·게임화 후보(H)의 근거로는 "확인 못 함". 기각 이유는 이전 세션 RESEARCH 3부와 00-understanding 2절(성인·개발자)에 둔다 |

### 가이드라인·서체

| 출처 | 읽음 | 가져온 것 |
|---|---|---|
| Butterick's Practical Typography, Line length — https://practicaltypography.com/line-length.html | 예 | "Aim for an average line length of 45–90 characters, including spaces." → 서재 시안 영어 본문 60~70자 |
| 같은 책, Body text — https://practicaltypography.com/body-text.html | 예 | "On the web, body text can be in a sans serif or serif font." 인쇄는 세리프 강력 권장 → 서재 시안의 영어 세리프는 "읽는 글" 프레이밍이지 가독성 우위 주장은 아님 |
| Newsreader 설명 — https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/DESCRIPTION.en_us.html | 예 | "primarily intended for continuous on-screen reading in content-rich environments." Production Type 제작 |
| Newsreader OFL — https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/OFL.txt | 예 | "Copyright 2020 The Newsreader Project Authors" / SIL OFL 1.1 |
| Noto Serif KR OFL — https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifkr/OFL.txt | 예 | "Copyright 2012 Google Inc." / SIL OFL 1.1. 디자인 설명 페이지는 읽지 않음(확인 못 함) |
| IBM Carbon 타이포그래피 — https://carbondesignsystem.com/guidelines/typography/overview/ | 예 | "Keep type color neutral in running text.", "The semibold weight is ideal for section headers, but should not be used for long text.", Plex Sans/Serif/Mono 스택, productive(제품)/expressive(편집) 두 세트 → 콘솔 시안의 서체·색 규칙 |
| IBM Plex README — https://raw.githubusercontent.com/IBM/plex/master/README.md | 예 | "Plex has been designed to work well in user interface (UI) environments", Sans KR 포함, OFL |
| IBM Plex Sans KR OFL — https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsanskr/OFL.txt | 예 | "Copyright © 2017 IBM Corp. with Reserved Font Name "Plex"" / SIL OFL 1.1 |
| JetBrains Mono — https://www.jetbrains.com/lp/mono/ , OFL https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/OFL.txt | 예(앞 100,000자) | "the height of the lowercase is maximized", 1/l/I 구분, 점 있는 0. OFL 1.1. → 콘솔 시안에서 Plex Mono 대신 쓸 수 있는 대안으로 검토했으나 Plex Sans KR 과 한 가족인 Plex Mono 를 택함 |
| GitHub Primer 색 — https://primer.style/foundations/color/overview | 예(앞부분) | "Semantic colors are typically used to communicate status, action, or emphasis.", "Each semantic color is tied to a role with a specific meaning.", "Every pattern in Primer is built to work across all color modes out of the box." diff 색 규칙은 잘린 뒤쪽에 있어 확인 못 함 → 콘솔 시안의 diff 표현은 관습(+ 초록 / − 빨강)으로 하고 출처는 "확인 못 함" |
| Apple HIG Color — https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json | 예(앞 100,000자) | "Avoid using the same color to mean different things.", "choosing your brand color as the app accent color can be an effective way to tailor your app experience and reflect your company's identity." → 무대 시안의 단일 브랜드색 |
| Apple HIG Dark Mode — …/dark-mode.json | 예 | base/elevated 두 배경, "Ensure that your app looks good in both appearance modes." 다크는 반전이 아님 → 세 시안 모두 다크 팔레트를 따로 짠다 |
| 이전 세션 RESEARCH.md(WCAG 2.2 대비·타깃·모션, M3 색 역할, Pretendard) | 예 | 접근성 하한과 Pretendard 로딩 방식은 그대로 쓴다 |

읽지 못해 인용하지 않은 것: Duolingo 브랜드 가이드(외부 링크, 열지 않음), Material 3 color overview(JS 렌더링, r.jina.ai 리더가 2026-11 현재 401), 토스 디자인 시스템(열지 않음), Readwise·Matter 같은 읽기 앱(열지 않음).

## 2. 후보 8개

| | 후보 | 한 줄 | 긴장(통화)을 다루는 방식 | 판단 |
|---|---|---|---|---|
| A | **서재** — 종이·잉크·세리프 | 영어를 "읽고 소리 내는 글"로 | 차분함. 자극을 빼서 | **채택** |
| B | **무대** — 한 가지 브랜드색, 굵은 활자, 알약 | 연습을 "기세 있는 무대"로 | 기세. 크게 보여 주고 밀어서 | **채택** |
| C | **콘솔** — 다크 우선, 모노스페이스, diff | 내 영어를 "로그처럼 측정"하는 도구로 | 정확함. 숫자와 기록으로 | **채택** |
| D | 네오 브루탈리즘 — 검은 2px 테두리, 하드 섀도 | 유행하는 "쿨함" | 소음을 더함 | 기각: 리포트 순간(취약함)에 시끄럽고, 2~3년 안에 낡아 보일 가능성이 큼. B 가 "굵음" 을 더 차분하게 가져감 |
| E | 스위스 미니멀 — 흑백, 그리드, 색 없음 | 현행의 정제판 | 현행과 같음 | 기각: 운영자가 맞지 않다고 한 현행(Linear 계열)의 변주라 세 시안의 "분명히 다른 방향" 조건에 걸림 |
| F | 기업 면접 — 네이비, 격식 | 진짜 면접처럼 | 긴장을 키움 | 기각: 사용자는 이미 시험 앞에 있다. 화면까지 면접관이면 연습실이 아니다(PRINCIPLES ①②와 충돌) |
| G | 웰니스 파스텔 — 둥글고 흐린 색, 그라데이션 | 불안을 달래기 | 부드러움 | 부분 흡수: "차분함" 은 A 로, "둥근 큰 형태" 는 B 로. 단독으로는 개발자에게 가볍게 읽히고 대비 확보가 어려움 |
| H | 게임화·마스코트(Duolingo 류) | 재미 | 보상으로 | 기각: 성인·개발자·면접 문맥(00-understanding 2절). 근거 자료도 확인 못 함 |
| I | "AI 제품" 룩 — 그라데이션 오브, 유리질, 음성 파형 중심 | 최신 AI 앱처럼 | 오브 애니메이션 | 기각: 모든 AI 스타트업과 같아져 장소가 안 생기고, 오브 중심은 전사(transcript) 를 밀어낸다(이전 세션 SCREENS 1절의 기각 사유와 같음) |

## 3. 왜 이 셋인가

세 시안은 **다섯 축 모두에서** 서로 다르다. 한 방향의 변주가 아니다.

| 축 | 서재 study | 무대 stage | 콘솔 console |
|---|---|---|---|
| 은유 | 읽는 책·대본 | 연습 무대·코트 | 세션 로그·터미널 |
| 색 온도·채도 | 따뜻한 종이, 저채도, 강조 1(진한 적갈) | 밝은 크림 + 고채도 코랄 면(面) | 차가운 흑회, 형광 초록 강조 |
| 서체 | 한국어 제목 Noto Serif KR, 영어 Newsreader(세리프), UI Pretendard | Pretendard 800~900, 큰 크기, 좁은 자간 | IBM Plex Sans KR + IBM Plex Mono(영어·숫자) |
| 형태 | 모서리 2~4px, 가는 괘선, 그림자 없음, 넓은 여백 | 알약(999px), 2px 테두리, 색 블록, 그림자 없음 | 모서리 0~4px, 1px 패널 경계, 촘촘한 밀도 |
| 대화 표현 | 대본: 화자 라벨이 보이고 말풍선 없음 | 큰 알약 말풍선 | 로그 행: 화자 열 + 본문 열, diff 식 교정 |
| 통화 화면 | 큰 세리프 숫자 시계, 한 줄 상태, 적갈색 끊기 | 어두운 무대 위 거대한 숫자와 알약 컨트롤(라이트·다크 공통 다크 무대) | 상태줄(● 듣는 중 09:58) + 사각 키 |
| 긴장을 다루는 방식 | 자극을 빼서 차분하게 | 크게 보여 주고 응원해서 | 수치와 기록으로 통제감을 줘서 |
| 포기하는 것 | 활기. 처음엔 밋밋해 보일 수 있음 | 조용함. 10분 통화 내내 색이 강함 | 온기. 리포트가 차갑게 읽힐 위험 |

공통으로 유지하는 것(시각과 독립): 문구 전체(`WRITING.md`), 접근성 하한(텍스트 4.5:1·UI 3:1·타깃 44/56px·reduced-motion), 화면 구조와 흐름, 통화 컨트롤 격자.

## 4. 구현 방식(3단계로 넘기는 결정)

- 전환: `<html data-direction="study|stage|console">`. 쿠키 `leo_direction` 을 `?direction=<이름>` 쿼리로 넣고(`?direction=off` 로 지움), `LEO_DIRECTION` 환경 변수로 기본값을 줄 수 있다. 쿠키가 없으면 현행 그대로다(어느 시안도 적용하지 않는다는 브리프).
- 시안은 각각 `src/app/directions/<이름>.css` 한 파일. `:root[data-direction="…"]` 아래에서 토큰을 덮고 컴포넌트 CSS 를 재정의한다. 마크업은 공통이라 세 시안이 같은 DOM 을 다르게 입힌다. 이유: (1) 세 시안을 한 브랜치·한 서버에서 번갈아 볼 수 있다, (2) 서브에이전트 셋이 파일 충돌 없이 병렬로 만든다, (3) 2차 세션이 고른 시안의 CSS 를 토큰·globals 로 흡수하면 된다.
- 폰트는 시안별 `<link>` 를 루트 레이아웃이 `data-direction` 에 따라 넣는다(Google Fonts). 현행 Pretendard 링크는 유지.
- 스크린샷은 `scripts/screenshots.ts --direction <이름>` 이 쿠키를 넣고 `docs/design/directions/<이름>/shots/` 에 찍는다.
