# 시안 study — 서재

2026-11-04. 구현은 `src/app/directions/study.css` 한 파일, 촬영 결과는 `shots/`(48장, `index.md`·`axe.md`·`overflow.md`). 뼈대는 `../02-build-rules.md` 2절 "study" 를 따랐고, 아래는 그 안에서 내린 결정이다.

## 1. 한 줄

LEO 를 **읽고 소리 내는 대본이 놓인 서재**로 보이게 한다. 종이 위 잉크, 세리프 제목, 대본처럼 적힌 영어 대화. 색이 아니라 활자가 주인공이다.

## 2. 왜 이 서비스에 맞는가 (00-understanding 4절)

1. 장소 — 흰 카드와 파란 버튼이 사라지고 따뜻한 종이색 한 장 위에 괘선만 남는다. 열면 "읽는 방"이다.
2. 영어가 주인공 — 영어만 Newsreader 18px 세리프, 한국어 UI 는 Pretendard 그대로. 영어 대사는 대본처럼 화자 라벨과 함께 왼쪽에 놓인다.
3. 통화 — 상단에 Newsreader 52px 시계 하나, 그 아래 "● 듣는 중" 한 줄, 하단에 괘선 버튼 둘과 붉은 끊기 면 하나. 말풍선·링·상태 카드가 없다.
4. 리포트 — 장(章) 번호 `01`~`07` 와 세리프 제목, "6/10" 큰 세리프 숫자와 3px 가는 막대, 교정문은 초록 Newsreader 600. 코치가 교정해 준 원고로 읽힌다.
5. 라이트·다크 — 라이트는 종이(#f5f0e6)·잉크(#221c15), 다크는 따뜻한 검정(#171310)·크림(#ece4d4). 둘 다 따로 짰고 반전이 아니다.

## 3. 어떤 사용자 이해에서 나왔는가

사용자는 시험을 앞둔 성인 개발자다(00-understanding 2절). 이 시안은 **자극을 빼서 긴장을 낮춘다.** 통화 10분 동안 색·그림자·움직이는 링이 없고, 실수를 보여 주는 리포트는 빨간 표식 대신 "내가 한 말 / 이렇게 말해요" 두 줄을 같은 서체로 나란히 둔다(Cambly 의 "without fear or judgment", iA Writer 의 "Nothing distracts, nothing decorates" 를 화면으로 옮긴 것). 평가받는 자리가 아니라 혼자 읽는 자리를 만든다.

## 4. 구성 요소

| 항목 | 결정 |
|---|---|
| 색(라이트) | 캔버스 #f5f0e6, 입력면 #faf6ee, 가라앉은 면 #ebe4d6, 잉크 #221c15, 보조 #5c5247, 경계 #857a6c, 괘선 #d8cfbf. **강조 = 잉크**(1차 버튼은 잉크 면에 종이색 글자). 의미색 셋: 교정 초록 #2f6b40, 주의 황토 #855417, 오류 빨강 #a83a2f(모두 저채도) |
| 색(다크) | 캔버스 #171310, 입력면 #1d1814, 크림 #ece4d4, 보조 #b3a893, 경계 #8a7e6c, 괘선 #3b3329. 강조 = 크림(1차 버튼은 크림 면에 검정 글자). 초록 #9ec99c, 황토 #d7b26b, 빨강 #e08d7e |
| 서체 | 한국어 제목·브랜드·legend·목록 제목 `Noto Serif KR` 600(h1 30px, h2 20px, 리포트 장 제목 24px, 브랜드 22px 자간 0.14em). 영어(`[lang="en"]`) `Newsreader` 18px/1.5, 광학 크기 자동, 내 대사는 이탤릭. 숫자(시계 52px, 점수 32px, 사용량) 도 Newsreader. 한국어 UI·본문 Pretendard |
| 형태 | 모서리 2~4px(알약 없음), 그림자 없음. 카드는 배경·테두리를 버리고 **위 괘선 1px** 으로만 구획. 헤더·페이지 머리말·통화 컨트롤은 잉크 1px 선. 버튼은 1px 잉크 괘선(2차)·잉크 면(1차)·빨강 면(끊기). 배지는 1px 테두리의 작은 표. 상태 메시지는 색면 대신 왼쪽 2px 괘선 |
| 밀도 | 본문 여백 상 40px·하 64px, 섹션 사이 40px, 대화 항목 사이 24px. 영어 본문 폭 38rem(18px 에서 60~70자) |
| 대화 | 말풍선 없음. 양쪽 다 왼쪽 정렬. 화자 라벨("나:", "상대:")을 12px Pretendard 500 자간 0.08em 으로 **보이게**. 상대 대사는 잉크 1px 왼쪽 괘선, 내 대사는 40px 들여쓰기 + 이탤릭. 힌트는 들여쓰기 안쪽에 13px 초록 여백 주석 |
| 통화 | 상단 좌 브랜드·테마, 우 Newsreader 52px 시계(390px 에서 48px, 링 숨김). 상태는 12px 점 + 한 줄 글자(부제는 같은 줄). 전사는 대본. 하단은 잉크 선 위에 괘선 버튼 56px, 끊기는 빨강 면 |
| 리포트 | 목차는 "1. 요약 2. 점수 …" 세리프 한 줄. 각 섹션 위에 `01`~`07` 장 번호(CSS counter). 점수는 "6/10" 32px 세리프 + 3px 막대(높음 초록, 낮음 황토, 그 외 잉크). 교정은 원문 Newsreader 400 잉크, 교정문 Newsreader 600 초록. 제안("어휘·표현")은 초록 대신 잉크 600 — 색은 "고침"에만 |

## 5. 참고한 것 (실제로 읽은 것만, `01-exploration.md` 1절)

- Butterick, Line length — https://practicaltypography.com/line-length.html : 45~90자 → 영어 본문 38rem(60~70자)
- Butterick, Body text — https://practicaltypography.com/body-text.html : 웹에서 세리프/산세리프 모두 가능 → 영어 세리프는 "읽는 글" 프레이밍이지 가독성 우위 주장이 아님
- Newsreader 설명 — https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/DESCRIPTION.en_us.html : 화면 연속 읽기용, 광학 크기 축 → 대화·시계·점수에 씀
- Newsreader OFL — https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/OFL.txt
- Noto Serif KR OFL — https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifkr/OFL.txt
- iA Writer — https://ia.net/writer : "Nothing distracts, nothing decorates" → 카드·그림자·색면 제거
- Cambly — https://www.cambly.com/english : "without fear or judgment" → 교정을 빨간 표식 없이 두 줄로
- Apple HIG Dark Mode — https://developer.apple.com/tutorials/data/design/human-interface-guidelines/dark-mode.json : 다크는 반전이 아님 → 따뜻한 검정·크림 팔레트를 따로 짬

새로 읽은 외부 자료는 없다.

## 6. 이 방향을 택하면 포기하는 것

- 활기. 처음 열면 밋밋하고 "옛날 책" 같아 보일 수 있다. 홈에 눈을 끄는 색면이 없다.
- 즉시 식별. 알약 배지와 색면이 사라져 "리포트 있음"·"진행 중" 같은 상태가 작은 괘선 표로만 보인다.
- 세리프 로딩. Google Fonts 2종(Noto Serif KR 3굵기 + Newsreader 가변) 을 더 받는다. 첫 그림이 Pretendard 로 떴다가 세리프로 바뀔 수 있다(`display=swap`).

## 7. 이전 산출물에서 바꾼 것

- `PRINCIPLES.md` P5 "서체 1종" → **3종 역할 분담**(Noto Serif KR 제목 / Newsreader 영어·숫자 / Pretendard UI). "강조색 1개" 는 유지하되 그 하나를 파랑이 아닌 **잉크**로 — 색이 아니라 활자 무게로 1차 행동을 가리킨다. P1·P2·P3·P4 는 그대로.
- `SYSTEM.md` 1절 토큰 31개 전부 다시 채움(위 표). `accent` 와 `text` 가 같은 값이라 "링크 = 잉크 + 밑줄" 이 된다. `bubble-*` 는 캔버스와 같은 값(말풍선 없음).
- `SYSTEM.md` 3절: `--radius-*` 6/10/14/20/999 → 2/2/3/4/4, `--shadow-*` 모두 none. 카드의 surface 배경 → 투명 + 위 괘선.
- `SYSTEM.md` 2절: headline 24px 700 → 30px 600 세리프, title 18px → 20px 세리프, english 17px/1.55 → 18px/1.5 Newsreader, display 40px → 48px(로그인 브랜드).
- 유지: 문구 전체, 터치 타깃 44/56px, 포커스 링(잉크 2px, 오프셋 3px), reduced-motion(새 keyframes 없음), 통화 컨트롤 격자, 리포트 섹션 순서.

## 8. 추가한 외부 의존성

| 의존성 | 이유 | 라이선스 |
|---|---|---|
| Noto Serif KR 500/600/700 (Google Fonts) | 한국어 세리프 제목·브랜드. Pretendard 에는 세리프가 없다 | SIL OFL 1.1, "Copyright 2012 Google Inc." (OFL.txt, 위 링크) |
| Newsreader 가변(ital, opsz 6..72, wght 400..700) (Google Fonts) | 영어 대화·숫자용 화면 읽기 세리프, 이탤릭·광학 크기 축 | SIL OFL 1.1, "Copyright 2020 The Newsreader Project Authors" (OFL.txt, 위 링크) |

`<link>` 는 `src/lib/direction.ts` 가 넣는다(이번 시안에서 추가한 파일 없음).

## 9. 대비 표와 axe·overflow

`src/design/tokens.ts` 의 `contrastPairs` 33쌍을 이 팔레트로 계산했다(`src/lib/contrast.ts` `contrastRatio`, 스크립트는 저장소 밖). **최저: 라이트 3.69:1(경계/캔버스, UI 3:1 요구), 다크 4.42:1(경계/표면, UI 3:1 요구). 미달 0쌍.**

| 조합 | 라이트 전경/배경 | 라이트 대비 | 다크 전경/배경 | 다크 대비 | 요구 |
|---|---|---:|---|---:|---|
| 본문/캔버스 | #221c15 / #f5f0e6 | 14.85:1 (AAA) | #ece4d4 / #171310 | 14.61:1 (AAA) | 4.5:1 |
| 본문/표면 | #221c15 / #faf6ee | 15.64:1 (AAA) | #ece4d4 / #1d1814 | 13.92:1 (AAA) | 4.5:1 |
| 본문/올라온 표면 | #221c15 / #fcf9f3 | 16.05:1 (AAA) | #ece4d4 / #262019 | 12.75:1 (AAA) | 4.5:1 |
| 본문/가라앉은 표면 | #221c15 / #ebe4d6 | 13.33:1 (AAA) | #ece4d4 / #100d0a | 15.32:1 (AAA) | 4.5:1 |
| 보조 텍스트/캔버스 | #5c5247 / #f5f0e6 | 6.71:1 (AA) | #b3a893 / #171310 | 7.86:1 (AAA) | 4.5:1 |
| 보조 텍스트/표면 | #5c5247 / #faf6ee | 7.07:1 (AAA) | #b3a893 / #1d1814 | 7.49:1 (AAA) | 4.5:1 |
| 보조 텍스트/가라앉은 표면 | #5c5247 / #ebe4d6 | 6.03:1 (AA) | #b3a893 / #100d0a | 8.24:1 (AAA) | 4.5:1 |
| 플레이스홀더/표면 | #675d51 / #faf6ee | 5.97:1 (AA) | #a79c86 / #1d1814 | 6.49:1 (AA) | 4.5:1 |
| 경계/표면 | #857a6c / #faf6ee | 3.89:1 (AA) | #8a7e6c / #1d1814 | **4.42:1** (AA) | 3:1 |
| 경계/캔버스 | #857a6c / #f5f0e6 | **3.69:1** (AA) | #8a7e6c / #171310 | 4.64:1 (AAA) | 3:1 |
| 강조 텍스트(링크)/캔버스 | #221c15 / #f5f0e6 | 14.85:1 (AAA) | #ece4d4 / #171310 | 14.61:1 (AAA) | 4.5:1 |
| 강조 텍스트(링크)/표면 | #221c15 / #faf6ee | 15.64:1 (AAA) | #ece4d4 / #1d1814 | 13.92:1 (AAA) | 4.5:1 |
| 강조 위 텍스트/강조 | #f5f0e6 / #221c15 | 14.85:1 (AAA) | #171310 / #ece4d4 | 14.61:1 (AAA) | 4.5:1 |
| 옅은 강조 위 텍스트/옅은 강조 | #221c15 / #e8e0d0 | 12.85:1 (AAA) | #ece4d4 / #2e2720 | 11.64:1 (AAA) | 4.5:1 |
| 긍정 텍스트/표면 | #2f6b40 / #faf6ee | 5.90:1 (AA) | #9ec99c / #1d1814 | 9.46:1 (AAA) | 4.5:1 |
| 긍정 텍스트/캔버스 | #2f6b40 / #f5f0e6 | 5.60:1 (AA) | #9ec99c / #171310 | 9.92:1 (AAA) | 4.5:1 |
| 긍정 위 텍스트/긍정 | #f5f0e6 / #2f6b40 | 5.60:1 (AA) | #171310 / #9ec99c | 9.92:1 (AAA) | 4.5:1 |
| 옅은 긍정 위 텍스트/옅은 긍정 | #245233 / #e1e8d6 | 7.17:1 (AAA) | #b9d8b5 / #24332a | 8.56:1 (AAA) | 4.5:1 |
| 주의 텍스트/표면 | #855417 / #faf6ee | 5.94:1 (AA) | #d7b26b / #1d1814 | 8.77:1 (AAA) | 4.5:1 |
| 주의 위 텍스트/주의 | #f5f0e6 / #855417 | 5.64:1 (AA) | #171310 / #d7b26b | 9.20:1 (AAA) | 4.5:1 |
| 옅은 주의 위 텍스트/옅은 주의 | #664010 / #efe2c6 | 7.09:1 (AAA) | #e5ca8f / #3a2f19 | 8.23:1 (AAA) | 4.5:1 |
| 부정 텍스트/표면 | #a83a2f / #faf6ee | 5.88:1 (AA) | #e08d7e / #1d1814 | 6.94:1 (AA) | 4.5:1 |
| 부정 텍스트/캔버스 | #a83a2f / #f5f0e6 | 5.58:1 (AA) | #e08d7e / #171310 | 7.28:1 (AAA) | 4.5:1 |
| 부정 위 텍스트/부정 | #f5f0e6 / #a83a2f | 5.58:1 (AA) | #171310 / #e08d7e | 7.28:1 (AAA) | 4.5:1 |
| 옅은 부정 위 텍스트/옅은 부정 | #7f2b22 / #f0dad3 | 6.90:1 (AA) | #f0b5a9 / #40241f | 7.97:1 (AAA) | 4.5:1 |
| 포커스 링/표면 | #221c15 / #faf6ee | 15.64:1 (AAA) | #ece4d4 / #1d1814 | 13.92:1 (AAA) | 3:1 |
| 포커스 링/캔버스 | #221c15 / #f5f0e6 | 14.85:1 (AAA) | #ece4d4 / #171310 | 14.61:1 (AAA) | 3:1 |
| 내 말풍선 텍스트/내 말풍선 | #221c15 / #f5f0e6 | 14.85:1 (AAA) | #ece4d4 / #171310 | 14.61:1 (AAA) | 4.5:1 |
| 상대 말풍선 텍스트/상대 말풍선 | #221c15 / #f5f0e6 | 14.85:1 (AAA) | #ece4d4 / #171310 | 14.61:1 (AAA) | 4.5:1 |
| 강조(UI: 점수 바·아이콘)/표면 | #221c15 / #faf6ee | 15.64:1 (AAA) | #ece4d4 / #1d1814 | 13.92:1 (AAA) | 3:1 |
| 긍정(UI)/표면 | #2f6b40 / #faf6ee | 5.90:1 (AAA) | #9ec99c / #1d1814 | 9.46:1 (AAA) | 3:1 |
| 주의(UI)/표면 | #855417 / #faf6ee | 5.94:1 (AAA) | #d7b26b / #1d1814 | 8.77:1 (AAA) | 3:1 |
| 부정(UI)/표면 | #a83a2f / #faf6ee | 5.88:1 (AAA) | #e08d7e / #1d1814 | 6.94:1 (AAA) | 3:1 |

표 밖 조합: 힌트 초록 글자(#2f6b40)/캔버스는 "긍정 텍스트/캔버스" 와 같다(5.60:1). 포커스 링이 잉크라 잉크 면 1차 버튼 위에서는 오프셋 3px 의 종이색 틈으로 구분된다.

axe·overflow(`shots/axe.md`, `shots/overflow.md`, 마지막 실행): **axe 위반 0건(48장, wcag2a/2aa/21a/21aa/22aa/best-practice), 가로 스크롤 0장(48장)**. 촬영은 두 번 이상 돌리며 고쳤다 — 1차에서 `main` 의 프로그램 포커스 테두리가 본문 양옆에 세로선으로 찍혀(`[data-direction] :focus-visible` 이 `main:focus { outline: none }` 보다 특이도가 높았음) `main:focus` 예외를 더했고, 홈 머리말 아래 여백(72px)을 줄였다.

촬영 비고: `scripts/screenshots.ts` 의 `call-live` 상태가 `route.continue()` 에서 "Route is already handled" 로 매번 죽었다(498행: 4초 지연 핸들러와 `page.unroute` 의 경합. 촬영+axe 가 4초보다 빨리 끝나면 핸들러가 이미 풀린 라우트를 이어 가려 한다). 스크립트는 고칠 수 없는 파일이라 저장소 밖에 복사본을 두고 `route.continue()` 세 곳에 `.catch(() => undefined)` 만 붙여(렌더링과 무관) 48장을 찍었다. 원본 스크립트 수정은 메인 세션 몫이다.

## 10. CSS 만으로 못 한 것 (2차 세션 과제)

1. **화자 라벨의 콜론.** `Bubble` 의 sr-only 텍스트가 `"나: "`·`"상대: "` 라 보이게 되돌리면 콜론이 따라온다. 대본 느낌엔 맞지만 라벨만 쓰려면 마크업에서 라벨과 구분자를 나눠야 한다.
2. **점수 "6/10" 의 띄어쓰기.** `report.scoreOf` 가 `6/10` 한 문자열이라 "6 / 10" 처럼 벌릴 수 없다(자간 0.04em 만 줌). 분자·분모를 요소로 나누면 분모를 작게 할 수 있다.
3. **통화 상태의 아이콘.** 작은 점으로 바꾸기 위해 `svg` 를 `display:none` 했다. 보조 기술엔 글자가 있어 문제없지만, 마크업에서 아이콘을 선택적으로 빼는 편이 깨끗하다. `thinking`·`ending` 의 회전 아이콘도 함께 사라져 그 두 상태는 점 색(보조색)과 글자만으로 구분된다.
4. **리포트 머리말 폭.** `main.container:has(> .report) .page-head` 로 46rem 에 맞췄다. `:has` 없는 브라우저에선 머리말만 64rem 이다. 리포트 페이지에 래퍼 클래스를 주면 선택자가 단순해진다.
5. **영어 입력창.** 채팅·통화 textarea 를 Newsreader 로 바꿨으나 플레이스홀더는 한국어라 `::placeholder` 를 Pretendard 로 되돌렸다. 입력 중 한글(IME) 이 섞이면 Newsreader 폴백이 Noto Serif KR 로 가므로 어색하진 않지만, 입력 언어별 서체는 마크업의 `lang` 이 맡는 게 맞다.
6. **홈의 두 시작 카드.** 위 괘선 섹션 둘이 나란히 놓이는데, 이 방향이라면 "통화 시작하기"를 한 단 전체의 큰 세리프 문장으로 두는 편이 낫다. 격자 구조는 그대로라 CSS 로는 비율만 바꿀 수 있었다(바꾸지 않음).
7. **다크 모드 `theme-color`.** 주소창 색은 `layout.tsx` 가 현행 캔버스값(#f4f4f1/#131315)으로 고정해 넣는다. 시안이 채택되면 #f5f0e6/#171310 으로 바꿔야 한다.
