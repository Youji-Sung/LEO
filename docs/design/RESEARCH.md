# 외부 조사 (1단계)

읽은 날짜: 2026-11-04. 세 부분으로 나뉜다: A 디자인·접근성 가이드라인, B UX 라이팅·휴리스틱, C 레퍼런스 제품. 따옴표 안은 원문, "읽음: 예" 는 WebFetch 로 본문을 실제 확인했다는 뜻이며, 읽지 못한 것은 각 부의 "접근 실패 목록" 에 있다. 각 발췌 뒤의 "LEO 적용" 은 조사자의 1차 해석이고, 확정된 결정은 PRINCIPLES.md·SYSTEM.md·WRITING.md 와 DECISIONS.md 에 있다.

# 제1부. 디자인·접근성 가이드라인


범례
- 따옴표(" ") 안은 원문 그대로. 따옴표 없는 항목은 읽은 내용의 요약(원문 길이 제한으로 발췌 도구가 요약한 부분 포함).
- "읽음: 예"는 2026-11-04에 실제로 fetch해 내용을 확인했다는 뜻. 일부 페이지는 JS 렌더링 때문에 대체 URL(JSON 데이터 엔드포인트, r.jina.ai 리더, GitHub 원본)로 읽었고, 그 경우 대체 URL을 함께 적었다.

---

## A. WCAG 2.2

### WCAG 2.2 — 1.3.1 Info and Relationships (Level A)
- URL: https://www.w3.org/TR/WCAG22/#info-and-relationships
- 읽음: 예 (2026-11-04)
- 발췌:
  - "Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text."
- LEO 적용:
  - 리포트 화면의 점수/교정 항목은 시각적 카드가 아니라 `h2/h3`, `dl`, `table`, `ul` 등 의미 있는 구조로 마크업한다.
  - 채팅 로그는 `role="log"` 또는 리스트로, 화자(사용자/AI)는 색이 아니라 텍스트/aria로 구분한다.
  - 통화 화면의 타이머·상태(연결 중/통화 중/종료)는 텍스트로 노출한다.

### WCAG 2.2 — 1.4.3 Contrast (Minimum) (Level AA)
- URL: https://www.w3.org/TR/WCAG22/#contrast-minimum
- 읽음: 예 (2026-11-04)
- 발췌:
  - "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1, except for the following:"
  - Large Text: 큰 글자(large scale)는 3:1 이상이면 됨.
  - Incidental: 비활성 UI 컴포넌트, 순수 장식, 보이지 않는 텍스트, 다른 시각 요소가 많은 사진 속 텍스트는 요구 없음.
  - Logotypes: 로고/브랜드명 텍스트는 요구 없음.
  - (large scale의 정의 — 18pt 또는 14pt bold — 는 이 fetch 범위에 포함되지 않아 미확인. Material M2 페이지의 "14 pt bold / 18 pt regular" 인용으로 교차 확인.)
- LEO 적용:
  - 라이트/다크 양쪽에서 본문 텍스트 4.5:1, 큰 제목(≥24px 또는 ≥18.66px bold) 3:1을 토큰 단계에서 보장한다.
  - 리포트의 점수 색(초록/주황/빨강)으로 쓴 텍스트도 배경 대비 4.5:1을 맞춘다.
  - 비활성 버튼(통화 전 "종료" 등)은 예외지만, 비활성임을 텍스트/aria-disabled로도 알린다.

### WCAG 2.2 — 1.4.4 Resize Text (Level AA)
- URL: https://www.w3.org/TR/WCAG22/#resize-text
- 읽음: 예 (2026-11-04)
- 발췌:
  - "Except for captions and images of text, text can be resized without assistive technology up to 200 percent without loss of content or functionality."
- LEO 적용:
  - 폰트 크기를 `rem`으로 정의하고 고정 높이 컨테이너(통화 화면 하단 컨트롤, 채팅 입력창)가 200% 확대에서 잘리지 않게 한다.
  - 타이머 숫자와 점수 숫자는 확대 시 줄바꿈/축약이 아닌 그대로 표시되도록 여유 폭을 둔다.

### WCAG 2.2 — 1.4.10 Reflow (Level AA)
- URL: https://www.w3.org/TR/WCAG22/#reflow
- 읽음: 예 (2026-11-04)
- 발췌:
  - "Content can be presented without loss of information or functionality, and without requiring scrolling in two dimensions for:"
  - 세로 스크롤 콘텐츠는 320 CSS px 폭, 가로 스크롤 콘텐츠는 256 CSS px 높이에서. 2차원 레이아웃이 필수인 콘텐츠(지도, 영상, 데이터 테이블 등)는 예외.
- LEO 적용:
  - 320px 폭(iPhone SE 급, 또는 데스크톱 400% 확대)에서 통화/채팅/리포트 모두 가로 스크롤 없이 동작해야 한다.
  - 리포트의 점수 표는 데이터 테이블 예외에 해당할 수 있으나, 가능하면 모바일에서 카드형으로 reflow한다.

### WCAG 2.2 — 1.4.11 Non-text Contrast (Level AA)
- URL: https://www.w3.org/TR/WCAG22/#non-text-contrast
- 읽음: 예 (2026-11-04)
- 발췌:
  - "The visual presentation of the following have a contrast ratio of at least 3:1 against adjacent color(s):"
  - UI 컴포넌트를 식별하는 데 필요한 시각 정보와 상태(User Interface Components), 콘텐츠 이해에 필요한 그래픽 부분(Graphical Objects). 비활성 컴포넌트와 UA가 외형을 결정하는 경우는 예외.
- LEO 적용:
  - 입력창 테두리, 버튼 외곽, 포커스 링, 토글 상태, 마이크 on/off 아이콘은 배경 대비 3:1 이상.
  - 다크 모드에서 outline-variant 급 연한 선은 "장식"으로만 쓰고, 타깃 경계에는 쓰지 않는다(M3 color roles의 동일 지침과 일치).
  - 리포트 점수 바/게이지 색상도 3:1을 맞춘다.

### WCAG 2.2 — 1.4.12 Text Spacing (Level AA)
- URL: https://www.w3.org/TR/WCAG22/#text-spacing
- 읽음: 예 (2026-11-04)
- 발췌:
  - "...no loss of content or functionality occurs by setting all of the following and by changing no other style property:"
  - 줄 높이 ≥ 1.5 × 글자 크기, 문단 간격 ≥ 2 × 글자 크기, 자간 ≥ 0.12 × 글자 크기, 어간 ≥ 0.16 × 글자 크기.
  - 이 속성 일부를 쓰지 않는 언어/문자는 쓰는 속성만으로 적합.
- LEO 적용:
  - 본문 line-height 기본값을 1.5 이상으로 잡으면 사용자 재정의 시 변화가 작다(한국어 본문은 1.6 권장, D 참조).
  - 채팅 말풍선과 리포트 카드는 고정 높이를 두지 않고 콘텐츠 높이에 따르게 한다.

### WCAG 2.2 — 2.1.1 Keyboard (Level A)
- URL: https://www.w3.org/TR/WCAG22/#keyboard
- 읽음: 예 (2026-11-04)
- 발췌:
  - "All functionality of the content is operable through a keyboard interface without requiring specific timings for individual keystrokes, except where the underlying function requires input that depends on the path of the user's movement and not just the endpoints."
- LEO 적용:
  - 통화 시작/종료, 마이크 음소거, 채팅 전송, 리포트 섹션 펼치기 모두 Tab/Enter/Space로 가능해야 한다.
  - "길게 눌러 말하기(push-to-talk)" 같은 타이밍 의존 조작은 쓰지 않거나 토글 대안을 둔다.

