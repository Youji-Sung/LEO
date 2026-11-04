# UI/UX 개선 브리프

## 목표

기능은 완성된 LEO의 **시각 디자인, 인터랙션, UX 라이팅을 서비스 성격에 맞게 전면 개선**한다. "예쁘게"가 아니라 "왜 이렇게 했는지 전부 설명할 수 있게" 만드는 것이 목표다. 모든 결정은 근거(사용자·상황 분석, 외부 가이드라인, 레퍼런스, 측정값)와 함께 `docs/design/` 아래에 남긴다.

## 사용자와 상황 (출발점, 세션이 조사로 보강)

- 사용자: 해외 취업을 준비하는 한국인 개발자. 영어 회화에 자신이 없고, 면접이라는 구체적인 시험을 앞두고 있다. 사용자는 현재 2명(운영자 포함).
- 핵심 순간: ① 10분 통화 중(긴장, 손은 자유롭지 않을 수 있음, 화면을 자주 보지 못함) ② 통화 직후 리포트를 읽을 때(피드백을 받는 취약한 순간) ③ 틈틈이 채팅(가벼움).
- 기기: 데스크톱 Chrome 위주, 모바일 Chrome 병행. 통화는 모바일에서 할 가능성이 높다.
- 언어: UI 한국어, 대화 영어. 리포트는 한국어 설명 + 영어 예문.

## 확정 사항 (운영자, 2026-11-04)

| 항목 | 결정 |
|---|---|
| 서비스 톤 | **세션이 조사와 근거로 정한다.** 후보: 차분한 코치 / 친근한 대화 상대 / 개발자 도구 감성 / 그 혼합. 선택과 기각 이유를 `PRINCIPLES.md`에 적는다 |
| 외부 의존성 | **필요하면 추가 가능, 근거 기록.** 웹 폰트, 아이콘 세트, 접근성 프리미티브, 빌드 체계 변경 모두 허용. 단, 각 추가는 "없으면 무엇이 안 되는가"로 정당화한다 |
| 다크 모드 | **포함.** 라이트·다크 두 팔레트를 토큰으로 설계하고 `prefers-color-scheme`을 따른다. 설정 페이지에 시스템/라이트/다크 수동 전환 추가 |
| 기능 범위 | **기능 추가·제거 없음.** 기존 기능의 흐름·화면·문구·외형만 바꾼다. 흐름을 바꾸는 것(단계 합치기, 순서 변경)은 근거가 있으면 허용 |
| 테스트 | 기존 단위·통합·E2E 테스트는 계속 통과해야 한다. 화면이 바뀌면 E2E 셀렉터를 함께 고친다. 삭제는 금지 |
| Claude API | **이번 작업은 실제 API 호출 0회.** 전부 `CLAUDE_MOCK=1` |

## 품질 기준

- 접근성: WCAG 2.2 AA. 텍스트 대비 4.5:1(큰 글자 3:1), 포커스 가시성, 터치 타깃 24×24 이상(모바일 주요 버튼 44×44), `prefers-reduced-motion` 존중, 키보드만으로 전체 흐름 완료.
- 반응형: 360px, 390px, 768px, 1280px에서 모든 화면이 가로 스크롤 없이 쓸 만해야 한다.
- 성능: 폰트 추가 시 서브셋·`font-display: swap`·프리로드. 첫 화면 CLS가 눈에 띄지 않아야 한다.
- 일관성: 같은 뜻은 같은 단어로(용어집), 같은 역할은 같은 컴포넌트로.
- 검증 가능성: 모든 화면의 before/after 스크린샷(라이트·다크·모바일)이 `docs/design/screenshots/`에 있어야 한다.

## 따를 외부 기준 (세션이 실제로 읽고 인용한다)

디자인·접근성
- WCAG 2.2 (W3C) — 접근성 기준의 원본
- Apple Human Interface Guidelines — 특히 Typography, Color, Dark Mode, Accessibility, Motion
- Material Design 3 — 특히 Color system(톤 기반 팔레트), Typography scale, Motion, Accessibility
- Nielsen Norman Group — 10 Usability Heuristics, Error message guidelines, Empty states, Progress indicators

UX 라이팅
- Google Material "Writing" 가이드
- Microsoft Writing Style Guide (간결성, 능동태, 오류 메시지 구조)
- Shopify Polaris Content guidelines (버튼·오류·빈 상태·확인 대화 문구)
- Atlassian Design System "Content" (voice & tone 차트)
- 한국어: 국립국어원 공공언어 지침(쉬운 말, 외래어 표기), 토스 UX 라이팅 원칙(공개 자료가 있는 범위에서)

레퍼런스 제품 (세션이 검색해 실제 화면을 확인하고 배울 점·배우지 않을 점을 적는다)
- 언어 학습: Speak, ELSA Speak, Cambly, Duolingo(특히 피드백·칭찬 패턴)
- 면접 연습: Pramp, Interviewing.io, Final Round AI
- 음성 통화 UI: 전화 앱 기본 UI(iOS/Android), Zoom/Meet의 통화 중 상태 표시, ChatGPT 음성 모드
- 리포트·피드백: Grammarly 교정 표시, Linear·Vercel의 정보 밀도와 타이포그래피

위 목록에 없어도 세션이 더 나은 출처를 찾으면 추가한다. 반대로 접근할 수 없는 출처는 "확인 못 함"으로 적고 추측으로 인용하지 않는다.