### WCAG 2.2 — 2.2.1 Timing Adjustable (Level A)
- URL: https://www.w3.org/TR/WCAG22/#timing-adjustable
- 읽음: 예 (2026-11-04)
- 발췌:
  - "For each time limit that is set by the content, at least one of the following is true:"
  - Turn off: "The user is allowed to turn off the time limit before encountering it; or"
  - Adjust: "The user is allowed to adjust the time limit before encountering it over a wide range that is at least ten times the length of the default setting; or"
  - Extend: "The user is warned before time expires and given at least 20 seconds to extend the time limit with a simple action (for example, "press the space bar"), and the user is allowed to extend the time limit at least ten times; or"
  - Real-time Exception: "The time limit is a required part of a real-time event (for example, an auction), and no alternative to the time limit is possible; or"
  - Essential Exception: "The time limit is essential and extending it would invalidate the activity; or"
  - 20 Hour Exception: "The time limit is longer than 20 hours."
- LEO 적용: (Understanding 문서 항목에서 함께 정리)

### WCAG 2.2 Understanding — 2.2.1 Timing Adjustable
- URL: https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html
- 읽음: 예 (2026-11-04)
- 발췌:
  - Intent: "ensure that users with disabilities are given adequate time to interact with web content whenever possible"
  - "Disabling time limits is better than customizing the length of time limits"
  - Key Terms의 essential 정의: "if removed, would fundamentally change the information or functionality of the content"
  - 예시(요약): 온라인 티켓 구매 사이트가 좌석 확정에 2분을 주는 경우 — 연장하면 활동이 무효화되므로 essential. 단, 시간 제한 단계 밖으로 가능한 한 많은 단계를 옮겨야 함.
  - 실시간 이벤트 정의: "occurs at the same time as the viewing" / "is not completely generated by the content". 경매 예: "it would be unfair to extend the time limit for any one particular user"
  - 시험 관련: 타이밍이 활동에 본질적이지 않지만 사용자 제어가 결과를 무효화할 때 제3자가 제어할 수 있음("granting double time on a test").
  - Sufficient Techniques: G133, G198(시간 제한 끄기), G180(기본값의 10배로 설정), SCR16+SCR1(경고 스크립트+연장), G4, SCR33, SCR36.
- LEO 적용:
  - 10분 통화는 "전화 면접 시뮬레이션"이라는 제품 자체의 조건이므로 Essential Exception 주장이 가능하다. 단 그 근거를 DECISIONS에 기록하고, 통화 시작 전에 "10분 제한"을 텍스트로 명시한다(제한을 만나기 전에 알림).
  - essential 예시의 교훈대로 시간 제한 밖으로 옮길 수 있는 것(마이크 테스트, 주제 선택, 설정)은 모두 통화 전 단계로 뺀다.
  - 종료 직전 경고(예: 1분 전/30초 전)는 2.2.1이 요구하지는 않지만 4.1.3 status message로 알리는 편이 낫다. 연장 기능은 "기능 추가 금지" 규칙상 넣지 않는다.
  - 텍스트 채팅에는 시간 제한을 두지 않는다(제한이 없으면 2.2.1 대상이 아님).

### WCAG 2.2 — 2.2.2 Pause, Stop, Hide (Level A)
- URL: https://www.w3.org/TR/WCAG22/#pause-stop-hide
- 읽음: 예 (2026-11-04)
- 발췌:
  - "For moving, blinking, scrolling, or auto-updating information, all of the following are true:"
  - Moving, blinking, scrolling: "(1) starts automatically, (2) lasts more than five seconds, and (3) is presented in parallel with other content, there is a mechanism for the user to pause, stop, or hide it unless the movement, blinking, or scrolling is part of an activity where it is essential; and"
  - Auto-updating: "(1) starts automatically and (2) is presented in parallel with other content, there is a mechanism for the user to pause, stop, or hide it or to control the frequency of the update unless the auto-updating is part of an activity where it is essential."
- LEO 적용:
  - 통화 중 음성 파형/펄스 애니메이션은 5초 넘게 자동으로 움직이므로 essential이 아니면 끌 수 있어야 한다. `prefers-reduced-motion`에서 정지 상태로 바꾸고, 가능하면 설정 없이도 정적인 상태 표시(텍스트 "듣는 중")를 병행한다.
  - 초 단위로 갱신되는 타이머는 "auto-updating"이다. 통화 시간 표시는 활동에 essential이라고 볼 수 있으나, 매초 깜빡이는 효과는 피하고 숫자만 바꾼다.

### WCAG 2.2 — 2.3.3 Animation from Interactions (Level AAA)
- URL: https://www.w3.org/TR/WCAG22/#animation-from-interactions
- 읽음: 예 (2026-11-04)
- 발췌:
  - "Motion animation triggered by interaction can be disabled, unless the animation is essential to the functionality or the information being conveyed."
- LEO 적용:
  - AAA라 필수는 아니지만 비용이 낮다. 모든 전환/확대 애니메이션을 `@media (prefers-reduced-motion: reduce)`에서 페이드 또는 즉시 전환으로 바꾼다.

### WCAG 2.2 — 2.4.3 Focus Order (Level A)
- URL: https://www.w3.org/TR/WCAG22/#focus-order
- 읽음: 예 (2026-11-04)
- 발췌:
  - "If a web page can be navigated sequentially and the navigation sequences affect meaning or operation, focusable components receive focus in an order that preserves meaning and operability."
- LEO 적용:
  - 통화 화면: 상태/타이머 → 주 동작(종료) → 보조(음소거) 순서가 DOM 순서와 일치해야 한다. CSS `order`/절대 배치로 시각 순서만 바꾸지 않는다.
  - 리포트 화면: 총점 → 항목별 점수 → 교정 목록 순. 모달(통화 종료 확인)은 포커스를 가두고 닫히면 원래 버튼으로 돌려보낸다.

### WCAG 2.2 — 2.4.7 Focus Visible (Level AA)
- URL: https://www.w3.org/TR/WCAG22/#focus-visible
- 읽음: 예 (2026-11-04)
- 발췌:
  - "Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible."
- LEO 적용:
  - `outline: none` 금지. `:focus-visible`에 라이트/다크 각각 3:1 이상 대비의 링을 토큰으로 정의한다.

### WCAG 2.2 — 2.4.11 Focus Not Obscured (Minimum) (Level AA)
- URL: https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum
- 읽음: 예 (2026-11-04)
- 발췌:
  - "When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content."
- LEO 적용:
  - 채팅의 고정 입력창(sticky bottom)과 통화 화면의 고정 컨트롤 바가 포커스된 메시지/링크를 완전히 가리지 않도록 `scroll-padding-bottom`을 바 높이만큼 준다.
  - 토스트/상태 메시지는 포커스 가능한 요소 위에 겹치지 않게 배치한다.

### WCAG 2.2 — 2.4.13 Focus Appearance (Level AAA)
- URL: https://www.w3.org/TR/WCAG22/#focus-appearance
- 읽음: 예 (2026-11-04)
- 발췌:
  - "When the keyboard focus indicator is visible, an area of the focus indicator meets all the following:"
  - "is at least as large as the area of a 2 CSS pixel thick perimeter of the unfocused component or sub-component, and"
  - "has a contrast ratio of at least 3:1 between the same pixels in the focused and unfocused states."
- LEO 적용:
  - AAA이지만 구현이 쉬우므로 기본값으로 채택: 포커스 링 두께 2px 이상(`outline: 2px solid` + `outline-offset: 2px`), 포커스 전후 3:1.

### WCAG 2.2 — 2.5.8 Target Size (Minimum) (Level AA)
- URL: https://www.w3.org/TR/WCAG22/#target-size-minimum , https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- 읽음: 예 (2026-11-04, 두 페이지 모두)
- 발췌:
  - "The size of the target for pointer inputs is at least 24 by 24 CSS pixels, except when:"
  - Spacing: 24×24 미만의 타깃은 각 타깃의 바운딩 박스 중심에 지름 24 CSS px 원을 그렸을 때 "the circles do not intersect another target or the circle for another undersized target"
  - Equivalent: "The function can be achieved through a different control on the same page that meets this criterion"
  - Inline: "The target is in a sentence or its size is otherwise constrained by the line-height of non-target text"
  - User Agent Control: "The size of the target is determined by the user agent and is not modified by the author"
  - Essential: "A particular presentation of the target is essential or is legally required for the information being conveyed"
  - Understanding: "Providing sufficient size, or sufficient spacing between targets, will reduce the likelihood" (잘못 누름 감소). "For important links/controls, consider aiming for the stricter 2.5.5 Target Size (Enhanced)."
  - Understanding 예시(요약): 문단 속 링크는 24px 규칙 대상 아님. 툴바의 20×20px 버튼은 간격이 있으면 통과, 붙어 있으면 실패.
- LEO 적용:
  - 모든 아이콘 버튼(음소거, 전송, 닫기)은 최소 24×24 CSS px, 실제로는 Apple 44pt / Material 48dp를 따라 44×44px 이상으로 잡는다. 통화 종료 버튼은 가장 크게(≥56px).
  - 리포트의 교정 항목 펼치기/접기 버튼이 줄 단위로 붙어 있으면 24px 원이 겹치지 않도록 간격(≥8px)을 둔다.
  - 채팅 본문 속 인라인 링크는 Inline 예외.

### WCAG 2.2 — 3.2.6 Consistent Help (Level A)
- URL: https://www.w3.org/TR/WCAG22/#consistent-help , https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html
- 읽음: 예 (2026-11-04, 두 페이지 모두)
- 발췌:
  - "If a web page contains any of the following help mechanisms, and those mechanisms are repeated on multiple web pages within a set of web pages, they occur in the same order relative to other page content, unless a change is initiated by the user:"
  - "Human contact details;" / "Human contact mechanism;" / "Self-help option;" / "A fully automated contact mechanism."
  - Note 2: "the same order relative to other page content" = "how the content is ordered when the page is serialized."
  - Intent: "The intent of this success criterion is to ensure users can find help for completing tasks on a website when it is available."
- LEO 적용:
  - 도움말/FAQ/문의 링크를 두는 경우 모든 페이지(홈, 통화, 채팅, 리포트)에서 같은 위치(예: 푸터 또는 헤더 끝)에 둔다. 없는 경우에는 이 조항이 적용되지 않는다.

### WCAG 2.2 — 3.3.1 Error Identification (Level A)
- URL: https://www.w3.org/TR/WCAG22/#error-identification , https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
- 읽음: 예 (2026-11-04, 두 페이지 모두)
- 발췌:
  - "If an input error is automatically detected, the item that is in error is identified and the error is described to the user in text."
  - Understanding: "The error must be indicated in text." / "This success criterion does not mean that color or text styles cannot be used to indicate errors. It simply requires that errors also be identified using text."
- LEO 적용:
  - 마이크 권한 거부, 네트워크 끊김, 빈 메시지 전송 등 오류는 빨간 테두리만이 아니라 한국어 텍스트로 어떤 항목이 왜 실패했는지 쓴다. 문구는 한 곳(문구 모듈)에 모은다.

### WCAG 2.2 — 3.3.3 Error Suggestion (Level AA)
- URL: https://www.w3.org/TR/WCAG22/#error-suggestion , https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html
- 읽음: 예 (2026-11-04, 두 페이지 모두)
- 발췌:
  - "If an input error is automatically detected and suggestions for correction are known, then the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content."
  - Understanding Intent: "The intent of this success criterion is to ensure that users receive appropriate suggestions for correction"
- LEO 적용:
  - 오류 문구에 다음 행동을 붙인다: "마이크 권한이 거부되었습니다. 브라우저 주소창의 자물쇠 아이콘에서 마이크를 허용한 뒤 다시 시도하세요." 식.
  - 통화 중 연결 끊김 시 "다시 연결" 버튼을 오류 텍스트 바로 옆에 둔다.

### WCAG 2.2 — 4.1.3 Status Messages (Level AA)
- URL: https://www.w3.org/TR/WCAG22/#status-messages , https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- 읽음: 예 (2026-11-04, 두 페이지 모두)
- 발췌:
  - "In content implemented using markup languages, status messages can be programmatically determined through role or properties such that they can be presented to the user by assistive technologies without receiving focus."
  - status message 정의: "change in content that is not a change of context" / "provides information to the user on the success or results of an action, on the waiting state of an application" (진행 상황·오류 존재 포함).
  - Intent: "to make users aware of important changes in content that are not given focus"
  - 예시(요약): "5 results returned", 장바구니 "5 items", "Your form was successfully submitted.", busy 표시 → "application busy", 진행 바 → 간헐적 진행 안내.
  - Sufficient Techniques: Situation A(성공/결과/상태) ARIA22(`role=status`)+G199; Situation B(경고/오류) ARIA19(`role=alert`/live region); Situation C(진행) ARIA23, ARIA25, ARIA27, 또는 ARIA22+G193.
- LEO 적용:
  - 통화 상태 변화("연결 중" → "통화 중" → "통화 종료", "AI가 말하는 중") 는 `role="status"`(polite) 영역에 쓴다.
  - 남은 시간 경고(1분 전 등)는 `role="status"`, 연결 오류는 `role="alert"`.
  - 리포트 생성 중 로딩은 `aria-busy` 또는 `role="status"`로 "리포트 작성 중"을 알리고, 완료 시 "리포트가 준비되었습니다"를 status로 알린다.
  - 매초 바뀌는 타이머는 live region에 넣지 않는다(과도한 알림). 타이머 자체는 `aria-live="off"`.

---

## B. Apple Human Interface Guidelines

주: HIG 페이지는 JS 렌더링이라 HTML fetch로는 제목만 반환됐다. 동일 콘텐츠를 담은 Apple의 JSON 데이터 엔드포인트(`developer.apple.com/tutorials/data/design/human-interface-guidelines/*.json`)를 대체 URL로 읽었다.

### Apple HIG — Typography
- URL: https://developer.apple.com/design/human-interface-guidelines/typography (대체: https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json)
- 읽음: 예 (2026-11-04, JSON의 앞 200,000자. 뒤 81,026자 미확인 — "SF Pro Text/Display 20pt 전환" 문구와 AX4·AX5 값은 그 범위에 있을 것으로 보이나 확인 못 함)
- 발췌:
  - Ensuring legibility: "Use font sizes that most people can read easily."
  - "Keep in mind that font weight can also impact how easy text is to read. If you use a custom font with a thin weight, aim for larger than the recommended sizes to increase legibility."
  - "In general, avoid light font weights." — Regular/Medium/Semibold/Bold 선호, Ultralight/Thin/Light 회피("which can be difficult to see, especially when text is small").
  - Specifications 표: iOS/iPadOS 기본 17 pt, 최소 11 pt. macOS 기본 13 pt, 최소 10 pt. visionOS 기본 17 pt, 최소 12 pt. watchOS 기본 16 pt, 최소 12 pt.
  - Conveying hierarchy: "Minimize the number of typefaces you use, even in a highly customized interface." / "If you need to display three or more lines of text, avoid tight leading even in areas where height is limited."
  - Supporting Dynamic Type: "Dynamic Type is a system-level feature in iOS, iPadOS, tvOS, visionOS, and watchOS that lets people adjust the size of visible text on their device to ensure readability and comfort." / "Verify that your design scales, and that text and glyphs are legible at all font sizes." / "In general, aim to display as much useful text at the largest accessibility font size as you do at the largest standard font size."
  - iOS Dynamic Type "Large (default)" 표 (size/leading pt): Large Title 34/41, Title 1 28/34, Title 2 22/28, Title 3 20/25, Headline 17/22 Semibold, Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 1 12/16, Caption 2 11/13.
  - 접근성 크기 Body: AX1 21/23.5, AX2 22/24.5, AX3 23/25.5 (AX4·AX5 미확인).
  - 표 주석: "Not all apps express tracking values as 1/1000 em. Point size based on image resolution of 144 ppi for @2x and 216 ppi for @3x designs."
- LEO 적용:
  - 모바일 본문 기준 17px(≈1.0625rem) 또는 16px, 캡션 최소 12px 이상(Apple 최소 11pt, 단 한국어 글리프는 더 빽빽하므로 12px 하한). 라벨/메타 13px.
  - 서체 굵기: 본문 Regular(400), 강조 Medium/Semibold. Light(300) 이하는 쓰지 않는다 — 다크 모드에서 특히 가늘어 보임.
  - 리포트의 교정 문장(3줄 이상)은 leading을 타이트하게 잡지 않는다(Body 17/22 ≈ 1.29는 라틴 기준; 한국어는 더 넓게).
  - 통화 화면의 타이머 큰 숫자는 Large Title 급(34px+)으로, 200% 확대에서도 잘리지 않게.

### Apple HIG — Color
- URL: https://developer.apple.com/design/human-interface-guidelines/color (대체: https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json)
- 읽음: 예 (2026-11-04, JSON 앞 100,000자; 뒤 81,946자는 플랫폼별 시스템 색 표로 보이며 미확인)
- 발췌:
  - "Judicious use of color can enhance communication, evoke your brand, provide visual continuity, communicate status and feedback, and help people understand information."
  - Best practices: "Avoid using the same color to mean different things." / "Use color consistently throughout your interface, especially when you use it to help communicate information like status or interactivity."
  - "Make sure all your app's colors work well in light, dark, and increased contrast contexts." / "If you define a custom color, make sure to supply light and dark variants, and an increased contrast option for each variant that provides a significantly higher amount of visual differentiation."
  - "Test your app's color scheme under a variety of lighting conditions." / "In bright surroundings, colors look darker and more muted. In dark environments, colors appear bright and saturated."
  - Inclusive color: "Avoid relying solely on color to differentiate between objects, indicate interactivity, or communicate essential information." / "you can use text labels or glyph shapes to identify objects or states."
  - "Avoid using colors that make it hard to perceive content in your app." (불충분한 대비, 색각 이상 언급)
  - "Consider how the colors you use might be perceived in other countries and cultures."
  - System colors: "Each dynamic color is semantically defined by its purpose, rather than its appearance or color values." / "Avoid redefining the semantic meanings of dynamic system colors." (예: separator를 텍스트 색으로, secondaryLabel을 배경으로 쓰지 말 것)
  - 이 페이지에 숫자 대비 비율은 없음(Accessibility 페이지에 있음).
- LEO 적용:
  - 색 토큰을 의미(semantic) 단위로 정의: `text-primary/secondary`, `surface`, `border`, `accent`, `success/warning/danger`. 같은 색을 다른 뜻에 재사용하지 않는다(예: 브랜드 색 = 인터랙티브 전용).
  - 리포트 점수 등급은 색 + 텍스트 라벨("우수/보통/보완 필요") + 아이콘을 함께 쓴다.
  - 라이트/다크 각각 별도 값을 토큰에 두고, `prefers-contrast: more`에서 대비를 더 높인 변형을 제공한다.

### Apple HIG — Dark Mode
- URL: https://developer.apple.com/design/human-interface-guidelines/dark-mode (대체: https://developer.apple.com/tutorials/data/design/human-interface-guidelines/dark-mode.json)
- 읽음: 예 (2026-11-04)
- 발췌:
  - Overview: "Dark Mode is a systemwide appearance setting that uses a dark color palette to provide a comfortable viewing experience tailored for low-light environments." / "...and may also use greater perceptual contrast to make foreground content stand out against the darker backgrounds."
  - Best practices: "Avoid offering an app-specific appearance setting." (시스템 설정과 중복되어 혼란) / "Ensure that your app looks good in both appearance modes." (Auto 설정은 앱 실행 중에도 전환될 수 있음) / "Test your content to make sure that it remains comfortably legible in both appearance modes." (Increase Contrast + Reduce Transparency 조합에서 어두운 텍스트가 어두운 배경 위에 놓이는 경우를 찾을 것)
  - Dark Mode colors: "The color palette in Dark Mode includes dimmer background colors and brighter foreground colors. It's important to realize that these colors aren't necessarily inversions of their light counterparts: while many colors are inverted, some are not."
  - "Embrace colors that adapt to the current appearance." / "Avoid using hard-coded color values or colors that don't adapt."
  - "Aim for sufficient color contrast in all appearances." / "At a minimum, make sure the contrast ratio between colors is no lower than 4.5:1. For custom foreground and background colors, strive for a contrast ratio of 7:1, especially in small text."
  - "Soften the color of white backgrounds." (흰 배경 이미지는 다크 모드에서 빛나 보이므로 약간 어둡게)
  - Text: "Use the system-provided label colors for labels." (primary/secondary/tertiary/quaternary label이 자동 적응)
  - iOS 플랫폼: "In Dark Mode, the system uses two sets of background colors (base and elevated) to enhance the perception of depth when one dark interface is layered above another. The base colors are dimmer, making background interfaces appear to recede, and the elevated colors are brighter, making foreground interfaces appear to advance."
  - "Prefer the system background colors." (팝오버/모달 시트는 base → elevated로 자동 전환)
  - 순수 검정/흰색(#000/#fff) 금지 문구는 이 페이지에 없음 — "확인 못 함"으로 기록.
- LEO 적용:
  - 다크 모드는 라이트 색상의 반전이 아니라 별도 팔레트: 배경은 어둡게(base), 모달·카드·채팅 입력창 등 위에 놓이는 레이어는 더 밝게(elevated). 그림자 대신 밝기 차이로 깊이를 표현한다.
  - 텍스트 대비 하한 4.5:1, 커스텀 색은 7:1 목표(특히 리포트의 작은 교정 텍스트).
  - 앱 내 테마 토글은 Apple은 비권장. LEO가 이미 토글을 갖고 있다면 유지하되(기능 제거 금지) 기본값은 시스템 따르기로 한다. 신규 추가는 하지 않는다.
  - 리포트의 밝은 배경 이미지/일러스트가 있으면 다크 모드에서 약간 어둡게(opacity/filter).
  - 라이트·다크·고대비 세 조합을 e2e 스크린샷으로 확인한다.

### Apple HIG — Accessibility
- URL: https://developer.apple.com/design/human-interface-guidelines/accessibility (대체: https://developer.apple.com/tutorials/data/design/human-interface-guidelines/accessibility.json)
- 읽음: 예 (2026-11-04)
- 발췌:
  - Support larger text sizes: "Ideally, give people the option to enlarge text by at least 200 percent (or 140 percent in watchOS apps)."
  - 기본/최소 타입 크기 표: iOS/iPadOS 17 pt / 11 pt (Typography와 동일).
  - Strive to meet color contrast minimum standards: "Two popular standards of measure for color contrast are the Web Content Accessibility Guidelines (WCAG) and the Accessible Perceptual Contrast Algorithm (APCA)." / Accessibility Inspector 기준 표: "Up to 17 pts, All, 4.5:1" / "18 pts, All, 3:1" / "All, Bold, 3:1"
  - "If your app supports Dark Mode, make sure to check the minimum contrast in both light and dark appearances."
  - Prefer system-defined colors: "These colors have their own accessible variants that automatically adapt when people adjust their color preferences, such as enabling Increase Contrast or toggling between the light and dark appearances."
  - Convey information with more than color alone: "Offer visual indicators, like distinct shapes or icons, in addition to color to help people perceive differences in function and changes in state."
  - Offer sufficiently sized controls: "Controls that are too small are hard for many people to interact with and select. Strive to meet the recommended minimum control size for each platform..." 표: iOS/iPadOS 기본 44x44 pt, 최소 28x28 pt. macOS 기본 28x28 pt, 최소 20x20 pt. watchOS 44x44 / 28x28.
  - Consider spacing between controls as important as size: "In general, it works well to add about 12 points of padding around elements that include a bezel. For elements without a bezel, about 24 points of padding works well around the element's visible edges."
  - Offer alternatives to gestures: "if you use a swipe gesture to dismiss a view, also make a button available"
  - Keyboard: "Let people use the keyboard alone to navigate and interact with your app."
  - Reduce motion: "Be cautious with fast-moving and blinking animations." / "When this setting is active, ensure your app or game responds by reducing automatic and repetitive animations, including zooming, scaling, and peripheral motion." 추가 권장: "Tightening animation springs to reduce bounce effects" / "Avoiding animating depth changes in z-axis layers" / "Replacing transitions in x-, y-, and z-axes with fades to avoid motion" / "Avoiding animating into and out of blurs"
  - VoiceOver: "Describe your app's interface and content for VoiceOver."
- LEO 적용:
  - 터치 타깃 기본 44×44 CSS px(Apple 기본값; WCAG 24px의 상위 기준). 베젤 없는 아이콘 버튼은 주변 24px 여백, 베젤 있는 버튼은 12px 여백을 간격 토큰으로.
  - 통화 화면의 "듣는 중" 펄스/파형은 reduce-motion에서 정지 + 텍스트 상태로, 화면 전환은 페이드로, 블러 인/아웃 금지.
  - 스와이프로 닫는 시트가 있으면 닫기 버튼도 둔다.
  - 대비 기준은 Apple도 WCAG AA 값을 그대로 쓰므로 하나의 기준(4.5:1 / 3:1)만 유지하면 된다.

### Apple HIG — Motion
- URL: https://developer.apple.com/design/human-interface-guidelines/motion (대체: https://developer.apple.com/tutorials/data/design/human-interface-guidelines/motion.json)
- 읽음: 예 (2026-11-04)
- 발췌:
  - Add motion purposefully: "Don't add motion for the sake of adding motion. Gratuitous or excessive animation can distract people and may make them feel disconnected or physically uncomfortable."
  - Make motion optional: "Not everyone can or wants to experience the motion in your app or game, so it's essential to avoid using it as the only way to communicate important information."
  - Providing feedback(요약): 피드백 모션은 제스처와 기대에 맞게(위에서 내려온 뷰는 옆으로 치워 닫지 않기). "Brief, precise feedback animations"가 더 효과적. 커스텀 모션 남용 회피. 애니메이션이 끝나길 기다리게 하지 말 것(취소 가능).
  - 숫자: 게임 프레임 30~60 fps, visionOS 0.2 Hz 진동 회피. 전환 duration(ms) 수치는 이 페이지에 없음.
  - Reduce Motion의 구체 대응은 이 페이지가 아니라 Accessibility 페이지에 있음(위 참조).
- LEO 적용:
  - 모션 토큰은 짧게(상태 전환 150~250ms, M3 duration 참고). 통화 연결 애니메이션이 종료 버튼 조작을 막지 않도록 한다.
  - 중요한 정보(통화 종료 임박, 오류)는 모션만으로 전달하지 않고 텍스트/status message로 함께 알린다.

---

## C. Material Design 3

주: m3.material.io 페이지는 JS 렌더링이라 직접 fetch는 제목만 반환됐다. 대체로 `https://r.jina.ai/<원본 URL>` 리더를 통해 읽었다. 타입 스케일 값은 그 방식으로도 표가 비어("Close" 플레이스홀더) 있어, Material Web의 공식 토큰 소스(GitHub)에서 읽었다.

### M3 — Color system overview / How the system works
- URL: https://m3.material.io/styles/color/system/overview (대체: https://r.jina.ai/https://m3.material.io/styles/color/system/overview), https://m3.material.io/styles/color/system/how-the-system-works (대체: r.jina.ai 경유)
- 읽음: 예 (2026-11-04, 두 페이지)
- 발췌:
  - overview: "26+ color roles" / 역할은 "emphasis, container type, and relationship with other elements"에 따라 배정.
  - overview: tone 기반 surface 역할이 "replaced the previous approach of surfaces at +1 to +5 elevation" / 새 역할은 "are not tied to elevation".
  - overview 변경 로그: "Updated the default light theme surface from tone 99 to tone 98."
  - overview: 다크 테마 = "a low-light version of a UI that displays mostly dark surfaces"; 어두운 surface에 밝은 라벨을 짝지어 "the UI automatically meets contrast requirements"
  - overview: "Color roles support three levels of contrast so people can select the one that best suits their vision needs."
  - how-the-system-works: "Colors in these palettes are given a number from 0 to 100 in increments of 10, as well as 95, 98, and 99." / 키 컬러 5종(primary, secondary, tertiary, neutral, neutral variant).
  - "the algorithm assigns the color tone primary40 to the primary role and the tone primary100 to the on primary role."
  - "primary roles are picked from the primary tonal palette, while surface roles are picked from the neutral tonal palette."
  - "Using tones 50 and 98 for a button and its label creates an accessible 3:1 contrast." / "Using colors of tones 30 and 98 for a button and its label create a 7:1 contrast." / "Colors with a greater difference in tone create higher contrast"
  - 라이트/다크 전체 톤 매핑표(primary 80 등)는 이 두 페이지에 없음 — 확인 못 함.
- LEO 적용:
  - 다크 모드 깊이 표현을 "elevation 숫자 → 흰색 오버레이"가 아니라 명시적 surface 단계 토큰(surface-container-lowest…highest)으로 정의한다. 통화 화면 = surface, 컨트롤 바 = surface-container, 모달 = surface-container-high.
  - 색 팔레트를 tone 단위(0~100)로 만들면 라이트/다크를 같은 역할명으로 교체할 수 있다. 라이트 surface는 tone 98 급(순백 아님).
  - 대비는 tone 차이로 추정하지 말고 실제 측정(4.5:1)으로 확인한다. 페이지가 명시한 쌍은 50/98 → 3:1, 30/98 → 7:1뿐.

### M3 — Color roles
- URL: https://m3.material.io/styles/color/roles (대체: https://r.jina.ai/https://m3.material.io/styles/color/roles)
- 읽음: 예 (2026-11-04)
- 발췌 (역할 설명, 원문 한 줄):
  - Primary: "High-emphasis fills, text, and icons against surface." / On primary: "Text and icons placed on primary." / Primary container: "A standout fill against surface, used for key components like the FAB." / On primary container: "Text and icons placed on primary container."
  - Secondary: "Less prominent fills, text, and icons against surface." / Secondary container: "A less prominent fill for recessive components like tonal buttons."
  - Tertiary: "Complementary fills, text, and icons against surface." / Tertiary container: "A complementary container color for components like input fields."
  - Error: "An attention-grabbing color against surface that signals urgency." / Error container: "An attention-grabbing fill against surface." (error는 동적 색 스킴에서 고정, 라이트/다크에는 적응)
  - Surface: "The default background color." / On surface: "Text and icons placed on any surface or surface container color." / On surface variant: "Lower-emphasis text and icons on surface or surface container colors."
  - Surface container lowest/low/default/high/highest: 강조 순서로 5단계, 계층과 중첩 컨테이너용. Surface dim: "The dimmest surface color in both light and dark themes." / Surface bright: "The brightest surface color in both light and dark themes."
  - Outline: "Important boundaries, such as a text field outline." / Outline variant: "Decorative elements, such as dividers."
  - Inverse surface: "Background fills for elements that contrast with surface." / Inverse on surface / Inverse primary: "Actionable elements, such as text buttons, placed on inverse surface."
  - Fixed 계열(primary/secondary/tertiary fixed, fixed dim, on fixed, on fixed variant): 라이트/다크에서 같은 톤 유지.
  - 대비: 색 쌍은 "an accessible minimum 3:1 contrast"를 제공하도록 설계. Outline variant는 다른 요소가 4.5:1을 제공할 때 장식용으로만; "Outline variant should not define the boundary of a target. Use outline, or another color with 3:1 contrast against surface, instead." 칩/버튼 테두리로 쓰려면 내부 텍스트·아이콘이 4.5:1을 충족해야.
  - 역할은 의도된 쌍/레이어 순서로만 적용; 잘못 짝지으면 사용자 대비 조정 시 대비가 깨짐.
  - 기본 톤 값 표(primary 40/80 등)는 이 페이지에 없음 — 확인 못 함. scrim/shadow/surface-tint 설명 없음.
- LEO 적용:
  - LEO 토큰 이름을 M3 역할명에 맞춘다: `surface`, `surface-container(-low/-high)`, `on-surface`, `on-surface-variant`, `primary`, `on-primary`, `primary-container`, `error`, `error-container`, `outline`, `outline-variant`, `inverse-surface`(토스트/스낵바용).
  - 채팅 입력창 테두리·버튼 외곽은 `outline`(3:1), 메시지 사이 구분선은 `outline-variant`.
  - 리포트의 "보완 필요" 항목은 `error-container` + `on-error-container`, "우수"는 별도 tertiary/success 쌍. 점수 칩 텍스트는 4.5:1.
  - 통화 종료 토스트/상태 메시지는 `inverse-surface` + `inverse-on-surface`로 어느 모드에서나 눈에 띄게.

### M3 — Typography: type scale tokens
- URL: https://m3.material.io/styles/typography/type-scale-tokens (대체 1: https://r.jina.ai/https://m3.material.io/styles/typography/type-scale-tokens — 표 값 비어 있음; 대체 2(값 출처): https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/v0_192/_md-sys-typescale.scss)
- 읽음: 예 (2026-11-04). /styles/typography/overview는 r.jina.ai 경유로도 본문 없음 → 확인 못 함.
- 발췌:
  - 토큰 페이지: 타입 스케일은 "15 baseline and 15 emphasized styles" (Display Large ~ Label Small), 스타일당 토큰 1개. 기본 서체 Roboto(brand = Headline/Display, plain = Body/Label). Emphasized는 더 높은 weight + 미세 조정, 컴포넌트 기본 미사용(예: `md.sys.typescale.display-large` ↔ `md.sys.typescale.emphasized.display-large`). 단위: Android sp(1.0), Web rem(0.0625, 16px 루트).
  - 값(material-web v0_192 토큰 소스, 16px 루트 기준 환산):
    - display-large: size 3.5625rem(57px) / line-height 4rem(64px) / tracking -0.015625rem(-0.25px) / weight regular / brand
    - display-medium: 2.8125rem(45px) / 3.25rem(52px) / 0 / regular
    - display-small: 2.25rem(36px) / 2.75rem(44px) / 0 / regular
    - headline-large: 2rem(32px) / 2.5rem(40px) / 0 / regular
    - headline-medium: 1.75rem(28px) / 2.25rem(36px) / 0 / regular
    - headline-small: 1.5rem(24px) / 2rem(32px) / 0 / regular
    - title-large: 1.375rem(22px) / 1.75rem(28px) / 0 / regular / brand
    - title-medium: 1rem(16px) / 1.5rem(24px) / 0.009375rem(0.15px) / medium / plain
    - title-small: 0.875rem(14px) / 1.25rem(20px) / 0.00625rem(0.1px) / medium
    - body-large: 1rem(16px) / 1.5rem(24px) / 0.03125rem(0.5px) / regular
    - body-medium: 0.875rem(14px) / 1.25rem(20px) / 0.015625rem(0.25px) / regular
    - body-small: 0.75rem(12px) / 1rem(16px) / 0.025rem(0.4px) / regular
    - label-large: 0.875rem(14px) / 1.25rem(20px) / 0.00625rem(0.1px) / medium
    - label-medium: 0.75rem(12px) / 1rem(16px) / 0.03125rem(0.5px) / medium
    - label-small: 0.6875rem(11px) / 1rem(16px) / 0.03125rem(0.5px) / medium
  - 주: font/weight는 `md-ref-typeface` 참조값(구체 서체명·숫자 weight는 이 파일에 없음). Web 토큰 파일은 `tracking`을 unsupported로 표시.
- LEO 적용:
  - 스케일 이름은 M3식 5단(display/headline/title/body/label × large/medium/small)보다 작게: LEO에 필요한 건 display(타이머/총점), headline(페이지 제목), title(카드 제목), body-large(채팅·교정 본문 16px), body-medium(메타 14px), label(버튼 14px medium) 정도.
  - M3 body-large의 line-height 1.5(16/24)는 WCAG 1.4.12의 1.5와 일치. 한국어 본문은 1.6으로 올린다(D 참조). M3의 양(+) tracking은 라틴 Roboto 기준이므로 한글에는 적용하지 않는다(0 또는 약한 음수).
  - 최소 글자 11px(label-small)는 한글에는 작다 → LEO 하한 12px.

### M3 — Motion overview
- URL: https://m3.material.io/styles/motion/overview (대체: https://r.jina.ai/https://m3.material.io/styles/motion/overview)
- 읽음: 예 (2026-11-04)
- 발췌:
  - 2025-05 M3 Expressive에서 물리(스프링) 기반 모션 시스템 도입, 기존 easing+duration 시스템을 대체.
  - Motion schemes: Expressive(기본, 오버슈트/바운스) vs Standard("More functional, with minimal bounce", 유틸리티 제품용, 목표값으로 ease-in).
  - Springs: stiffness, damping, initial velocity. "A damping value of 1 completely removes spring bounce."
  - Spring tokens: spatial(이동·회전·크기·코너; 오버슈트 있음) / effects(색·불투명도; 오버슈트 없음), 각각 default/fast/slow. fast = 스위치·버튼 같은 작은 요소, slow = 전체 화면.
  - Web: "compatible with Compose springs" (웹용 토큰 값은 페이지에 없음). reduced motion/접근성 문구는 이 페이지에 없음.
- LEO 적용:
  - 웹에서는 스프링 토큰 값이 제공되지 않으므로 아래 easing/duration 토큰(여전히 공개됨)을 쓴다. 바운스 없는 Standard 스킴 성격이 "면접 연습" 도구에 맞는다.
  - 색/불투명도 전환(effects)은 오버슈트 없이, 위치/크기 전환만 약간의 감속.

### M3 — Easing and duration tokens
- URL: https://m3.material.io/styles/motion/easing-and-duration/tokens-specs (대체: https://r.jina.ai/https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
- 읽음: 예 (2026-11-04)
- 발췌:
  - Easing: `emphasized` = CSS cubic-bezier 없음(Standard로 대체 권고); `emphasized.decelerate` cubic-bezier(0.05, 0.7, 0.1, 1.0); `emphasized.accelerate` cubic-bezier(0.3, 0.0, 0.8, 0.15); `standard` cubic-bezier(0.2, 0.0, 0, 1.0); `standard.decelerate` cubic-bezier(0, 0, 0, 1); `standard.accelerate` cubic-bezier(0.3, 0, 1, 1); `linear`은 페이지에 없음.
  - Duration: short1 50ms, short2 100ms, short3 150ms, short4 200ms; medium1 250, medium2 300, medium3 350, medium4 400; long1 450, long2 500, long3 550, long4 600; extra-long1 700, extra-long2 800, extra-long3 900, extra-long4 1000ms.
  - 가이드(요약): Short(50~200ms) 작은 유틸리티 전환, 예: 선택 컨트롤 200ms + Standard. Medium(250~400ms) 화면 중간 영역 횡단, 예: FAB → 시트 400ms + Emphasized. Long(450~600ms) 큰 표현적 전환, 예: 카드 → 전체화면 500ms + Emphasized. Extra long(700~1000ms) 드묾, 사용자 입력 없는 앰비언트(캐러셀 자동 넘김 1000ms). enter/exit 구분 지침은 없음.
- LEO 적용:
  - 모션 토큰 제안: `--motion-fast: 150ms`(hover/press/토글), `--motion-base: 250ms`(패널·토스트 등장), `--motion-slow: 400ms`(통화 화면 ↔ 리포트 전환). easing은 `standard` cubic-bezier(0.2, 0, 0, 1), 등장 `standard.decelerate`(0,0,0,1), 퇴장 `standard.accelerate`(0.3,0,1,1).
  - 통화 중 "듣는 중" 펄스 같은 반복 모션은 extra-long 급(≥1000ms)으로 느리고 작게, reduce-motion에서는 정지.

### M3 — Accessible design (overview / accessibility-basics) 및 M2 Accessibility
- URL: https://m3.material.io/foundations/accessible-design/overview (대체: r.jina.ai 경유) — 읽음: 예 (2026-11-04). 그러나 숫자 규칙 없음: 페이지는 "Accessibility by default is a core design value for Material", 원칙 3개(Honor individuals / Learn before, not after / Requirements as a starting point)만 있고 요구사항은 "documented across component pages and guidelines"라고 함.
- URL: https://m3.material.io/foundations/accessible-design/accessibility-basics — 확인 못 함 (HTTP 404; r.jina.ai 경유도 404).
- URL: https://m2.material.io/design/usability/accessibility.html (대체: https://r.jina.ai/https://m2.material.io/design/usability/accessibility.html) — 읽음: 예 (2026-11-04). M3 사이트에 수치가 없어 M2 접근성 페이지에서 수치를 확인했다(M2 문서임을 명시).
- 발췌 (M2):
  - "For most platforms, consider making touch targets at least 48 x 48 dp." (iOS는 44×44 pt 권장임을 병기)
  - "In most cases, touch targets separated by 8dp of space or more promote balanced information density and usability."
  - "Consider making pointer targets at least 44 x 44 dp." (마우스/스타일러스)
  - "The W3C recommends the following contrast ratios for body text and image text." 표: 큰 텍스트(14 pt bold / 18 pt regular 이상)와 그래픽 3:1, 작은 텍스트 4.5:1.
  - "Icons or other critical elements should also consider using the above recommended contrast ratios."
  - 포커스: "Focus points can be expressed through a combination of visual indicators and accessibility text." (크기/대비 수치 없음)
  - 텍스트 확대: sp 단위 사용, "Ensure that there is sufficient space for large and foreign language fonts." / "Scale your UI to work well with magnification and large text."
- LEO 적용:
  - 모바일 터치 타깃 48×48 CSS px를 상한 기준으로, 44×44를 하한으로 잡고(Apple), 인접 타깃 간격 8px 이상. 통화 화면의 음소거/종료 버튼은 48px+ 와 16px 간격.
  - 데스크톱 포인터 전용 요소(리포트 펼치기 등)는 44×44 이상 또는 WCAG 24px + 간격.
  - 대비 수치는 WCAG와 동일(4.5:1 / 3:1)이므로 한 기준으로 통일.

---

## D. 한국어 타이포그래피

### 있어보는 Web을 위한 타이포그라피 10 (velog, meow)
- URL: https://velog.io/@hyounglee/typography-for-web-10
- 읽음: 예 (2026-11-04). 개인 블로그(2023-01-08) — 참고 수준.
- 발췌:
  - 행간: "가독성이 좋아지려면 행간이 대략 글자의 높이보다 30% 정도 더 길어야 합니다." / "서체마다 차이가 있으나 일반적으로 1.2~1.5 행간을 주면 나쁘지 않은 디자인이 나옵니다."
  - 자간: "요즘 만들어지는 한글 폰트들은 비교적 자간이 좁게 나와 수정할 필요가 없는 경우가 많지만" / (letter-spacing 음수 적용은) "필수적인 요소는 아니지만, 적용하였을때 조금 더 디테일하게 완성도 높은 그래픽을 만들 수 있기 때문입니다."
  - 줄 길이: "좋은 읽기 경험을 원한다면 한 줄에 약 60자 정도의 글자가 있어야 합니다. (영문 기준)" / "모바일 기기의 경우에는 한 줄에 약 30-40자가 적절합니다."
  - 서체 수: "3가지가 넘는 글꼴을 사용하면 웹사이트의 짜임새와 전문성이 없어보입니다."
  - 대비: "텍스트가 작은 경우 배경 대비 텍스트 명암비는 최소 4.5:1 이어야 한다." / "텍스트가 큰 경우(굵은 서체 14px / 일반서체 18px), ... 최소 3:1"
  - 본문 글자 크기 권장치와 -0.01em 같은 구체 자간 수치는 이 글에 없음.
- LEO 적용:
  - 이 글의 1.2~1.5는 WCAG 1.4.12의 1.5 하한보다 낮으므로 채택하지 않는다. 한국어 본문 line-height는 1.6을 기본으로(WebSearch 요약에서 1.6~1.8 주장이 있었으나 그 원문은 fetch하지 못해 "확인 못 함").
  - 자간은 Pretendard 기본값 유지(0). 제목에만 -0.01em 정도 검토하되 실제 화면에서 확인한다.
  - 리포트/채팅 본문의 최대 줄 길이: 데스크톱 약 60자(영문)·한글은 더 짧게 — `max-width: 65ch` 전후에서 실제 한글 폭으로 조정. 모바일은 30~40자.

### 한국 웹 문서 가독성 연구 (대한산업공학회지, 2003)
- URL: https://koreascience.or.kr/article/JAKO200310103403108.pub?orgId=kiie
- 읽음: 예 (2026-11-04, 초록)
- 발췌:
  - 제목: "The Influences of Reading Type, Line Length, and Interlinear Spacing on the Legibility of Korean Web Documents", 저자 Shin, Jong-Hyun / Park, Min-Yong, Journal of Korean Institute of Industrial Engineers Vol.29 No.3, pp.197-205 (2003).
  - "50 characters per line of line length and 100 percents of interlinear spacing improved reading rate."
  - (글꼴 종류는 변수에 없음. "100% interlinear spacing"의 정의는 초록에 없어 본문 확인 필요 — 확인 못 함.)
- LEO 적용:
  - 한글 본문 줄 길이 상한 약 50자 — 리포트 교정 문장 컬럼 폭을 데스크톱에서 50자 내외로 제한한다(16px 기준 약 800px → 실제로는 `max-width: 42~46rem` 범위에서 측정).
  - 연구가 오래됐고(2003) "100%" 행간 정의가 불명확하므로 수치 근거로는 쓰지 않고 "줄 길이 제한"의 근거로만 인용한다.

### WebSearch 결과 (원문 미열람)
- 검색어: 한글 본문 line-height 행간 자간 권장 웹 타이포그래피 1.6
- 읽음: 검색 결과 요약만 확인. "한글 본문 1.6~1.8, 자간 -0.01~-0.02em" 주장이 있는 블로그는 URL을 특정해 fetch하지 않았음 → 확인 못 함. web.dev 타이포그래피 페이지(https://web.dev/learn/design/typography?hl=ko)도 fetch하지 않음 → 확인 못 함.

---

## E. 폰트

### Pretendard (GitHub README)
- URL: https://github.com/orioncactus/pretendard
- 읽음: 예 (2026-11-04)
- 발췌:
  - 라이선스: SIL Open Font License (OFL). 상업적 사용·수정·재배포 가능, 폰트 단독 판매만 금지(README 요약).
  - 9 weights + Variable 지원. family 이름: `Pretendard`, Variable은 `"Pretendard Variable"`. 변형: Pretendard JP, Pretendard Std, Pretendard GOV.
  - 웹 폰트(jsDelivr, v1.3.9) 스니펫:
    - 전체: `<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />`
    - 다이나믹 서브셋: `<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css" />`
    - Variable 다이나믹 서브셋: `<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />`
    - Variable 전체: `<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />`
    - `@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");`
    - cdnjs/UNPKG 동등 URL도 README에 있음.
  - font-family 예시(플랫폼 동일 외형용): `font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;`
  - Next.js: `next/font/local` 사용 시 `weight: '45 920'` 지정. 생략하면 WebKit 계열에서 굵기가 잘못 렌더링될 수 있다는 경고.
  - Inter, Source Han Sans, M PLUS 1p를 다듬어 만든 서체로 "가독성과 시각 보정에 추가 작업이 필요 없다"는 취지(README 요약). line-height/letter-spacing 권장치는 README에 없음.
- LEO 적용:
  - 본문 서체: Pretendard Variable + 다이나믹 서브셋. Next.js 환경이므로 CDN 대신 `next/font/local`로 셀프 호스팅할 경우 `weight: '45 920'`를 반드시 지정. CDN을 쓴다면 위 variable dynamic-subset `<link>`를 그대로.
  - 영어 대화 텍스트도 Pretendard(Inter 기반)로 통일 가능 → 서체 1종으로 끝나며 Apple "typeface 최소화" 지침과 맞는다. 별도 Inter 로드는 불필요.
  - 라이트/다크 어느 쪽도 weight 300 이하 미사용, 본문 400, 강조 500~600.

### Spoqa Han Sans (GitHub README)
- URL: https://github.com/spoqa/spoqa-han-sans
- 읽음: 예 (2026-11-04)
- 발췌:
  - 라이선스: SIL Open Font License (저장소 LICENSE는 OFL-1.1).
  - 굵기 4종: Thin, Regular, Medium, Bold.
  - 웹 폰트: jsDelivr 아님, GitHub Pages: `@import url(//spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css);` / `font-family: 'Spoqa Han Sans Neo', 'Spoqa Han Sans JP', sans-serif;`
  - 서브셋 빌드 있음(TTF Subset, OTF Subset, JP Subset). 다이나믹 서브셋 CSS는 언급 없음.
  - line-height/letter-spacing 권장치 없음.
- LEO 적용:
  - 굵기 4종·Variable 없음·다이나믹 서브셋 없음 → Pretendard 대비 이점이 없어 채택하지 않는다(기각 사유로 DECISIONS에 기록 가능).

### Noto Sans KR (Google Fonts)
- URL: https://fonts.google.com/specimen/Noto+Sans+KR (대체: https://r.jina.ai/https://fonts.google.com/specimen/Noto+Sans+KR ; 라이선스 원문: https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/OFL.txt)
- 읽음: 예 (2026-11-04; Google Fonts 페이지는 리더 경유로 About·굵기만, 라이선스는 google/fonts 저장소 OFL.txt로 확인)
- 발췌:
  - About: "Noto is a global font collection for writing in all modern and ancient languages." / "Noto Sans KR is an unmodulated ("sans serif") design for the Korean language using Hangul and the Korean Hanja scripts." / Hiragana·Katakana·Latin·Cyrillic·Greek 지원, "has multiple weights."
  - 굵기: Thin 100 ~ Black 900, 9종. "Variable Axes" 표시 있음(축 상세 미표시).
  - OFL.txt: "Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'" / "This Font Software is licensed under the SIL Open Font License, Version 1.1."
- LEO 적용:
  - Pretendard가 로드 실패할 때의 폴백으로만(font-family 스택에 "Noto Sans KR"). Google Fonts CSS 로드는 하지 않는다(Pretendard 스택에 이미 포함).

### Inter (Google Fonts)
- URL: https://fonts.google.com/specimen/Inter (대체: https://r.jina.ai/https://fonts.google.com/specimen/Inter 및 .../Inter/about ; 라이선스 원문: https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt)
- 읽음: 예 (2026-11-04; 라이선스는 google/fonts OFL.txt로 확인)
- 발췌:
  - "Designed by Rasmus Andersson" / "Inter is a variable font family carefully crafted & designed for computer screens."
  - Variable: 축 Optical Size, Italic, Weight. 스타일 18종(Thin 100 ~ Black 900, upright/italic).
  - OFL.txt: "Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)" / "This Font Software is licensed under the SIL Open Font License, Version 1.1." Reserved Font Name 없음.
- LEO 적용:
  - 영문 대화 텍스트에 Inter를 별도 로드할 필요는 없다(Pretendard 라틴이 Inter 기반). 숫자 타이머에 tabular figures가 필요하면 `font-variant-numeric: tabular-nums`를 먼저 시도하고, Pretendard에서 지원되지 않을 때만 Inter(opsz 축 활용)를 숫자 전용으로 검토.

---

## 통합 요약 — LEO 토큰 기준 제안(출처 기반)

- 텍스트 대비 4.5:1(본문), 3:1(≥24px 또는 ≥18.66px bold, UI 컴포넌트·포커스 링·아이콘) — WCAG 1.4.3/1.4.11, Apple Accessibility 표, M2 표 모두 동일.
- 다크 모드: 반전 금지, base/elevated 2단 이상 surface(Apple) → M3 surface-container 5단 토큰으로 구현. 커스텀 색 7:1 목표(Apple Dark Mode).
- 터치 타깃: WCAG 하한 24×24, Apple 기본 44×44pt, M2 48×48dp + 8dp 간격. LEO: 44px 하한, 통화 주요 버튼 48~56px, 간격 ≥8px.
- 타이포: 본문 16~17px, 하한 12px, line-height 1.6(한국어; WCAG 1.4.12 1.5 이상), 굵기 ≥400. 줄 길이 한글 ~50자.
- 모션: 150/250/400ms, standard easing cubic-bezier(0.2,0,0,1); reduce-motion에서 펄스 정지·페이드 전환(Apple Accessibility, WCAG 2.2.2/2.3.3).
- 10분 타이머: 2.2.1 Essential Exception 적용 가능. 통화 전 제한 명시, 준비 단계는 타이머 밖으로, 종료 임박은 `role="status"`.

---

### 접근 실패 목록

직접 URL이 실패했으나 대체 URL로 내용을 확보한 경우(참고):
- https://developer.apple.com/design/human-interface-guidelines/typography — JS 렌더링, 제목만 반환 → `/tutorials/data/.../typography.json`으로 확보(뒤 81,026자 미열람: SF Pro Text/Display 20pt 전환 문구·AX4/AX5 미확인)
- https://developer.apple.com/design/human-interface-guidelines/color — 동일 → color.json(뒤 81,946자 미열람)
- https://developer.apple.com/design/human-interface-guidelines/dark-mode — 동일 → dark-mode.json
- https://developer.apple.com/design/human-interface-guidelines/accessibility — 동일 → accessibility.json
- https://developer.apple.com/design/human-interface-guidelines/motion — 동일 → motion.json
- https://m3.material.io/styles/color/system/overview — JS 렌더링 → r.jina.ai 경유
- https://m3.material.io/styles/color/roles — 동일 → r.jina.ai 경유(기본 톤 값 표는 페이지에 없음)
- https://m3.material.io/styles/motion/overview — 동일 → r.jina.ai 경유
- https://m3.material.io/styles/motion/easing-and-duration/tokens-specs — 동일 → r.jina.ai 경유
- https://m3.material.io/foundations/accessible-design/overview — 동일 → r.jina.ai 경유(수치 없음)
- https://m2.material.io/design/usability/accessibility.html — JS 렌더링 → r.jina.ai 경유
- https://fonts.google.com/specimen/Noto+Sans+KR — JS 렌더링 → r.jina.ai 경유(라이선스 미표시) + google/fonts OFL.txt
- https://fonts.google.com/specimen/Inter — 동일 → r.jina.ai 경유 + google/fonts OFL.txt
- https://www.w3.org/TR/WCAG22/ — 읽었으나 페이지가 269,706자라 2.5.8/3.2.6/3.3.x/4.1.3은 offset 100,000 구간과 각 Understanding 페이지로 확보. 마지막 69,706자(용어 정의 포함, large scale 정의)는 미열람.

완전히 확인 못 한 것:
- https://m3.material.io/styles/typography/type-scale-tokens — r.jina.ai 경유로도 토큰 표가 "Close" 플레이스홀더로만 나옴(설명 문구만 확보). 값은 https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/v0_192/_md-sys-typescale.scss 에서 확보(공식 Material Web 토큰 소스).
- https://m3.material.io/styles/typography/overview — r.jina.ai 경유에도 본문 없음(내비게이션만).
- https://m3.material.io/foundations/accessible-design/accessibility-basics — HTTP 404 (직접, r.jina.ai 경유 모두).
- https://raw.githubusercontent.com/material-components/material-web/main/tokens/v0_192/_md-sys-typescale.scss — 잘못된 경로(파일 없음; 올바른 경로는 위 versions/v0_192).
- Apple HIG Dark Mode의 "순수 검정/흰색 회피" 문구 — 페이지에 존재하지 않음(없다는 것을 확인).
- Apple HIG Typography의 SF Pro Text/Display 20pt 전환 문구 — 열람 범위 밖(미확인).
- M3 color roles의 라이트/다크 기본 톤 표(primary 40/80, surface 98/6 등) — roles·how-the-system-works 페이지 모두에 없음(primary40/primary100 예시와 surface 99→98 변경 노트만 확인).
- 한글 본문 1.6~1.8 행간을 주장한 블로그 — WebSearch 요약에만 나타남, 원문 URL을 특정해 fetch하지 않음.
- https://web.dev/learn/design/typography?hl=ko — fetch하지 않음.
