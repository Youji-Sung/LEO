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

# 제2부. UX 라이팅·휴리스틱 가이드


- 조사일: 2026-11-04
- 방식: 모든 출처를 WebFetch(또는 curl 다운로드 후 직접 읽기)로 실제 열람. 열람하지 못한 것은 "확인 못 함"으로 표기하고 사유를 적음.
- 표기: 「발췌」의 따옴표 안은 원문 그대로(영문 그대로 둠). 따옴표 없는 문장은 원문을 요약한 것(WebFetch 요약 모델이 125자 초과 인용을 요약함). 요약임을 `(요약)`으로 명시.
- LEO 적용 항목의 약어: [통화] 통화 화면 상태 문구 · [리포트] 교정 리포트 어조 · [오류] 오류 메시지 · [빈화면] 빈 상태 · [삭제확인] 포트폴리오 삭제 확인.

---

## A. Nielsen Norman Group

### A-1. 10 Usability Heuristics for User Interface Design (NN/g)
- URL: https://www.nngroup.com/articles/ten-usability-heuristics/
- 읽음: 예 (2026-11-04). 각 정의의 첫 문장은 원문 그대로, 뒷부분은 요약.
- 발췌:
  1. "Visibility of System Status" — "The design should always keep users informed about what is going on, through appropriate feedback" (이어서 "within a reasonable amount of time" 취지, 요약)
  2. "Match Between the System and the Real World" — "The design should speak the users' language." (사용자에게 익숙한 단어·개념, 자연스러운 순서, 요약)
  3. "User Control and Freedom" — "Users often perform actions by mistake." (원치 않는 동작에서 빠져나올 "emergency exit"이 필요, 요약)
  4. "Consistency and Standards" — "Users should not have to wonder whether different words, situations, or actions mean the same thing."
  5. "Error Prevention" — "Good error messages are important, but the best designs carefully prevent problems from occurring in the first place."
  6. "Recognition Rather than Recall" — "Minimize the user's memory load by making elements, actions, and options visible."
  7. "Flexibility and Efficiency of Use" — "Shortcuts — hidden from novice users — may speed up the interaction for the expert user"
  8. "Aesthetic and Minimalist Design" — "Interfaces should not contain information that is irrelevant or rarely needed."
  9. "Help Users Recognize, Diagnose, and Recover from Errors" — "Error messages should be expressed in plain language (no error codes), precisely indicate the problem," (이어서 "and constructively suggest a solution" 취지, 요약)
  10. "Help and Documentation" — "It's best if the system doesn't need any additional explanation."
- LEO 적용:
  - [통화] #1: 연결 중·녹음 중·상대가 말하는 중·남은 시간 같은 상태를 항상 보이게 한다. 상태가 바뀔 때마다 문구도 바뀌어야 한다.
  - [오류] #9: 오류 코드 금지. "무엇이 문제인지"를 정확히, "어떻게 하면 되는지"를 한 문장으로.
  - [삭제확인] #3·#5: 되돌릴 수 없는 삭제는 확인을 거치고, 취소 경로를 분명히 둔다.
  - [전체] #4: 같은 행동은 같은 단어로(예: "통화 시작"을 다른 화면에서 "연습 시작"으로 바꿔 부르지 않는다).
  - [전체] #8: 설명 문구는 꼭 필요한 것만. 빈 공간을 채우려는 문장은 넣지 않는다.

### A-2. Error-Message Guidelines (NN/g)
- URL: https://www.nngroup.com/articles/error-message-guidelines/
- 읽음: 예 (2026-11-04)
- 발췌 (섹션명: Visibility / Communication / Efficiency):
  - Visibility: 오류 표시는 "displaying an error indicator adjacent to the interface where the error occurred."; "never use exclusively color or animation to indicate errors."; 차단형 다이얼로그는 "should be reserved for severe errors."; "Presenting errors too early is a hostile pattern."
  - Communication: "Avoid technical jargon and use language familiar to your users instead."; "Provide descriptions of the exact problems to help users understand what happened."; "Merely stating the problem is also not enough; offer some potential remedies."; "Don't use phrasing that blames users or implies they are doing something wrong."
  - Efficiency: "Let users correct errors by editing their original action instead of starting over."; "guess the correct action and let users pick it from a small list of fixes."; "Explain to your users how the system works and how to resolve an error."
  - 완전 실패 상황: "blending an apology with something surprising or novel may salvage a disappointing situation." (시스템이 전혀 동작하지 못할 때만, 요약)
- LEO 적용:
  - [오류] 구조를 고정: ① 무엇이 안 됐는지(정확히) ② 할 수 있는 다음 행동. 예: 마이크 권한 거부 → "마이크를 쓸 수 없어요. 브라우저 설정에서 마이크 권한을 허용한 뒤 다시 시도하세요."
  - [오류] 사용자를 탓하는 표현("잘못 입력하셨습니다", "허용하지 않으셨습니다") 금지. 문제 중심으로 쓴다.
  - [오류] 색상·아이콘만으로 오류를 알리지 않는다. 항상 텍스트를 동반.
  - [오류] 채팅 입력 실패 시 입력한 영어 문장을 보존하고 재전송 경로를 준다(입력 보존 원칙).
  - [오류] 통화 전체가 불가능한 치명 오류에만 사과(미안함)를 쓴다. 일상 오류에는 쓰지 않는다.

### A-3. Empty-State Interface Design (NN/g)
- URL: https://www.nngroup.com/articles/empty-state-interface-design/
- 읽음: 예 (2026-11-04)
- 발췌:
  - 정의: "containers, screens, or panels for which content does not yet exist or otherwise cannot be displayed."
  - "Totally empty states cause confusion about how and whether the system is working."
  - "Inaccurate system-status messages for empty states are particularly harmful."
  - "Empty states present an opportunity to provide contextual help relevant to the user's task."
  - "provide brief yet explicit instructions or, better yet, link directly to the steps that need to be taken"
  - Conclusion: "Do not default to totally empty states."; "When content does not yet exist for a screen, page, or panel, use the empty state to provide help cues."; "Provide direct pathways (i.e., links) to getting started with key tasks related to populating the empty state."; "When a process is running, use progress indicators to increase visibility of system status."; "If there is no relevant data to display after a process has completed, use the empty space to provide a system-status message"
- LEO 적용:
  - [빈화면] 리포트 목록이 비었을 때: 상태 설명 + 다음 행동 직결 버튼("아직 통화 기록이 없어요. 첫 통화를 시작하면 리포트가 여기에 쌓여요." + [통화 시작]).
  - [빈화면] 포트폴리오가 비었을 때: 왜 넣으면 좋은지 한 줄 + [추가] 버튼. 완전 빈 화면 금지.
  - [빈화면] 처리 중(리포트 생성 중)은 빈 상태가 아니라 진행 상태로 보여 준다(A-4 참조).
  - [빈화면] 상태 문구는 정확해야 한다. 네트워크 오류로 못 불러온 것을 "기록이 없어요"로 쓰면 안 된다(오류와 빈 상태를 구분).

### A-4. Progress Indicators Make a Slow System Less Insufferable (NN/g)
- URL: https://www.nngroup.com/articles/progress-indicators/
- 읽음: 예 (2026-11-04)
- 발췌:
  - "Use a progress indicator for any action that takes longer than about 1.0 second."
  - 루프 애니메이션(스피너): "This indicator should be reserved for actions that take between 2-10 seconds."; "we don't recommend looped animation for actions that take longer than 10 seconds."
  - 퍼센트 표시: "Generally, percent-done progress indicators should be used for longer processes that take 10 or more seconds."
  - 요약 규칙: "use a looped indicator for delays of 2–9 seconds and a percent-done indicator for delays of 10 seconds or more."
  - 1초 미만: "Always give some type of immediate feedback." (별도 진행 표시는 불필요, 요약)
  - 정적 표시(멈춘 표시)는 쓰지 말 것, "다시 클릭하지 마세요" 경고 대신 첫 클릭이 접수됐음을 보여 줄 것(요약).
  - 설명 텍스트: 루프 애니메이션에는 이유를 적는다(예 "Loading comments…"); 퍼센트 표시에는 과정 설명(예 "Updating address 3 of 50.").
  - 예상 시간: 정확한 값 대신 대략적 추정, "Always allow for extra time, just in case."; 시간 예측이 어려우면 단계 수를 보여 준다(요약).
  - 스켈레톤 스크린은 이 글에서 다루지 않음.
- LEO 적용:
  - [통화] 연결(2–10초 예상)은 스피너 + 이유 텍스트("통화를 연결하고 있어요"). 10초를 넘기면 단계 또는 남은 과정을 보여 준다.
  - [리포트] 리포트 생성이 10초 이상이면 단계형 진행("대화 분석 중 → 교정 작성 중 → 점수 계산 중")을 쓰고, 추정 시간은 넉넉히.
  - [통화] 모든 버튼은 1초 안에 즉각 피드백(눌림 상태 변화). "다시 누르지 마세요" 문구 금지.
  - [전체] 진행 표시 문구는 "무엇을 하는 중인지"를 적는다. "잠시만 기다려 주세요"만 쓰지 않는다.

### A-5. Severity Ratings for Usability Problems (NN/g)
- URL: https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/
- 읽음: 예 (2026-11-04)
- 발췌 (0–4 척도, 원문 그대로):
  - 0: "I don't agree that this is a usability problem at all"
  - 1: "Cosmetic problem only: need not be fixed unless extra time is available on project"
  - 2: "Minor usability problem: fixing this should be given low priority"
  - 3: "Major usability problem: important to fix, so should be given high priority"
  - 4: "Usability catastrophe: imperative to fix this before product can be released"
  - 세 요인: "The frequency with which the problem occurs" / "The impact of the problem if it occurs" / "The persistence of the problem" (한 번 배우면 피할 수 있는지, 반복해서 괴롭히는지)
- LEO 적용:
  - [전체] 문구 리뷰 결과를 이 0–4 척도로 기록한다. 빈도·영향·지속성 세 요인을 각각 적어 점수 근거를 남긴다.
  - [오류] 통화 연결 실패처럼 과업 자체를 막는 문구 문제는 3 이상, 어미 통일 같은 미관 문제는 1로 분류.

### A-6. Skeleton Screens 101 (NN/g)
- URL: https://nngroup.com/articles/skeleton-screens/ (검색: "nngroup skeleton screens spinners"; 영상 https://www.nngroup.com/videos/skeleton-screens-vs-progress-bars-vs-spinners/ 는 열람하지 않음)
- 읽음: 예 (2026-11-04)
- 발췌:
  - 정의: "A skeleton screen is a design pattern used to indicate that a page is loading"; "The structure of the gray boxes mimics the structure of the final page with content."
  - 종류: 정적 콘텐츠/이미지형, 애니메이션형, 프레임만 보여 주는 형(권장하지 않음)(요약).
  - "If a page takes less than 1 second to load, skeleton screens or spinners aren't necessary."
  - "Spinners or wait animations provide feedback to users that the system is working," (지속 시간은 알려 주지 못함, 요약)
  - 스켈레톤은 10초 미만 대기에, 10초 초과는 진행 막대(명시적 시간 추정) 권장(요약).
  - "Spinners are typically best used on a single module, like a video or a card which is on a dashboard."
  - 전체 화면 로드에는 스켈레톤이 "better when the full screen is loading" (요약)
  - 다운로드·업로드·파일 변환 같은 처리형 작업에는 스켈레톤을 쓰지 말고 진행 막대나 단계 안내를 쓴다(요약).
- LEO 적용:
  - [리포트] 리포트 화면 전체를 불러올 때(10초 미만)는 최종 레이아웃(점수 카드·교정 목록)을 본뜬 스켈레톤.
  - [통화] 통화 화면 안의 한 모듈(예: 교정 힌트 카드)만 기다릴 때는 스피너 + 짧은 문구.
  - [리포트] 리포트 "생성"은 처리형 작업이므로 스켈레톤이 아니라 단계형 진행 표시(A-4와 일치).

---

## B. Google Material — Content design / UX writing

### B-1. Material Design 3 Content design 페이지들 (overview, ux-writing-best-practices, word-choice, global-writing-guidelines, style)
- URL:
  - https://m3.material.io/foundations/content-design/overview
  - https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices
  - https://m3.material.io/foundations/content-design/style-guide/word-choice
  - https://m3.material.io/foundations/content-design/global-writing-guidelines
  - https://m3.material.io/foundations/content-design/style-guide/style
- 읽음: 확인 못 함. 앞의 세 URL은 WebFetch 결과가 페이지 제목("Write effective content", "Style guide – Material Design 3")만 반환. curl로 받은 HTML(61,901바이트)에도 본문이 없고 `/static/angular/main.*.js`로 렌더링되는 Angular SPA라 본문을 받을 수 없음. 뒤의 두 URL은 HTTP 404. 대안 1 `https://m2.material.io/design/communication/writing.html`도 제목("Material Design")만 반환되어 확인 못 함.
- 발췌: 없음.
- LEO 적용: 없음(아래 B-2·B-3의 Google 대체 출처를 사용).

### B-2. (대체) Google Codelab "Material의 커뮤니케이션 원칙: UX 작성 소개" — Material communication guidance
- URL: https://codelabs.developers.google.com/codelabs/material-communication-guidance (검색 결과에 한국어판 `?hl=ko`가 있었으나 영문판을 열람)
- 읽음: 예 (2026-11-04). 이 페이지는 Material 가이드라인을 Google이 코드랩 형식으로 옮긴 것으로, m3 원문의 대체물임. 아래는 요약 모델의 출력이라 일부 요약.
- 발췌:
  - Principles: "Write short, scannable segments of text that focus on a limited number of ideas."; "Any time you write something, ask yourself if there is an easier way to express the idea."; 2인칭("you", "your")이 보통 더 직접적, 1인칭은 소유를 강조할 때만; 한 구절 안에서 1인칭과 2인칭을 섞지 말 것(요약); 대화 상자·알림에는 작업 설명과 중요한 결과를 포함(요약).
  - Voice and tone: "A voice should be consistent across an experience, while tone is contextual and can vary."; 기계가 아닌 사람처럼 쓰고 오류에는 해결책을 제안(요약); 오류 상태에서는 어조를 캐주얼에서 "supportive and detailed"로 옮긴다(요약); 장난스러운 어조는 반복되면 거슬리고, 오류 메시지의 농담은 사용자의 좌절을 깎아내릴 수 있다(요약).
  - Content structure: 사용자의 목표로 문장을 시작한 뒤 필요한 행동을 적는다; 점진적 공개; 되돌릴 수 없는 행동의 결과를 숨기지 않는다(요약).
  - Word choice: 흔한 단어 사용, 업계 용어·만들어 낸 UI 명칭 금지, 같은 기능은 같은 단어, 제품 동작은 현재 시제, 컨트롤은 레이블 텍스트로 지칭, 숫자는 아라비아 숫자(요약).
  - Components: 대화 상자의 제목과 버튼 텍스트는 대화 상자의 목적을 전달; 스낵바 레이블은 진행 중인 과정과 직접 연결(요약).
  - 이 페이지에는 "please"/"sorry"/"oops", 대문자 규칙, 버튼 레이블 규칙은 없음(명시적으로 없다고 확인).
- LEO 적용:
  - [전체] 보이스는 하나, 톤은 상황별. 오류에서는 가볍지 않게, 지원적이고 구체적으로.
  - [오류] 오류 메시지에 농담·장난 금지.
  - [삭제확인] 포트폴리오 삭제 대화 상자: 제목과 버튼이 목적을 그대로 말한다("포트폴리오를 삭제할까요?" / [삭제]). 되돌릴 수 없음을 숨기지 않는다.
  - [전체] 같은 기능은 같은 이름("교정 리포트"를 "피드백", "결과"로 바꿔 부르지 않는다). 숫자는 아라비아 숫자(점수 "8/10", "10분").

### B-3. (참고, Material 아님) Google developer documentation style guide — Tone
- URL: https://developers.google.com/style/tone
- 읽음: 예 (2026-11-04). Material 페이지를 못 읽어 Google의 공개 문서 스타일 가이드로 보완. 개발자 문서용이므로 UI 문구에 그대로 적용하지는 않고 참고만.
- 발췌:
  - 목표 어조: "conversational, friendly, and respectful" (슬랭·경박함 없이)(요약).
  - "In general, avoid exclamation points."
  - "It's great to be polite, but using please in a set of instructions is overdoing the politeness."
  - 절차에서 "simply", "It's easy", "quickly" 금지; "let's" 금지; "please note", "at this time" 같은 군더더기 금지; 지나치게 귀엽거나 장난스럽게 쓰지 말 것(요약).
  - 예시 표: "Dude! This API is totally awesome!"(too informal) / "This API lets you collect data about what your users like."(just right) / "The API documented by this page may enable the acquisition of information pertaining to user preferences."(too formal)
- LEO 적용:
  - [전체] 느낌표 원칙적 금지(성공 축하에도 한 화면에 하나 이하).
  - [오류] "간단히", "쉽게", "빠르게" 같은 난이도 단정 표현 금지(사용자가 막힌 상태에서 모욕이 됨).
  - [리포트] 지시문에 "부디/제발"류 공손 과잉 금지.

---

## C. Microsoft Writing Style Guide

### C-1. Welcome — Microsoft Writing Style Guide
- URL: https://learn.microsoft.com/en-us/style-guide/welcome/
- 읽음: 예 (2026-11-04)
- 발췌:
  - "We need a simple, straightforward style guide that everyone can use, regardless of their role. And it needs to reflect Microsoft's modern approach to voice and style: warm and relaxed, crisp and clear, and ready to lend a hand."
- LEO 적용:
  - [전체] 세 축을 한국어 보이스 정의의 뼈대로 쓴다: 따뜻하고 편안하게(해요체) · 짧고 분명하게 · 먼저 도와주듯이.

### C-2. Microsoft's brand voice: above all, simple and human
- URL: https://learn.microsoft.com/en-us/style-guide/brand-voice-above-all-simple-human
- 읽음: 예 (2026-11-04)
- 발췌:
  - "Though our voice is constant regardless of who we're talking to or what we're saying, we adapt our tone—from serious to empathetic to lighthearted—to fit the context and the customer's state of mind."
  - "Our voice hinges on crisp simplicity. Bigger ideas and fewer words. Less head, more heart."
  - "Warm and relaxed—We're natural. Less formal, more grounded in real, everyday conversations. Occasionally, we're fun. (We know when to celebrate.)"
  - "Crisp and clear—We're to the point. We write for scanning first, reading second. We make it simple above all."
  - "Ready to lend a hand—We show customers we're on their side. We anticipate their real needs and offer great information at just the right time."
  - Style tips: "Get to the point fast. Start with the key takeaway. Put the most important thing in the most noticeable spot. Make choices and next steps obvious."; "Talk like a person. Choose optimistic, conversational language. Use short everyday words, contractions, and sentence-style capitalization. Shun jargon and acronyms."; "Simpler is better. ... Break it up. Step it out. Layer. Short sentences and fragments are easier to scan and read. Prune every excess word."
- LEO 적용:
  - [리포트] 리포트 첫 줄은 핵심 결론(점수와 한 줄 총평)을 먼저, 세부 교정은 아래로(scanning first).
  - [리포트] "축하할 때를 안다": 성공·개선에는 짧게 축하하고, 교정은 담담하게.
  - [통화] 상태 문구는 조각 문장도 허용("연결 중", "상대가 말하는 중").
  - [전체] 사용자의 상태(긴장·실패·성공)에 맞춰 톤을 조절하되 보이스(해요체·짧게·도와주듯)는 유지.

### C-3. Top 10 tips for Microsoft style and voice
- URL: https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice
- 읽음: 예 (2026-11-04)
- 발췌 (10개 팁 제목과 핵심 문장, 원문 그대로):
  1. "Use bigger ideas, fewer words" — "Our modern design hinges on crisp minimalism. Shorter is always better." 예: "If you're ready to purchase Office 365 for your organization, contact your Microsoft account representative." → "Ready to buy? Contact us."
  2. "Write like you speak" — "Read your text aloud. Avoid jargon and overly complex or technical language. It should sound like a friendly conversation." 예: "Invalid ID" → "You need an ID that looks like this: someone@example.com"
  3. "Project friendliness" — "Use contractions like it's, you'll, you're, we're, and let's."
  4. "Get to the point fast" — "Lead with what's most important. Front-load keywords for scanning. Make customer choices and next steps obvious."
  5. "Be brief" — "Give customers just enough information to make decisions confidently. Prune every excess word."
  6. "When in doubt, don't capitalize" — "Default to sentence-style capitalization"
  7. "Use end punctuation in the right places" — "Don't use a period or a colon at the end of titles, headings, subheadings, and UI titles."
  8. "Remember the last comma" (옥스퍼드 쉼표)
  9. "Don't be spacey" (마침표 뒤 한 칸, 대시 주변 공백 없음)
  10. "Revise weak writing" — "Most of the time, start each statement with a verb. Edit out you can when it isn't necessary. Avoid weak phrasing like there is, there are, and there were."
- LEO 적용:
  - [오류] "Invalid ID" → "You need an ID that looks like this" 패턴을 그대로 가져온다: "잘못된 입력"이 아니라 어떤 형태가 맞는지 보여 준다.
  - [전체] 제목·버튼·UI 타이틀 끝에 마침표를 찍지 않는다.
  - [전체] 소리 내어 읽어 어색하면 고친다(Toss "Easy to speak"와 같은 기준, F-2 참조).
  - [전체] "~하실 수 있어요"(you can)는 꼭 필요할 때만. 동사로 시작하는 지시문 우선.

### C-4. Error Messages (Windows 7 UX Guide) — Microsoft Learn
- URL: https://learn.microsoft.com/en-us/windows/win32/uxguide/mess-error (Writing Style Guide 본체에는 오류 메시지 전용 페이지가 없어 검색("microsoft style guide error messages")으로 찾은 Microsoft Learn 문서. 페이지 상단에 "created for Windows 7 and has not been updated" 주의문 있음.)
- 읽음: 예 (2026-11-04). 약 6,600단어 중 설계 개념·특성·텍스트 지침 섹션을 읽음.
- 발췌:
  - "Effective error messages inform users that a problem occurred, explain why it happened, and provide a solution so users can fix the problem."
  - 좋은 오류 메시지의 구성: "A problem. States that a problem occurred." / "A cause. Explains why the problem occurred." / "A solution. Provides a solution so that users can fix the problem."
  - 제시 방식: "Relevant.", "Actionable.", "User-centered. The message describes the problem in terms of target user actions or goals, not in terms of what the code is unhappy with.", "Brief. The message is as short as possible, but no shorter.", "Clear.", "Specific.", "Courteous. Users shouldn't be blamed or made to feel stupid.", "Rare. Displayed infrequently. Frequently displayed error messages are a sign of bad design."
  - "Often the best error message is no error message."
  - 사용자 비난 금지: "Don't use phrasing that blames the user or implies user error. Avoid using you and your in the phrasing. While the active voice is generally preferred, use the passive voice when the user is the subject and might feel blamed for the error if the active voice were used."
  - "Be specific. Avoid vague wording, such as syntax error and illegal operation." (나쁜 예: "File not found.", "Disk is full.", "Value out of range.")
  - "Avoid the word "please," except in situations in which the user is asked to do something inconvenient (such as waiting) or the software is to blame for the situation."
  - "Use the word "sorry" only in error messages that result in serious problems for the user (for example, data loss or inability to use the computer). Don't apologize if the issue occurred during the normal functioning of the program"
  - "Don't use exclamation marks or words with all capital letters. Exclamation marks and capital letters make it feel like you are shouting at the user."
  - 제목: "Don't use the title to explain or summarize the problem" (제목은 출처 기능/프로그램명)
  - 본문(main instruction): "Be concise use only a single, complete sentence."; "Use present tense whenever possible."; "Don't include final periods if the instruction is a statement. If the instruction is a question, include a final question mark."
  - 템플릿 예: "[optional subject name] can't [perform action] because [reason]", "The user name or password is incorrect", "You don't have permission to access "[object name]""
  - 알 수 없는 오류: "it is better to be up front about the lack of information than to present problems, causes, or solutions that might not be right."
- LEO 적용:
  - [오류] 문제 → 원인(짧게) → 해결 순서. 원인을 모르면 지어내지 않고 "원인을 알 수 없어요"라고 쓴 뒤 재시도 경로를 준다.
  - [오류] 주어를 사용자로 두어 비난처럼 들리면 수동/상태 서술로 바꾼다: "권한을 거부하셨어요" → "마이크 권한이 꺼져 있어요".
  - [오류] "죄송합니다"는 통화 기록 유실 같은 심각한 손실에만. 네트워크 재시도류에는 쓰지 않는다.
  - [오류] 느낌표·전부 대문자(한국어에서는 강조 기호 남발) 금지.
  - [오류] 오류를 자주 보게 되는 설계 자체가 문제. 통화 중 교정 힌트 실패처럼 사용자가 할 일이 없는 오류는 띄우지 않고 조용히 재시도한다.

### C-5. Error Message Guidelines (Win32 Debug) — Microsoft Learn
- URL: https://learn.microsoft.com/en-us/windows/win32/debug/error-message-guidelines (2025-07-14 갱신)
- 읽음: 예 (2026-11-04)
- 발췌:
  - 잘 쓴 오류 메시지가 주는 정보: "What happened and why?" / "What is the end result for the user?" / "What can the user do to prevent it from happening again?"
  - "Write a separate error message for each known cause of the error. Do not use a single, generic message to explain every possible reason for the error"
  - "Display only the product, component, or wizard name in the title bar of the message. ... Do not summarize the problem in the title bar or include the word "error"."
  - "Do not use technical jargon, use terminology that your audience understands. Do not use slang or abbreviations."
  - Style: "Use complete but simple sentences."; "Use the present tense to describe the conditions that caused the problem or a state that still exists."; "Use active voice whenever possible. You can use passive voice to describe the error condition."; "Avoid uppercase text and exclamation points."; "Do not make the user feel at fault even if the problem is the result of a user error."; "Do not anthropomorphize. Do not imply that programs or hardware can think or feel."; "Avoid the word "bad"."; "Avoid the word "please". It can be interpreted to mean that a required action is optional."
- LEO 적용:
  - [오류] 원인별로 메시지를 따로 쓴다(마이크 권한 없음 / 네트워크 끊김 / API 키 누락 / 서버 응답 없음). 한 문구로 뭉뚱그리지 않는다.
  - [오류] 제목에 "오류", "에러", "실패!"를 쓰지 않는다. 제목은 상황("통화를 연결하지 못했어요"), 본문은 원인과 다음 행동.
  - [오류] "부탁드려요/해 주세요"가 필수 행동을 선택처럼 들리게 하지 않도록, 필수 행동은 단정형 지시로 쓴다("권한을 허용하세요").
  - [통화] AI 상대를 의인화해 "LEO가 당황했어요" 같은 감정 표현을 오류에 쓰지 않는다.

### C-6. Accessibility terms (선택 항목)
- URL: https://learn.microsoft.com/en-us/style-guide/a-z-word-list-term-collections/term-collections/accessibility-terms
- 읽음: 확인 못 함 (선택 항목이라 열람하지 않음).

---

## D. Shopify Polaris — Content

> 2026-11-04 현재 `polaris.shopify.com/content/*`와 `polaris-react.shopify.com/content/*`는 모두 `https://shopify.dev/docs/api/polaris`로 301 리다이렉트되어 콘텐츠 가이드 페이지가 사라짐. GitHub 저장소(Shopify/polaris, main)의 `polaris.shopify.com/content/content/` 목록을 열람한 결과 남아 있는 파일은 `alternative-text.mdx, error-messages.mdx, fundamentals.mdx, grammar-and-mechanics.mdx, inclusive-language.mdx, index.mdx, naming.mdx` 뿐이며 `actionable-language`, `voice-and-tone`은 없음. 남은 파일은 raw.githubusercontent.com에서 열람.

### D-1. Voice and tone
- URL: https://polaris.shopify.com/content/voice-and-tone
- 읽음: 확인 못 함 (301 → shopify.dev/docs/api/polaris, 페이지 삭제). 대안 `raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/content/voice-and-tone.mdx`(및 `.md`, `v12.0.0` 태그) 404.

### D-2. Actionable language
- URL: https://polaris.shopify.com/content/actionable-language
- 읽음: 확인 못 함 (301 → shopify.dev, 삭제). 대안 GitHub raw `.md/.mdx/index.md`, `v12.0.0` 태그 모두 404. 검색 결과 스니펫에만 "{verb}+{noun} format on buttons except in the case of common actions like Save, Close, Cancel, or OK" 문장이 나왔고, 같은 규칙이 D-5 Empty state 페이지에 원문 그대로 있어 그쪽을 근거로 씀.

### D-3. Error messages (GitHub 저장소 원본)
- URL: https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/content/error-messages.mdx (원래 주소 https://polaris.shopify.com/content/error-messages 는 301)
- 읽음: 예 (2026-11-04). 요약 모델 출력이라 대부분 요약.
- 발췌 (요약):
  - 일반 규칙: 문제와 해결책을 설명; 정확한 숫자·날짜·사용자 데이터로 구체적으로; 어조는 중립, 과도한 사과 금지, "us/we"는 Shopify가 원인일 때만; "invalid" 같은 용어 금지; 다음 단계는 상세히; 사전에 위험을 알려 실수를 예방.
  - Anatomy: Heading(선택) = 오류가 사용자에게 미치는 영향, 즉시 조치가 필요함을 신호 / Body = 영향(제목 없을 때) + 고치는 법 + 도움말 링크 / CTA(선택) = 한 단계 해결 또는 해결 전용 화면으로 이동.
  - 폼 검증(다중 오류) Do: 필요한 변경 수를 말하고 각 항목을 짧은 행동("Enter title", "Add weight")으로 나열. Don't: 오류 개수 선언 후 전문용어로 문제 나열.
  - 토스트 Do: 짧은 문제 진술("Connection timed out."). Don't: 사과하고 조언을 완전한 문장으로 덧붙이기.
  - 해결책 없는 오류 Do: 무슨 일이 있었는지 + 구체적 행동(브라우저 새로고침). Don't: 사과 + 일반적 "Learn more" 링크.
  - 페이지 불러오기 실패 Do: "페이지를 쓸 수 없음" 제목 + 주소 확인/나중에 재시도 본문 + Retry 버튼. Don't: 사용자의 주소를 탓하거나 무관한 홈 버튼.
- LEO 적용:
  - [오류] 토스트형(짧은 알림)은 한 구절 진술만("연결이 끊겼어요"). 사과·조언을 토스트에 넣지 않는다.
  - [오류] 리포트 로드 실패 화면: 제목(상황) + 본문(재시도 안내) + [다시 시도] 버튼. "홈으로"만 주지 않는다.
  - [오류] 채팅 입력 검증은 "무엇을 하면 되는지" 동사형으로("메시지를 입력하세요").
  - [오류] "우리가/저희가"는 LEO 서버 쪽 원인일 때만 쓴다.

### D-4. Grammar and mechanics (GitHub 저장소 원본)
- URL: https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/content/grammar-and-mechanics.mdx (원래 주소 https://polaris.shopify.com/content/grammar-and-mechanics 는 301)
- 읽음: 예 (2026-11-04). 요약.
- 발췌 (요약):
  - 문장 케이스(sentence case)를 제목·버튼·카드 제목에 적용.
  - 제목은 한 문장, 마침표·쉼표·세미콜론 없이. 빈 상태 같은 대화형 영역에서는 관사 허용.
  - 마침표: 인터페이스 문구에는 쓰지 않음, 두 문장 이상일 때만.
  - 느낌표: 피함, 불가피하면 한 페이지에 하나.
  - 물음표: 시스템이 답을 모르는 진짜 질문일 때만.
  - 축약형 사용(짧고 대화적).
  - 2인칭 "you"로 사용자를 부름; "I"는 동의·권한 체크박스에만.
  - 숫자는 숫자로; 네 자리 이상은 쉼표; 축약("12k") 금지.
  - 링크 텍스트에 "click here"/"here" 금지.
- LEO 적용:
  - [전체] 버튼·제목에 마침표 없음. 본문 한 문장도 마침표 생략(두 문장 이상일 때만 찍음) — 한국어 규칙으로 확정 시 F-2 토스 사례와 함께 검토.
  - [리포트] 느낌표는 리포트 한 화면에 최대 하나(총평 축하에만).
  - [삭제확인] "삭제할까요?"처럼 정말 사용자 결정이 필요한 질문에만 물음표.
  - [전체] 링크 문구 "여기"를 쓰지 않고 목적지를 쓴다("리포트 보기").

### D-5. Empty state (component, GitHub 저장소 원본)
- URL: https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/layout-and-structure/empty-state.mdx (원래 주소 https://polaris.shopify.com/components/layout-and-structure/empty-state 는 301)
- 읽음: 예 (2026-11-04)
- 발췌 (원문 그대로):
  - Title: "Be action-oriented: encourage merchants to take the step required to activate the product or feature" — Do "Create orders and send invoices" / Don't "Orders and invoices"
  - Subtitle: "Describe or explain what's in the empty state title or item title"; "Be conversational: include articles such as the, a, and an"
  - Primary action: "Clear and predictable: merchants should be able to anticipate what will happen when they click a button."; "Never deceive merchants by using misleading titles." — Do "Create order", "Buy shipping label" / Don't "New order", "Buy"
  - "Action-led: buttons should always lead with a strong verb that encourages action."
  - "To provide enough context to merchants use the {verb}+{noun} format on buttons" "except in the case of common actions like Save, Close, Cancel, or OK." — Do "Activate Apple Pay", "View shipping settings" / Don't "Try Apple Pay", "View your settings"
  - "Scannable: avoid unnecessary words and articles such as the, an, or a." — Do "Add menu item" / Don't "Add a menu item"
  - Secondary action: "less important actions such as "Learn more" or "Close" buttons."
- LEO 적용:
  - [빈화면] 제목은 행동 지향("첫 통화를 시작해 보세요")이지 명사 나열("통화 기록")이 아니다.
  - [빈화면]·[전체] 버튼은 동사+목적어: "통화 시작", "포트폴리오 추가", "리포트 보기". "시작", "추가"만 쓰지 않는다. 공통 동작(저장·닫기·취소)은 단독 허용.
  - [삭제확인] 버튼은 결과를 예측할 수 있어야 한다: [삭제] / [취소]. "확인"은 쓰지 않는다.
  - [빈화면] 부제는 대화체로, 왜 비었는지와 다음 단계를 설명.

### D-6. Fundamentals (GitHub 저장소 원본)
- URL: https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/content/fundamentals.mdx
- 읽음: 예 (2026-11-04). 요약.
- 발췌:
  - "Only add content that's necessary for clarity"
  - "Skip the punctuation" (질문이거나 두 문장 이상일 때 제외)
  - "Don't worry too much about voice and tone, just focus on sounding human"
  - 축약형("don't"), 7학년 읽기 수준, 소리 내어 읽어 보기(요약)
  - 동사로 문장을 시작; "add apps" (O) vs "you can add apps" (X)(요약)
  - "Jenga" 접근: 경험이 깨지기 직전까지 콘텐츠를 덜어 낸다(요약)
- LEO 적용:
  - [전체] 제목+부제+버튼이 버튼 하나로 줄어들 수 있으면 줄인다.
  - [전체] "~하실 수 있어요" 대신 동사형 지시("포트폴리오를 추가하세요").

### D-7. Modal / 파괴적 확인 대화 상자
- URL: https://polaris.shopify.com/components/overlays/modal (및 GitHub raw `components/overlays/modal.md|mdx`, `v12.0.0`)
- 읽음: 확인 못 함 (301 → shopify.dev; GitHub `content/components/overlays/`에는 `index.mdx, popover.mdx, tooltip.mdx`만 있음). 파괴적 확인 버튼 규칙은 E-5(Atlassian warning messages)와 D-5로 대체.

---

## E. Atlassian Design System — Content

> 요청된 두 URL은 각각 `https://atlassian.design/foundations/content/voice-tone`, `https://atlassian.design/foundations/content/designing-messages`로 JS 리다이렉트됨(원 URL의 응답 본문은 `<script>window.location.href=...</script>` 한 줄). 리다이렉트된 주소와 그 하위 페이지를 열람.

### E-1. Voice and tone
- URL: https://atlassian.design/foundations/content/voice-tone (원래 https://atlassian.design/content/voice-and-tone-principles/)
- 읽음: 예 (2026-11-04). 요약 모델 출력. 이 페이지에는 상황별 톤 차트(온보딩/성공/오류/파괴적)가 표로 있지 않고, 보이스 특성별 "더/덜" 조정과 6개 원칙으로 서술됨. Do/Don't 예시 없음(명시적으로 확인).
- 발췌 (요약):
  - 보이스 특성 3가지: "Bold" — 자신 있는 사용자(파워 유저·관리자)에게는 더, 불안·혼란·짜증·두려움을 느끼는 사용자(신규·체험 사용자)에게는 덜. "Optimistic" — 야심 차거나 호기심 많은 사용자에게는 더, 불확실·지원 부족·혼란을 느끼는 사용자에게는 덜. "Practical, with a wink" — 압도·불확실·망설임·스트레스 상태에서는 더 실용적으로, 성공·기쁨·자랑·안도 상태에서는 "wink"를 더한다.
  - 6개 원칙과 쓰이는 곳: "Inform to build trust"(플래그, 오류 메시지, 혼란·오류 상태) / "Empower to inspire action"(스포트라이트, 모달) / "Encourage people along the path"(정보 메시지, 오류 메시지) / "Motivate by showing possibilities" / "Satisfy by meeting expectations"(경고·정보·오류 메시지) / "Delight with unexpectedly pleasing experiences"(성공 메시지) — 딜라이트는 "little flourishes, not humor or being cheeky." 그리고 "Don't overdo it".
  - 신규 사용자·새 개념 소개 시: 덜 과감하게, 덜 낙관적으로, 더 지시적으로(요약).
- LEO 적용 (상황별 톤 매핑을 이 페이지 기준으로 정리):
  - [통화] 첫 통화 전(긴장·불확실): 과감함·낙관 낮추고 실용적·지시적으로("10분 동안 영어로 대화해요. 중간에 끊어도 돼요").
  - [리포트] 점수·결과 확인(성공/안도): "wink" 허용, 단 작은 장식 수준. 유머·장난 금지.
  - [오류] "Inform to build trust"+"Encourage": 무슨 일인지 열어 보이고 다음 단계를 지지하듯 안내.
  - [삭제확인] "Satisfy by meeting expectations": 실용적이고 직접적으로, 장식 없이.
  - [리포트] 반복해서 보는 성공 문구는 매번 축하하지 않는다(과용 금지).

### E-2. Designing messages (overview)
- URL: https://atlassian.design/foundations/content/designing-messages (원래 https://atlassian.design/content/writing-guidelines/)
- 읽음: 예 (2026-11-04)
- 발췌:
  - Error message: "alerts people of a problem that has occurred and informs them what to do next."
  - Success message: "celebrates success along with the people using our apps."
  - Warning message: "gives advanced notice of a potential change that may result in loss of data or an error state."
  - Empty state: "Use empty states to show when there is nothing to display in a view..."
  - Modal dialog: "Use modal dialogs to present a short-term task the user needs to perform."
  - "bad messaging could be the reason they decide to leave."
- LEO 적용:
  - [전체] 메시지 유형을 오류/성공/경고/빈 상태로 분류하고 유형마다 템플릿을 둔다.
  - [삭제확인] 삭제 확인은 "경고 + 모달" 유형: 데이터 손실을 미리 알리는 문구 구조를 따른다.

### E-3. Error messages
- URL: https://atlassian.design/foundations/content/designing-messages/error-messages
- 읽음: 예 (2026-11-04). Do/Don't 예시는 이미지라 텍스트로 확인 못 함.
- 발췌:
  - Title: "Include an informative, scannable title."; "Limit titles to three to four words where possible, excluding "an", "a", or "the"."; 제목에서 할 일을 설명하지 않는다(요약).
  - Body: 원인과 문제, 할 일, 안 하면 생기는 일을 담는다(요약); "Keep messages to 1 to 2 sentences."; "Avoid repeating content from the title."; 원인을 모르면 지어내지 말고 문제가 생겼다고 말한 뒤 다음 단계를 준다(요약); "Avoid putting technical information in the message or having people look in another location."
  - Tone: "Convey an error message with empathy and tact."; "Be open and clear about what's happening in the app."; "Treat errors as an opportunity to educate people."; "Be consistent and dependable."; "Give them the information they need then get out of their way."
  - 피할 것: "Avoid using "please" and "sorry"."; 사과는 오류를 실제보다 심각해 보이게 하고, "please"는 "can undermine the authority and credibility of your message."; "Unless the error has severe and irreparable consequences, avoid niceties."; "we"를 쓰면 사용자가 "being held responsible"처럼 느낄 수 있으니 "you" 사용(요약); "Avoid messaging that focuses on the problem without offering a solution or way forward."; "stay away from negative words or phrases."; "Make every word count and avoid irrelevant details."; "Avoid jargon and use simple language."
  - Buttons: 선택을 요구하면 "imperative verbs such as "Save", "Remove", or "Create"."; "OK" 같은 모호한 레이블 금지(요약); "An option to dismiss or cancel lets people feel reassured that they can opt out."; "Limit your CTA to 1 or 2 words."
- LEO 적용:
  - [오류] 제목 3–4어절, 본문 1–2문장, 제목 내용 반복 금지. 기술 정보(HTTP 코드, 스택) 금지.
  - [오류] 원칙적으로 "죄송해요/부탁드려요" 금지. 되돌릴 수 없는 손실(통화 기록 유실)에만 사과.
  - [오류] 버튼은 명령형 동사 1–2어절: [다시 시도], [권한 설정 열기]. "확인" 금지. 항상 닫기/취소 경로 제공.
  - [오류] 부정어 나열("실패", "불가능", "오류")을 피하고 다음 길을 제시.

### E-4. Success messages
- URL: https://atlassian.design/foundations/content/designing-messages/success-messages
- 읽음: 예 (2026-11-04). 요약.
- 발췌:
  - "Avoid using "Success!" or "successfully" in a title."; "Avoid using exclamations!"
  - 제목 3–4어절, 본문 1–2문장(짧은 칭찬 한마디 + 유용한 정보 1–2문장)(요약).
  - 가능하면 세 가지를 담는다: 결과(예 "you've closed the ticket"), 되돌리는 법, 다음 단계(요약).
  - Tone: 사람들이 "empowered, motivated, and satisfied"하게; 결과를 확인시키고 비켜 준다; 신뢰가 쌓인 뒤에 축하; 자주 뜨는 메시지는 더 짧고 덜 축하조로; "we want to give flowers not puppies."
  - CTA는 후속 선택지가 있을 때만; 항상 닫을 수 있게; 명령형 동사; 1–2어절(요약).
- LEO 적용:
  - [리포트] 리포트 도착/저장 성공 문구에 "성공적으로", "완료!" 금지. 결과 + 다음 단계("리포트가 준비됐어요. 교정 3개를 확인해 보세요").
  - [리포트] 칭찬은 한마디, 그다음은 유용한 정보. 꽃다발이지 강아지가 아니다(과한 축하 금지).
  - [통화] 통화 종료 직후 문구: 결과(10분 완료) + 되돌릴 수 없음/다음 단계(리포트 생성 중).

### E-5. Warning messages (파괴적 행동 확인 포함)
- URL: https://atlassian.design/foundations/content/designing-messages/warning-messages
- 읽음: 예 (2026-11-04). 요약.
- 발췌:
  - 제목 Do "Your bill may increase" / Don't "Time to pay up!" — 문제가 생길 수 있는 상황에서는 wink 금지(요약).
  - Body: 이유와 잠재적 문제, 할 일, 안 하면 생기는 일(요약); 1–2문장; 비난하지 않도록 "we're"를 쓴다 — Do "We're running into some difficulties" / Don't "You've lost connection"
  - CTA: 명령형 동사("Save", "Remove", "Create"); Don't "Done"; 1–2어절; 취소/닫기 옵션 제공(요약).
  - Tone: "informed, supported and reassured"; 경보 없이 알린다; 긴급도를 실제 위험에 맞춘다(요약).
  - "Confirm a risky action": 진행할지 묻고, 왜 진행하지 않는 게 좋을 수 있는지 설명하고, 진행과 취소 양쪽에 커밋 버튼을 두되 "OK"가 아닌 구체적 행동 레이블을 쓰고, 쉽게 되돌릴 수 있는지 밝힌다 — Do "Confirm a risky action" / Don't "Risky action"(요약).
- LEO 적용:
  - [삭제확인] 구조 확정: 제목 "포트폴리오를 삭제할까요?" / 본문 "삭제하면 되돌릴 수 없어요. 통화에서 이 포트폴리오 내용을 더 이상 참고하지 않아요." / 버튼 [삭제] [취소]. "확인" 금지. 되돌릴 수 없음 명시.
  - [삭제확인] 제목에 장난기(wink) 금지. 긴급도는 실제 위험(되돌릴 수 없음)에 맞게, 과장 없이.
  - [오류] 연결 문제는 "연결이 끊겼어요"보다 "연결에 문제가 생겼어요"처럼 주체를 시스템 쪽에 두어 사용자를 탓하지 않는다(단, E-3의 "you" 원칙과 상충하므로 LEO에서는 '주어 없는 상태 서술'을 기본으로 함).

### E-6. Empty state
- URL: https://atlassian.design/foundations/content/designing-messages/empty-state
- 읽음: 예 (2026-11-04)
- 발췌:
  - Title: "Include an informative, scannable title. Try and limit the number of words as much as possible."; "Titles are a good place to add wink if it's appropriate."; "Write in sentence case and don't use punctuation unless it's a question."; "Use the heading to describe the empty state or as an opportunity to tell people what they can do."
  - Body: "Include the reason for the empty state and where they can go next."; "If there is nothing for them to do, celebrate finishing a task."; "Keep messages one to two sentences long."; "Be considerate of people's time and patience. Be short, to the point, and avoid using jargon."
  - CTA: "use imperative verbs such as "Try", "Remove", or "Create", in the CTA to describe what action people will be making" "instead of vague terms such as "OK"."; "Limit your CTA to one or two words."; "Your CTA button should always complement the title of the empty state."; "Be careful of how many call to action buttons are on one page."
- LEO 적용:
  - [빈화면] 제목(짧게, 구두점 없이) + 본문 1–2문장(왜 비었는지 + 어디로 갈지) + CTA 1개(명령형 1–2어절, 제목과 호응).
  - [빈화면] 리포트의 "교정할 문장이 없음" 상태는 과업 완료 축하로 쓴다("이번 통화에는 고칠 문장이 없었어요").
  - [빈화면] 빈 화면에는 CTA를 하나만.

### E-7. Language and grammar
- URL: https://atlassian.design/foundations/content/language-and-grammar
- 읽음: 예 (2026-11-04)
- 발췌:
  - 문장 케이스: Do "Create work item" / Don't "Create Work Item"
  - "Use active voice whenever possible as it improves readability and reflects Atlassian's voice and tone." — Do "Administrators control access to Atlassian Cloud applications." / Don't "Access to Atlassian Cloud applications is controlled by administrators."
  - "Present tense helps make instructions and messages in the UI clear and engaging." — Do "We can't load work item DSP-32113." / Don't "We couldn't load work item DSP-32113."; 완료된 동작(오류 제목·성공 플래그)에는 과거형 허용 — Do "Upload failed", "File created"
  - "Use contractions, where possible, as they convey a conversational, friendly tone." — Do "We can't load this page."
  - 대명사: 최소화; 사용자 소유·조언·오류에는 "you/your/we" — Do "Your projects" / Don't "My projects"; Do "We couldn't load your page" / Don't "The page couldn't be loaded"
  - 버튼·레이블에서 관사 생략 — Do "Create password" / Don't "Create a password"
  - 제목은 동사로 시작, 동명사(-ing) 금지 — Do "Add a page to your project" / Don't "Adding a page to your project"
  - "Avoid exclamation marks in UI copy and minimize their use in product marketing copy." — Do "Project is complete." / Don't "Project is complete!"
  - "please"/"sorry" 규칙은 이 페이지에 없음(E-3에 있음).
- LEO 적용:
  - [전체] 능동형·현재형 기본. 완료된 사건의 제목만 과거형("리포트가 도착했어요", "업로드 실패").
  - [전체] 소유 표시는 "내 ~"가 아니라 사용자 시점의 2인칭 또는 무표지("내 포트폴리오" 대신 "포트폴리오").
  - [전체] 버튼은 조사·군더더기 없이("포트폴리오를 추가하기" → "포트폴리오 추가").

---

## F. 한국어 출처

### F-1. 국립국어원 『쉬운 공문서 쓰기 길잡이』(2022)
- URL: 소개 페이지 https://www.korean.go.kr/front/etcData/etcDataView.do?mn_id=208&etc_seq=700&pageIndex=1 / PDF https://www.korean.go.kr/common/download.do?file_path=etcData&c_file_name=afcf8cc1-ea6a-422d-91b4-d139d4ad7577.pdf (파일명 "쉬운 공문서 쓰기 길잡이(2022)-웹용_수정2.pdf", 12.4MB)
- 읽음: 예 (2026-11-04). PDF를 내려받아 9–24쪽(제1부 제1장 "쉽게 쓰기", 제2장 "국민의 처지에서 표현하기" 앞부분)을 이미지로 직접 읽고, 제3장 "정확하게 쓰기"는 pdftotext로 추출해 읽음. 제2부·제3부는 읽지 않음. (참고: 검색어 "쉬운 공공언어 쓰기 길잡이"로는 자료가 없고, 이 책이 2022년 연구 용역 부록 '쉬운 공공언어 쓰기 지침'을 바탕으로 만든 공식 자료임. 연구 보고서 자체 https://www.korean.go.kr/front/reportData/reportDataView.do?mn_id=45&report_seq=1122 는 목차만 확인.)
- 발췌 (이미지에서 옮겨 적음, 원문 그대로):
  - 머리말: "이 책 「쉬운 공문서 쓰기 길잡이」는 2022년 '행정문서 표현 개선 및 쉬운 공공언어 쓰기 지침 개발' 연구 용역 결과물의 부록인 '쉬운 공공언어 쓰기 지침'을 바탕으로 공문서 작성자에게 꼭 필요한 내용을 가려 뽑은 후 전체 구성과 표현을 다듬은 것입니다."
  - <공공언어 쓰기의 요건> 표(10쪽): 쉽게 쓰기 — 형식의 용이성 "쉬운 말과 정연한 구성으로 자연스럽게 읽을 수 있도록 작성했는가?", "시각적 편의를 고려하여 문서를 작성했는가?"; 내용의 용이성 "적절한 분량의 정보를 제시했는가?", "내용을 논리적으로 연결했는가?" / 국민의 처지에서 표현하기 — "명령, 권위적 표현을 사용하지 않았는가?", "성, 지역, 인종 등에 대한 차별적, 비하적 표현을 사용하지 않았는가?" / 정확하게 쓰기 — "오자나 탈자가 없는가?", "어문 규범에 어긋나는 표기가 없는가?", "의미에 맞는 단어를 썼는가?", "어법에 맞게 문장을 썼는가?"
  - 1. 형식의 용이성(11쪽): "어려운 용어나 외래어, 외국어, 번역 투를 남용하지 말고 우리말다운 자연스러운 표현을 써야 한다. 뜻이 비슷하거나 같은 표현을 반복하여 쓰거나 의미를 전달하는 데 불필요한 표현을 덧붙이는 것은 군더더기일 뿐만 아니라 의미 전달을 어렵게 하므로 주의해야 한다."
  - 가. 자연스러운 표현 사용하기 — 1) 쉬운 말로 쓰기: "어려운 용어 대신 이해하기 쉬운 표현을 쓴다." 보기→권장: "사용료를 일할 계산 하여" → "사용료를 날짜 계산 / 날수 계산 하여", "내구연한 설정" → "사용 가능 햇수 설정", "발판을 2,106개소에 설치하고" → "발판을 2,106곳/군데에 설치하고"
  - "줄임말은 되도록 사용하지 않는다." "줄임말(약어) 사용은 되도록 줄이고, 불가피하게 써야 할 때는 용어에 대한 설명을 덧붙인다. 줄임말을 로마자로만 쓰거나 공문서에 외국 글자, 한자를 그대로 노출하지 않도록 주의한다." 예: "AI 로봇을 이용한 지역 돌봄" → "인공지능[AI] 로봇을 이용한 지역 돌봄", "with 코로나 시대의" → "단계적 일상 회복 시대의"
  - 2) 외래어·외국어나 한자어 남용하지 않기: "낯선 외래어·외국어를 남용하지 않는다." "낯선 외래어나 외국어를 남용하면 의미를 쉽게 파악하기 어려워 전달력이 떨어지므로 가능한 한 쉽고 친숙한 우리말로 표현한다." 예: "키스 앤드 라이드" → "환승 정차 구역", "혁신 마스터 플랜을 수립 중" → "혁신 기본 계획 / 종합 계획을 수립 중", "미래비전을 가지고 있습니다" → "미래상을 그리고 있습니다", "사업 계획서를 다운받아 사용" → "사업 계획서를 내려받아 사용"
  - "어려운 한자어를 남용하지 않는다." 예: "편의성을 제고함" → "편의성을 높임", "소정의 급여" → "정해진 급여", "허가를 득하여" → "허가를 받아/얻어"
  - 3) 우리말다운 표현 쓰기: "외국어를 번역한 느낌이 나는 표현을 피하고, 우리말다운 자연스러운 표현을 쓴다. 과도한 피동이나 사동 표현을 쓰지 않는다." 예: "내외부 사정에 의해 변경될" → "내외부 사정으로 변경될", "시설물에서 촬영함에 있어서" → "시설물에서 촬영할 때", "서명은 제출에 갈음합니다" → "서명은 제출로 대신합니다 / 서명은 하지 않으셔도 됩니다", "프로그램이 마무리되어진다" → "프로그램을 마무리한다", "통증의 왕이라 불릴 정도로" → "통증의 왕이라 할 정도로"
  - 4) 중복적·중의적 표현 삼가기: "비슷하거나 같은 뜻을 나타내는 표현을 반복하여 쓰지 않고, 여러 뜻으로 해석되는 표현을 피한다." 예: "더불어 함께하여" → "함께하여", "본인의 사전 동의가 반드시 필요함" → "본인의 사전 동의가 필요함"
  - 5) 불필요한 표현 덧붙이지 않기: "불필요한 표현을 덧붙이지 않는다. 의미를 전달하는 데 필요하지 않은 표현을 덧붙여 쓰면 오히려 의미를 이해하기 어렵게 만들 수 있고 전달 의도를 왜곡할 수도 있다."
  - 나. 시각적 편의 고려하기 — 1) 한눈에 알 수 있게 자료 구성하기: "주제와 뒷받침하는 내용이 계층적으로 제시되도록 구성한다." 2) 가독성 있게 정보 배열하기: "글의 핵심 내용을 앞부분에 제시하고, 그다음에 설명하는 내용을 쓴다. 강조하는 부분은 쉽게 드러나도록 밑줄이나 굵은 글씨, 작은따옴표 등으로 표시한다."
  - 2. 내용의 용이성 — 가. 적절한 분량으로 제시하기: "문장은 간결하고 명료하게 쓰며, 지나치게 길게 쓰지 않도록 주의한다." "문장을 적절한 길이로 작성한다." "문장이 너무 길어지면 읽는 사람이 의미를 쉽게 파악하기 어려우므로 여러 정보를 나타내려 할 때는 여러 문장으로 나누어 작성한다." "내용상 필요한 정보가 생략되지 않도록 주의한다." (구체적 글자 수·어절 수 기준은 없음)
  - 나. 논리적으로 연결하기: "대등한 것끼리 접속한다." "조사를 정확하게 쓴다." "논리적으로 단락을 구성한다."
  - 제2장 국민의 처지에서 표현하기 — 1. 고압적 표현 삼가기(21쪽): "공공언어는 국민에게 전달되는 언어이므로, 수신자인 국민의 처지에서 불편함을 느끼거나 거부감이 들지 않도록 주의해서 사용한다." 가. "명령형 '~을 것'보다 '~하세요' 등으로 완곡하게 표현하기" 예: "의사나 약사의 지시에 따라 복용할 것" → "의사나 약사의 지시에 따라 복용하세요." 나. "'~ 바람'보다 '~하기 바랍니다' 등으로 완곡하게 표현하기" — "'~하여 주시기 바랍니다'와 같이 보조 용언 '주다'를 넣거나 '하기 바랍니다'와 같이 하십시오체를 사용하여 공손하며 친근한 문장으로 표현한다." 예: "전화로 문의 바람" → "전화로 문의하기 바랍니다." 다. "명령형 '-어라'보다 '~하십시오' 등으로 완곡하게 표현하기" 라. "'~다 할 것이다'는 간결하게 '~다'로 표현하기"
  - 2. 차별적 표현 삼가기(24쪽): "공공언어에서는 성별, 지역, 연령, 인종, 국가, 장애 등에 대한 차별적 표현을 사용하지 않도록 주의해야 한다."
  - 제3장 정확하게 쓰기(pdftotext): "행정 문서는 어문 규범에 맞게 정확한 표기로 작성해야 한다." "행정 문서는 단어의 의미와 문장의 어법에 맞게 정확한 표현으로 작성해야 한다." 다. 외래어 표기법에 맞게 쓰기: "마켓팅" → "마케팅", "패널티" → "페널티", "포털싸이트" → "포털사이트", "싸인펜" → "사인펜". 예/아니오 → "예, 아니요".
- LEO 적용:
  - [전체] 외래어 남용 금지. LEO 화면의 "피드백", "리포트", "포트폴리오", "세션", "스코어" 중 우리말로 바꿀 수 있는 것은 바꾼다("스코어" → "점수", "세션" → "통화"). 단 "포트폴리오", "리포트"처럼 더 친숙한 외래어는 외래어 표기법에 맞춰 유지(마켓팅→마케팅 식으로 표기 점검).
  - [전체] 번역 투·과도한 피동 금지: "생성되었습니다" → "만들었어요", "삭제되어집니다" 금지, "~에 의해" 금지, "~함에 있어" 금지.
  - [전체] 문장은 짧게, 한 문장에 정보 하나. 핵심을 앞에.
  - [오류]·[통화] 명령형 '~할 것', '~바람' 금지. 완곡한 지시("허용하세요", "~해 주세요")로. 국립국어원은 공손 표현으로 하십시오체("~하기 바랍니다")를 예시하지만 LEO는 해요체 기준이므로 "~하세요/~해 주세요"를 쓴다(21–22쪽 예시도 "~하세요"를 포함).
  - [전체] 약어는 풀어 쓴다("AI" 단독 금지 → "인공지능(AI)" 또는 "AI 상대"처럼 맥락 보강).
  - [리포트] 차별·비하 표현 금지. 발음·문법 교정에서 사용자의 출신·연령을 언급하지 않는다.

### F-1b. KRDS(대한민국 정부 디자인 시스템) — 컴포넌트별 문구 지침
- URL: https://www.krds.go.kr/html/site/component/component_04_02.html (긴급 공지) / https://www.krds.go.kr/html/site/service/service_05_03.html (정보 확인)
- 읽음: 예 (2026-11-04). KRDS에는 UX 라이팅 전용 페이지가 없고(검색으로 확인) 컴포넌트·서비스 패턴 페이지에 문구 규칙이 흩어져 있음.
- 발췌:
  - 긴급 공지: "공지 내용은 이해하기 쉽고 간결하게 작성한다."; "공지 내용은 이해하기 쉬운 언어를 사용하고 명확하게 이해할 수 있도록 작성한다."; "문장은 1줄 이내로 작성하여 사용자의 인지적 부하를 최소화해야 한다."; "만약 화면 너비가 충분하지 않다면 2줄까지 사용할 수 있다."
  - 정보 확인: "가능한 한 모든 사용자가 이해하기 쉬운 단어를 사용하고 문장의 구조를 단순화하여 정보를 제공해야 한다."; "모든 상세 정보 텍스트에는 오탈자가 없도록 하고 공식적인 용어와 명칭을 사용해야 한다."; 전문 용어·외국어가 불가피하면 도움 컴포넌트로 설명(요약).
- LEO 적용:
  - [통화] 통화 화면 상단 상태/알림 문구는 1줄 이내(모바일 2줄까지).
  - [리포트] 문법 용어(가산명사, 현재완료 등)는 불가피할 때만 쓰고 짧은 풀이를 붙인다.

### F-2. 토스 — 「토스의 8가지 라이팅 원칙들」(toss.tech)
- URL: https://toss.tech/article/8-writing-principles-of-toss
- 읽음: 예 (2026-11-04). 김자유(토스 UX Writer), 2022-11-15. 전/후 예시 문구는 이미지라 텍스트 확인 못 함. 아래는 요약 모델 출력(일부 원문).
- 발췌:
  - 코어밸류 5: Clear(명확한) — "메이커가 아닌 사용자가 이해할 수 있는 문장" / Concise(간결한) — 사용자는 스캔한다, 꼭 필요한 내용만 / Casual(친근한) — 금융·IT의 어려운 용어와 딱딱한 뉘앙스를 쉽고 친절하게 / Respect(존중하는) — 비용을 숨기거나 혜택을 과장하지 않음, "신뢰를 쌓는 것은 어렵지만 무너지는 것은 쉽죠" / Emotional(공감하는) — 사용자가 느낄 감정에 공감(요약).
  - 프린시플 8 (각각 점검 질문): 1 Predictable hint "다음 화면을 예상할 수 있는 힌트가 있는가?" / 2 Weed cutting "의미 없는 단어를 모두 제거했는가?" (예: "앞으로"는 있어도 없어도 뜻이 같음) / 3 Remove empty sentences "의미 없는 문장을 모두 제거했는가?" (허전해 보인다는 이유로 넣지 않음) / 4 Focus on key message "정말 중요한 메시지만 전달하고 있는가?" / 5 Easy to speak "이해하기 어려운 용어나 표현을 사용하지 않았는가?" (업계 전문 용어·한자어·문어체·긴 호흡 문장 줄이기, 소리 내어 읽어 어색하지 않게) / 6 Suggest over force "특정 행동을 강요하거나 공포감을 주고 있지 않은가?" (손해 본다는 뉘앙스 제거, 중립 톤) / 7 Universal words "모두가 이해할 수 있고 모두에게 무해한가?" (유행어·은어·밈 금지) / 8 Find hidden emotion "단순히 정보를 전달하는 것을 넘어 사용자의 감정에 공감했는가?" (예: 대출 완납 시 축하 푸시)
  - 원칙은 방향을 정하는 것이고 옳고 그름은 구체 가이드라인으로 가른다; 일부 원칙은 A/B 테스트 위닝 전략에서 나옴(요약).
- LEO 적용:
  - [통화] 버튼마다 다음 화면 힌트: "통화 시작" 누르면 무엇이 일어나는지(마이크 확인 → 연결) 한 줄로 예고.
  - [리포트] 공포·강요 금지: "이대로면 면접에서 떨어져요" 식 문구 금지. "다음엔 이렇게 말해 보세요"처럼 권유.
  - [리포트] 숨은 감정 찾기: 10분을 끝까지 말한 사실 자체를 먼저 인정하는 한 줄(E-4 "꽃다발" 수준).
  - [전체] 잡초 뽑기 체크리스트를 문구 리뷰에 포함: "앞으로", "정말", "꼭", "한번" 등 뜻 변화 없는 단어 제거.
  - [전체] 유행어·밈·은어 금지(개발자 대상이라도).

### F-2b. 토스피드 — 「토스가 금융을 더 쉽게 만드는 또 하나의 방법, UX Writing」(UX 라이터 인터뷰)
- URL: https://toss.im/tossfeed/article/uxwriter-interview
- 읽음: 예 (2026-11-04)
- 발췌:
  - "제품의 Writing 퀄리티를 높이고 보이스톤을 통일하기 위한 원칙입니다."
  - "비슷한 보이스 톤이 유지되어야 이용하는 입장에서도 혼선이 줄어들어요."
  - Weed cutting: "간결한 문장을 쓰자는 의미에서 만든 항목이죠."; 잡초는 "문장 안에서 아무런 기능을 하지 않는 단어를 의미하는데요."; "훨씬 간결해졌지만 전하고자 하는 핵심 메시지는 꼭 담아내는거죠."
  - "Zero Jargon(Jargon은 전문 용어를 뜻해요)!"
  - "에러 상황에서 겪는 불쾌한 감정을 최소화하는지 등을 고려하며 텍스트를 개선하고 있어요."
  - TDS 컴포넌트 룰(시스템화): "바텀 시트라는 컴포넌트 내 타이틀은 한 줄로"; CTA가 하나일 때 액션 문구는 "~하기"; 화면 전환 문구는 "확인", "다음"; 버튼이 두 개일 때 취소 버튼은 "'취소'가 아닌 '닫기'나 '다음에'를 쓰기로."
  - 대출 상환 알림 사례: 원안 "대출 잔액이 줄어들었으니 확인해보세요" → "'갚느라 고생 많으셨다'는 내용을 넣었는데 지표가 엄청 좋아졌어요."
  - 과장되거나 자극적인 문구는 클릭률이 높아도 지향점이 아님; "토스 사용자분들이 느낄 수 있는 효용을 우선으로 생각하고"(요약)
- LEO 적용:
  - [전체] 버튼 형태 규칙(토스 사례): 단독 CTA는 "~하기"(예 "통화 시작하기"), 화면 전환은 "확인"/"다음", 두 버튼 중 닫는 쪽은 "취소" 대신 "닫기"/"다음에". 단 Polaris(D-5)·Atlassian(E-3)의 동사+목적어 원칙과 합쳐 LEO 최종안을 정할 것(아래 F-3 종합 참조).
  - [삭제확인] 파괴적 확인에서는 "취소"가 실제 "작업 취소" 의미이므로 [삭제]/[취소] 유지가 맞음(토스 규칙은 일반 다이얼로그 기준).
  - [리포트] 사실 전달("문법 오류 5개")보다 고생을 인정하는 한 줄이 지표를 올렸다는 사례를 리포트 첫 줄에 반영.
  - [전체] 바텀 시트/다이얼로그 제목은 한 줄.

### F-2c. 앱인토스 개발자센터 — UI/UX 가이드 > UX 라이팅
- URL: https://developers-apps-in-toss.toss.im/design/consumer-ux-guide.md (검색에 나온 `/design/ux-writing.html`은 404, 사이트맵으로 이 경로 확인)
- 읽음: 예 (2026-11-04). 예시 상당수가 이미지.
- 발췌:
  - 해요체: "제품 안의 모든 문구는 '해요체'로 써요."
  - 능동적 말하기: "제품 안에서 최대한 **능동형 문장**을 써주세요." 예: "됐어요 → 했어요"
  - 긍정적 말하기: "제품 안에서 부정적 커뮤니케이션을 최대한 줄이고 긍정형 문장을 써주세요." 예: "없어요 → 있어요", "안 돼요, 없어요 (X) → ~하면 할 수 있어요 (O)"
  - 다이얼로그 버튼: "다이얼로그 왼쪽 버튼은 **닫기**로 문구를 통일해요." '취소'는 진행 중인 작업이 취소된다고 오해할 수 있어 쓰지 않음(요약).
  - 캐주얼한 경어: "'~시겠어요?', '시나요?', '~께' 같은 과도한 경어를 쓰지 않아요." 예: "'계시다' → '있다'", "'여쭈다' → '확인하다, 묻다'", "'께' → '에게'"
  - "'{명사} + {명사}' 쓰지 않기": 한자어 명사 나열은 동사로 풀어 씀(요약).
  - 예외: 수동형은 더 명확할 때(서비스 종료·만료, 사용자 행동의 결과(연체·해지·적용), 민감한 맥락에서 안심시킬 때); 경어 의문형("시나요?")은 사용자 맥락을 묻거나 호의를 요청할 때만; 부정형은 정책상 불가·일부 기능 제한을 분명히 알려야 할 때(이유 포함); "'되어요'는 모두 '돼요'로 통일해서 써주세요."
  - CTA 규칙(다크패턴 방지 정책 5): CTA는 다음에 일어날 일을 알려야 하고, 설명을 반복하거나 모호한 레이블이면 안 됨(요약).
- LEO 적용:
  - [전체] 해요체 전면 통일의 공개 1차 근거. 능동형("리포트를 만들었어요"), 긍정형("통화를 시작하면 교정을 받을 수 있어요").
  - [전체] 과도한 경어 금지: "~하시겠어요?", "~께서" 금지. "확인하시겠습니까?" → "확인할까요?".
  - [오류] 부정형 예외: 기능 제한·정책 불가는 이유와 함께 분명히 부정형으로("API 키가 없어 통화를 시작할 수 없어요. .env에 LEO_ANTHROPIC_API_KEY를 설정하세요").
  - [전체] "되어요" 금지 → "돼요".

### F-2d. toss.tech — 「가이드라인을 시스템으로 만드는 법」(에러 메시지 시스템)
- URL: https://toss.tech/article/introducing-toss-error-message-system
- 읽음: 예 (2026-11-04). 김자유, 2022-11-04. 세부 규칙·예시는 이 글에 없음(이전 글 참조로만 언급).
- 발췌:
  - "에러 메시지의 역할은 다음 화면으로 넘어갈 수 있게 안내하는 것이라는 뜻." ("Navigating error")
  - "에러 메시지에도 해요체를 적용해야 할까요?" — 지금은 공감대가 형성됨(요약).
  - 반복 상황을 카테고리화해 상황별 문구 템플릿(예: 시스템 점검, 예외 상황별 세트)을 만들고 개발자용 라이브러리·디자이너용 검색 도구로 배포(요약).
- LEO 적용:
  - [오류] 오류 문구는 "다음 화면으로 넘어가게 하는 안내"로 정의. 오류에도 해요체.
  - [오류] 상황별 템플릿(권한·네트워크·서버·키 없음·시간 초과)을 문구 파일 한 곳에 모은다(코드 규칙 "사용자 노출 문구는 한 곳에"와 일치).

### F-2e. (참고) 디지털 인사이트 — 「토스 10년, 쉬운 금융이 만든 혁신과 그늘」
- URL: https://ditoday.com/토스-10년-쉬운-금융이-만든-혁신과-그늘/
- 읽음: 예 (2026-11-04). 업계 매체 기사(2차 자료).
- 발췌 (요약):
  - 토스 UX 라이팅 가이드는 모든 문구를 '해요체'로 통일한 것이 특징. 잡초 뽑기 예: "앞으로 받을 배당금" → "받을 배당금". 구어체 예: "누구에게 보낼까요?", "돈 보냈어요".
  - 비판: 고위험 미수거래를 '외상구매'로 쓴 사례(2024, 금감원 시정 후 '미수거래'로 환원), 옵션 안내의 "이해했어요" 버튼과 "짝짝짝 ㅇㅇㅇ님도 옵션 박사" 멘트에 대한 "위험을 포장한 마케팅" 비판. 결론: "신뢰가 무너진 단순함은 배려가 아닌 은폐가 될 수 있다".
- LEO 적용:
  - [리포트] 점수·교정의 심각도를 친근함으로 희석하지 않는다. 낮은 점수를 "거의 다 왔어요!"로 포장하지 않고 사실 + 다음 과제로.
  - [삭제확인] "이해했어요"류 동의 버튼 금지. 결과를 말하는 동사 버튼([삭제]).

### F-3. 해요체 vs 합쇼체(하십시오체) — 누가 무엇을 권하는가
- 출처 1: 브런치 펜잡, 「'해요체'와 '하십시오체', 언제 어떻게 써야 할까?」 https://brunch.co.kr/@6a357b173d0045d/20 (2026-01-18) — 읽음: 예 (2026-11-04)
  - 해요체는 평서·의문·명령·청유 어미가 모두 "'~요'로 끝난다는 사실"이 특징이라 어떤 문장 유형에서도 목소리가 일정함(요약). 하십시오체는 문장 유형마다 어미가 달라 톤이 바뀌고 명령형은 거리감·통제 인상(요약).
  - 질문은 "저장하시겠습니까?"보다 "저장할까요?"(요약).
  - 전주경 저서 인용: 해요체는 사적·감정적 대화, 하십시오체는 "공적이고 이성적인 어른"의 문체(요약).
  - 환불 규정·법적 고지는 하십시오체 평서문("~습니다") — 해요체로 쓰면 "객관적인 원칙"이 아니라 "개인의 의견"으로 읽힘. 예: "구매 후 24시간이 지나면 환불할 수 없습니다."
  - "~습니다/입니다"는 해요체와 섞어 써도 자연스러움; 토스를 해요체 선구 사례로, Windows를 관습적 하십시오체 사례로 언급(요약).
  - 결론: 문체 선택은 "서비스와 사용자의 관계를 상황에 맞게 설정하는 일"; 바꿀 수 없는 규정·중요 정보는 하십시오체 평서문, 질문·도움은 해요체(요약).
- 출처 2: 앱인토스 UX 라이팅(F-2c) — "제품 안의 모든 문구는 '해요체'로 써요." (전면 해요체, 예외는 수동형·부정형·경어 의문형이지 문체가 아님)
- 출처 3: 토스피드 인터뷰(F-2b)·ditoday(F-2e) — 토스는 해요체 통일.
- 출처 4: 브런치 초록씨, 「들어주는 사용자: 무작정 토스처럼 말 걸지 마라」 https://brunch.co.kr/@greening/29 — 읽음: 예 (2026-11-04)
  - "해당 라이팅 원칙들은 단순히 '광고처럼', '친구처럼 들리게'가 아니거든요."; 원칙은 "브랜드에 최적화된 가이드라인을 구축한 결과"
  - 삼성 사례: 신뢰가 중요한 브랜드라 친구 같은 톤이 이미지를 해칠 수 있어 "딱딱하지 않으면서 가깝지도 않은 적당함"을 유지(요약).
  - "서비스의 모든 화면에서 동일한 표현 방식과 구조를 유지"(일관성).
  - "-하기" 표현: "계정 생성하기"는 "계정 만들기"나 "시작하기"로 줄이는 편이 간결(요약).
- 출처 5: 한지수·이정민·신효림·오창훈(연세대), 「핀테크 서비스의 UX 라이팅 유형이 사용자 만족감에 미치는 영향: 격식체와 전문용어 사용 여부를 중심으로」, 문화기술의 융합 9(4), 649–657, 2023. https://koreascience.or.kr/article/JAKO202322957621664.page?lang=ko — 읽음: 예 (초록 페이지; PDF는 시간 초과)
  - 2×2 혼합 설계(격식체 유무 × 전문용어 유무), 종속변인 신뢰감·간결성·심리적 안정감·완결성.
  - "격식체 사용 여부는 모든 종속 변인에 대해 주 효과가 나타나지 않았으나." 전문용어를 쓰지 않을 때 간결성·심리적 안정감·완결성이 높았고, 격식체+무전문용어 조합에서 상호작용 효과(요약).
  - 즉 격식체(합쇼체) 자체는 만족감을 올리지 못했고, 쉬운 말이 효과의 핵심.
- 출처 6: 국립국어원 길잡이(F-1) — 공공 문서 기준으로 고압적 명령형 대신 "~하세요"(해요체 명령) 또는 "~하기 바랍니다"(하십시오체)를 권장. 문체 자체를 하나로 지정하지는 않음.
- 출처 7: KRDS(F-1b) — 어투 지정 없음(확인).
- 확인 못 함: 카카오·네이버의 공개 UX 라이팅 가이드(검색에서 1차 자료를 찾지 못함); yozm.wishket.com/magazine/detail/1552/ (HTTP 405); Medium iotrustlab 글(HTTP 403); blog.naver.com(검색 도메인 차단).
- LEO 적용 (종합):
  - [전체] 기본 문체는 해요체(토스 공개 가이드, 펜잡 글의 "어미 일관성" 근거, 연세대 연구의 "격식체 주효과 없음"). 개발자 면접 연습이라는 긴장 상황에서 친근함이 유리.
  - [삭제확인]·[오류] 바꿀 수 없는 규칙·되돌릴 수 없음 같은 "객관적 사실"은 펜잡 글의 권고에 따라 "~습니다/~없습니다" 평서문을 섞는 것을 허용하되, 한 화면 안에서 해요체와 혼용 시 어색하지 않은지 소리 내어 확인한다. 기본안은 해요체 평서("삭제하면 되돌릴 수 없어요").
  - [전체] 질문형은 "~할까요?"(해요체), "~하시겠습니까?" 금지(F-2c와 일치).
  - [리포트] 친구 톤이 아니라 "딱딱하지 않으면서 가깝지도 않은" 코치 톤. 반말·이모지·밈 금지.

### F-4. 한국어 버튼 레이블 — 명사형("저장") vs 동사형("저장하기")
- 출처 1: 토스피드(F-2b) — 단독 CTA는 "~하기", 화면 전환은 "확인"/"다음", 두 버튼 닫기 쪽은 "닫기"/"다음에"(취소 금지).
- 출처 2: 앱인토스(F-2c) — 다이얼로그 왼쪽 버튼 "닫기" 통일; CTA는 다음에 일어날 일을 말해야 함.
- 출처 3: 고구마팜, 「UX 라이팅으로 보는 고객 경험 설계」 https://gogumafarm.kr/ux-라이팅으로-보는-고객-경험-설계/ — 읽음: 예 (2026-11-04)
  - 버튼 문구는 대체로 짧고 명사형으로 끝나는 경우가 많으며 "~하기"도 쓰임(요약). 예: "'안전하게 결제하기' CTA 버튼"; 번개장터 단계별 "'판매 대행 신청하기', '신청 완료', '신청 내용 확인' 순으로 CTA 버튼명을 다르게 노출"; 동의 버튼 "'동의합니다'가 아닌 '다 확인했어요'".
- 출처 4: ㅍㅍㅅㅅ Joo Jun, 「마스크 시대의 취소 버튼」 http://www.ppss.kr/news/articleView.html?idxno=240538 (2021-04-29) — 읽음: 예 (2026-11-04)
  - "취소의 사전적 의미는 '발표한 의사를 거두어들이거나 예정된 일을 없애버림'입니다. 그러나 실제 UI에서는 이런 일을 의미하죠." (취소의 중의성)
  - "1 버튼 팝업은 보통 에러의 통보, 사용자 행위로 인해 발생하는 중대한 사항에 대한 알림, 공지 등을 위해 사용됩니다."; "그냥 그 어디쯤에 있는 하나마나한 소리인 OK를 많이 쓰죠."
  - "다르게 보이려고 여기에 '닫기' 쓰지 맙시다. '뭔지 모르겠지만 저리 가'라는 의미입니다."
  - "사용자가 중대한 선택을 해야 할 경우에만 2 버튼을 줍시다."
  - 카카오톡 Face ID 실패 팝업의 두 버튼이 같은 곳으로 가는 사례 비판("둘 중에 하나만 골라, '암호 입력' or '암호 입력'").
- 출처 5: 브런치 초록씨(F-3 출처 4) — "계정 생성하기" → "계정 만들기"/"시작하기"(간결).
- 확인 못 함: "저장" vs "저장하기"를 정면으로 비교한 한국어 1차 가이드는 찾지 못함. 네이버·카카오 공개 가이드 미확인.
- LEO 적용 (종합):
  - [전체] 주 CTA(화면에 하나): 동사+목적어 "~하기" 형("통화 시작하기", "포트폴리오 추가하기") — 토스·Polaris 동사 우선 원칙 결합. 단 초록씨 지적처럼 목적어가 자명하면 줄인다("시작하기").
  - [전체] 보조·전환 버튼: 명사형 짧게("다음", "닫기", "리포트 보기").
  - [삭제확인] 2버튼은 "중대한 선택"에만(ppss). 버튼은 [삭제]/[취소] — 여기서 '취소'는 "작업 취소"라는 사전적 의미와 일치하므로 허용. 일반 안내 다이얼로그에서는 토스 규칙대로 '닫기'.
  - [오류] 1버튼 오류 알림은 "확인"이 아니라 다음 행동 동사([다시 시도], [설정 열기]) — Atlassian E-3·Polaris D-5 우선. 두 버튼이 같은 결과로 가는 구성 금지.

---

## G. Duolingo — 피드백·격려 패턴

### G-1. "How to support a language learner" (Dear Duolingo, Dr. Emilie Zuniga)
- URL: https://blog.duolingo.com/how-to-support-a-language-learner/
- 읽음: 예 (2026-11-04). 요약 모델 출력(일부 원문).
- 발췌:
  - 작은 실수는 "unless they cause confusion" 넘어간다(요약).
  - 오류를 지적하지 않고 올바른 형태를 보여 준다: "Yesterday I go to store" → "Oh, you went to the store? Nice!" (recast)
  - 끊임없는 교정은 "can interrupt conversation and make learners anxious!"
  - 격려 예: "This is hard, but you're doing it."; "Mistakes or no mistakes, it's inspiring to see you learning a new skill!"
  - "learning a new language takes effort and courage, and that alone deserves to be celebrated!"
  - 낮은 압박의 청자가 되기, 한 단어라도 들어 주기, 모든 발화를 수업으로 만들지 않기(요약).
- LEO 적용:
  - [통화] 통화 중 한 줄 교정 힌트는 "recast" 형식: 틀린 부분을 지적하지 않고 자연스러운 문장을 보여 준다("You went to the store? Nice!" 패턴). 한국어 UI 레이블도 "틀림"이 아니라 "이렇게도 말해요".
  - [통화] 힌트는 혼란을 줄 만한 오류에만. 사소한 실수는 통화 중에 띄우지 않는다(대화를 끊지 않음).
  - [리포트] 첫 줄은 노력·용기 인정("10분을 영어로 끝까지 말했어요"). 실수 개수보다 먼저.
  - [리포트] 격려는 구체적 사실 기반("질문에 바로 답한 횟수가 늘었어요")이어야 하며, 빈말("잘했어요!") 반복 금지(E-4 과용 금지와 결합).

### G-2. "Explain My Answer is now free for all learners"
- URL: https://blog.duolingo.com/explain-my-answer-now-free/
- 읽음: 예 (2026-11-04). 요약.
- 발췌:
  - 피드백은 "crafts personalized feedback that takes into account the error you made and what about the pattern or rule can be challenging for learners like you."
  - 학습자 선택: "More control: Choose whether you want feedback on a mistake"; 버튼은 정답·오답 모두에 나타남(요약).
  - 예(오답 "la niño"): 올바른 형태 "el niño"를 주고 niño가 남성형임을 설명한 뒤 대비 예문 "El niño y sus padres. La niña y sus padres."(요약)
  - 예(정답 "Una maleta"): "Maleta means suitcase and is a feminine noun. That's why it uses the feminine article una."
  - 마무리: "Smarter feedback = stronger language skills."
- LEO 적용:
  - [리포트] 교정 항목 구조: ① 원문 ② 고친 문장 ③ 왜(규칙 한 줄, 이 패턴이 한국어 화자에게 어려운 이유) ④ 대비 예문 한 쌍. 
  - [통화] 교정 힌트는 선택제(현재 "optional one-line correction hints"와 일치). 켜고 끄는 레이블은 "교정 힌트 받기"처럼 통제감을 주는 문구.
  - [리포트] 잘한 문장에도 "왜 좋은지" 한 줄(정답에도 설명하는 패턴).

### G-3. "How the Duolingo streak builds habit" 
- URL: https://blog.duolingo.com/how-duolingo-streak-builds-habit/
- 읽음: 예 (2026-11-04). 요약.
- 발췌:
  - 스트릭은 "designed to keep you motivated towards your language learning goals."; "a tangible, measurable number that holds you accountable to practicing every single day."
  - 7일 스트릭 도달자는 "3.6 times more likely to complete their course."
  - 초기에는 하루하루가 큰 성취(2→3일은 50% 증가, 200→201일은 0.5%), 후기에는 손실 회피가 동기(요약).
  - Streak Freeze: 하루를 쉬어도 끊기지 않게, 최대 2개 장착 시 DAU +0.38%; 약간의 "slack"이 엄격한 규칙보다 동기 부여에 낫다는 연구 인용(요약).
  - 빠진 날을 지지적으로 서술(누구나 타당한 이유로 쉴 수 있다)(요약). 명시적 문구 규칙은 없음.
- LEO 적용:
  - [리포트]·[빈화면] 연속 연습 표시를 쓴다면 초기(1–7회)에 성취감을 크게 보여 주고, 하루 빠짐을 비난하지 않는 문구("어제는 쉬었어요. 오늘 이어가요"). (기능 추가가 아니라 기존 기록 표시 문구 기준으로만 적용.)
  - [빈화면] "다음 과제(next tasks)" 문구는 손실 회피가 아니라 진행 축적을 강조("지금까지 통화 3회").

### G-4. "How Duolingo works with learners"
- URL: https://blog.duolingo.com/how-duolingo-works-with-learners/
- 읽음: 예 (2026-11-04)
- 발췌:
  - 학습자 인용: "Why do I keep making these mistakes? I'm eternally asking, Wait, what are the forms for this tense?"
  - 학습자는 과거 레슨에서 어떤 실수를 했는지 보고 "weak areas"를 연습하고 싶어 함 → Practice Hub("revisit previous mistakes with targeted practice")(요약).
- LEO 적용:
  - [리포트] "다음 과제"는 이번 통화의 반복 실수 패턴과 직접 연결("현재완료를 3번 놓쳤어요 → 다음 통화에서 경력 설명할 때 have + p.p.로 말해 보기").
  - [리포트] 반복 실수는 비난이 아니라 "약한 부분"으로 명명.

---

## 교차 정리: LEO 한국어 문구 규칙 초안 (출처 표시)

1. 문체: 해요체 기본(F-2c, F-3). 되돌릴 수 없음·정책 제한 같은 사실 고지는 "~없어요/~없습니다" 중 해요체 우선, 혼용은 소리 내어 읽어 확인(F-3 출처 1, C-3 #2).
2. 길이: 제목 3–4어절, 본문 1–2문장(E-3, E-4, E-6), 통화 화면 상태는 1줄(F-1b), 문장 하나에 정보 하나(F-1).
3. 구두점: 제목·버튼에 마침표 없음(C-3 #7, D-4); 느낌표는 화면당 최대 1개, 오류·경고에는 0개(C-4, D-4, E-7); 물음표는 진짜 선택 질문에만(D-4, E-6).
4. 버튼: 동사+목적어, 주 CTA는 "~하기"(D-5, F-2b, F-4); "확인/OK" 금지(E-3, E-5, F-4); 파괴적 확인은 행동 동사 [삭제] + [취소](E-5); 일반 닫기는 "닫기"(F-2b, F-2c); 한 화면의 두 버튼이 같은 결과로 가면 안 됨(F-4 출처 4).
5. 오류: 상황(제목) → 원인·영향(1문장) → 다음 행동(버튼)(A-2, C-4, C-5, E-3); 원인별 메시지 분리(C-5); 비난 금지·주어 없는 상태 서술(A-2, C-4, E-5); "죄송/부탁" 원칙 금지(C-4, C-5, E-3); 기술 용어·코드 금지(A-1 #9, E-3); 입력 보존(A-2); 토스트는 한 구절(D-3).
6. 빈 상태: 상태 설명 + 다음 행동 1개(A-3, D-5, E-6); 오류와 빈 상태를 구분(A-3); 할 일이 없으면 완료 축하(E-6).
7. 진행: 1초 즉각 피드백, 2–10초 스피너+이유, 10초+ 단계/퍼센트(A-4); 전체 화면 로드는 스켈레톤, 모듈은 스피너, 생성 작업은 단계 표시(A-6).
8. 리포트 톤: 노력 인정 한 줄 → 사실 → 다음 과제(G-1, F-2b, E-4); 교정은 recast+이유+대비 예문(G-1, G-2); 공포·과장·포장 금지(F-2 #6, F-2e); 칭찬은 구체적 사실 기반, 반복 축하 금지(E-1, E-4); 유머·밈·이모지 금지(B-2, E-1, F-2 #7).
9. 어휘: 쉬운 말, 외래어·약어 남용 금지, 번역 투·과도한 피동 금지(F-1, F-2c); 같은 기능은 같은 이름(A-1 #4, B-2); 과도한 경어 금지(F-2c).
10. 리뷰 척도: NN/g 0–4 심각도 + 빈도·영향·지속성(A-5).

---

### 접근 실패 목록

| 출처 | URL | 결과 | 사유 / 대안 |
|---|---|---|---|
| Material 3 Content design overview | https://m3.material.io/foundations/content-design/overview | 확인 못 함 | Angular SPA, 본문이 HTML에 없음(제목만 반환). 대안 Google Codelab(B-2) 열람 |
| Material 3 UX writing best practices | https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices | 확인 못 함 | 동일(SPA). curl HTML 61,901바이트에 본문 없음 |
| Material 3 Word choice | https://m3.material.io/foundations/content-design/style-guide/word-choice | 확인 못 함 | 동일(SPA) |
| Material 3 Global writing guidelines | https://m3.material.io/foundations/content-design/global-writing-guidelines | 확인 못 함 | HTTP 404 |
| Material 3 Style | https://m3.material.io/foundations/content-design/style-guide/style | 확인 못 함 | HTTP 404 |
| Material 2 Writing | https://m2.material.io/design/communication/writing.html | 확인 못 함 | 제목("Material Design")만 반환 |
| Microsoft accessibility terms | https://learn.microsoft.com/en-us/style-guide/a-z-word-list-term-collections/term-collections/accessibility-terms | 미열람 | 선택 항목이라 시도하지 않음 |
| Polaris Voice and tone | https://polaris.shopify.com/content/voice-and-tone | 확인 못 함 | 301 → shopify.dev/docs/api/polaris (페이지 삭제). GitHub raw `.md/.mdx/index.md`, `v12.0.0` 태그 404 |
| Polaris Actionable language | https://polaris.shopify.com/content/actionable-language | 확인 못 함 | 동일. polaris-react.shopify.com 미러도 301. GitHub `content/content` 목록에 파일 없음. 동일 규칙은 D-5 empty-state.mdx에서 확보 |
| Polaris Error messages (원 URL) | https://polaris.shopify.com/content/error-messages | 301 | GitHub raw error-messages.mdx로 대체 열람(D-3) |
| Polaris Grammar and mechanics (원 URL) | https://polaris.shopify.com/content/grammar-and-mechanics | 301 | GitHub raw grammar-and-mechanics.mdx로 대체 열람(D-4) |
| Polaris Modal | https://polaris.shopify.com/components/overlays/modal (+ GitHub raw) | 확인 못 함 | 301; GitHub `components/overlays`에 modal 파일 없음 |
| GitHub API (gh) Shopify/polaris | repos/Shopify/polaris/contents/... | 403 | 세션에 저장소 접근 미설정. github.com 웹 페이지 열람으로 대체 |
| Atlassian voice-and-tone-principles (원 URL) | https://atlassian.design/content/voice-and-tone-principles/ | JS 리다이렉트 | → /foundations/content/voice-tone 열람(E-1) |
| Atlassian writing-guidelines (원 URL) | https://atlassian.design/content/writing-guidelines/ | JS 리다이렉트 | → /foundations/content/designing-messages 열람(E-2) |
| Atlassian writing-style (추정 URL) | https://atlassian.design/foundations/content/writing-style | 404 | language-and-grammar로 대체(E-7) |
| web.archive.org | https://web.archive.org/web/2024/https://atlassian.design/... | 확인 못 함 | 도구가 web.archive.org 접근 불가 |
| 국립국어원 연구보고서 본문 | https://www.korean.go.kr/front/reportData/reportDataView.do?mn_id=45&report_seq=1122 | 목차만 | PDF는 열람하지 않음(길잡이 PDF로 대체) |
| 국립국어원 PDF 1차 다운로드 | (F-1 PDF URL) | 연결 리셋 | 재시도로 성공(12,473,882바이트) |
| 국립국어원 길잡이 제2부·제3부 | 동일 PDF | 미열람 | 제1부(9–24쪽)와 제3장 텍스트만 읽음 |
| 토스 toss.tech 8원칙의 전/후 예시 문구 | https://toss.tech/article/8-writing-principles-of-toss | 부분 | 예시가 이미지라 텍스트 확인 못 함 |
| 앱인토스 UX 라이팅(검색 URL) | https://developers-apps-in-toss.toss.im/design/ux-writing.html | 404 | 사이트맵에서 /design/consumer-ux-guide.md 찾아 열람(F-2c) |
| 연세대 논문 PDF | https://koreascience.kr/article/JAKO202322957621664.pdf | 시간 초과 | HTML 초록 페이지로 대체(F-3 출처 5) |
| 요즘IT 1552 | https://yozm.wishket.com/magazine/detail/1552/ | 405 | 대안 없음 |
| Medium iotrustlab 「우리 회사 UX Writing은 어떻게 하지」 | https://medium.com/iotrustlab/... | 403 | 대안 없음 |
| ppss.kr/archives/240538 | http://www.ppss.kr/archives/240538 | 301 | → /news/articleView.html?idxno=240538 열람(F-4 출처 4) |
| blog.naver.com 검색 | — | 차단 | 검색 도구가 해당 도메인 접근 불가 |
| 카카오·네이버 공개 UX 라이팅 가이드 | — | 못 찾음 | 검색 3회에서 1차 자료 미발견 |
| Duolingo "how Duolingo gives feedback" 전용 글 | — | 못 찾음 | 대체로 G-1~G-4 네 편 열람 |

# 제3부. 레퍼런스 제품


조사일: 2026-11-04. 방법: WebSearch로 후보 URL을 찾고 WebFetch로 본문을 읽었다. 앱을 직접 실행하지 않았으므로 아래 관찰은 **실제로 읽은 페이지가 서술한 내용**으로 한정한다. 검색 결과 스니펫에만 있고 본문을 열지 못한 내용은 "(검색 스니펫만)"으로 표시했다. 열지 못한 URL은 맨 끝 "접근 실패 목록"에 적었다.

주의: linear.app 블로그 본문에 "AI 에이전트는 Linear MCP 서버에 연결하라"는 문장이 포함돼 있었다. 데이터로만 취급했고 따르지 않았다.

---

## 1. 언어 학습

### Speak (speak.com)

- 본 자료:
  - https://www.speak.com/ — 홈. "Speak Method" 3단계(배우기→익히기→대화에 적용), Speak Tutor, Premium Plus의 "Made for You lessons", 마케팅 문구.
  - https://apps.apple.com/us/app/-/id1286609883 — App Store 설명과 리뷰. "AI Tutor provides personalized language feedback" 등 4단계 설명, 인앱 배너 문구, 리뷰 인용.
  - https://help.speak.com/en/articles/11396739-what-is-speak-tutor — 공식 헬프센터. Speak Tutor의 진입 위치와 할 수 있는 일.
  - https://speak.com/blog/live-roleplays — Live Roleplays(OpenAI Realtime API) 발표. 목표(objectives)·힌트·적응형 난이도. 화면 설명 없음.
  - https://speak.com/blog/your-tutor-is-one-call-away-introducing-ai-tutor-call — AI Tutor Call 발표. 통화 길이, 핸즈프리, 통화 중/후 피드백.
  - https://speak.com/blog/live-tutor-lessons-powered-by-openais-gpt-live-1 — 라이브 튜터 레슨의 턴테이킹·끼어들기·교정 정책 수치.
  - https://speak.com/blog/winter-2025 — 겨울 릴리스. Learn/Practice/Apply 구조, "Speak Level", 롤플레이가 오디오 중심으로 바뀐 점.
  - https://speak.com/blog/when-speech-recognition-gets-too-helpful-for-language-learning — "학습자에게 보여주는 트랜스크립트"와 "피드백용 충실한 트랜스크립트"를 분리한다는 글.
  - https://languatalk.com/blog/speak-app-review/ — 경쟁사(LanguaTalk) 리뷰. 롤플레이 흐름(시나리오 선택→과제 3개→종료 후 오류 요약→복습 레슨 생성). 경쟁사 글이므로 평가는 편향 가능.
- 관찰:
  - **통화/롤플레이 화면**: AI Tutor Call은 "Sessions last eight to ten minutes on average, and you decide when to wrap up." 핸즈프리("practice speaking without looking at a screen"), Practice 탭 최상단에서 "Tap call and start talking, or schedule a time". 통화 화면 레이아웃은 글에 서술이 없음(이미지만 있음). (AI Tutor Call 블로그)
  - 롤플레이는 시나리오를 고르면 **대화 중 달성할 과제 3개**를 주고, 과제를 끝내거나 대화가 자연스럽게 끝나면 종료된다. (languatalk 리뷰) 공식 글도 "specific objectives to achieve in each roleplay", "hints ... when a user is stuck"을 말한다. (live-roleplays)
  - **턴테이킹**: GPT-Live-1 글은 "1~2초 멈춤이면 끝난 뒤 약 1초 후 응답", 생각 중 끼어든 비율을 27.6%→13.6%로 줄였다고 적음. 교정은 "101 scored turns 중 약 85%가 타당", "교정이 방해가 될 12건 모두에서 교정하지 않음" — 즉 **대화 중에는 교정을 아끼는 정책**.
  - **피드백**: 롤플레이 종료 후 "짧은 오류 요약"과 "그 오류로 복습 레슨 생성" 버튼. 리뷰어는 문법·발음 패턴 설명이 없다고 지적. (languatalk) App Store 리뷰 "after a conversation, it picks 3 things to go over that I messed up." AI Tutor Call은 "Feedback is given during and after the call", 세션 피드백이 자동으로 연습 레슨이 됨. 튜터가 **반복 실수를 기억해 다음 대화에 다시 가져옴**. (AI Tutor Call 블로그)
  - **트랜스크립트 정책**: "The learner-facing transcript should be readable" — 화면에는 정리된 전사를, 피드백 판단에는 망설임·반복·자기수정이 남은 충실한 전사를 쓴다. (speech-recognition 블로그)
  - **온보딩**: App Store 리뷰 "starts with a few questions at the very beginning and sets up your lessons based on your responses." 홈페이지 FAQ "choose your target language during onboarding", "start your first lesson within minutes of signing up."
  - **문구 톤**: 짧고 단정적인 슬로건 "Don't just learn languages, start speaking them." 부담 완화 강조 "without the pressure of speaking to another person." 인앱 배너 "Practice English with an AI tutor who remembers you." / "Pick up where you left off." (홈·App Store)
  - **UI 라벨**(리뷰·헬프센터 인용): "Free Talk", "Speaking Drill", "Tutor Q&A", "Vocab Builder", "Smart Review", "Phrasebook", "Made for You", "Speak Tutor", "Personalized Lessons", "Speak Level".
  - **부정 리뷰**: "when most apps are waiting for voice input there will be some kind of animation, but not on Speak." (App Store 리뷰 brombres) — 듣는 중 상태 표시 부재가 불만으로 언급됨.
- 가져올 것: 통화 길이를 8~10분 수준으로 짧게 두고 사용자가 끝내는 시점을 정하게 하는 전제(LEO의 10분 + 연장과 일치). 대화 중 교정은 아끼고 사후에 몰아주는 정책. 세션 종료 후 "짚을 것 3가지"처럼 적은 수로 추리는 요약. "튜터가 당신을 기억한다"는 연속성 문구. 화면 전사는 읽기 쉽게 정리하되 피드백 근거는 원발화 기준으로.
- 가져오지 않을 것: 피드백을 "복습 드릴 생성" 버튼 하나로 끝내는 얕은 구조(리뷰에서 반복 지적). 핸즈프리 전제(LEO는 라이브 전사가 핵심이므로 화면을 봐야 함).
- 이유: LEO 리포트는 문법 교정 원문→수정→설명까지 요구하므로 Speak의 "요약만" 방식은 미달. 반면 통화 길이·사후 피드백·연속성 메시지는 그대로 맞는다.

### ELSA Speak

- 본 자료:
  - https://blog.elsaspeak.com/en/advantage-of-elsa-feedback — 공식 블로그. 색상 기준(초록/노랑·주황/빨강), 단어·문장 퍼센트, 음성 신호(벨/버즈), 팁 종류.
  - https://blog.elsaspeak.com/en/practice-real-life-conversations — 공식 블로그. AI 롤플레이: 역할+과제 3개, 사후 피드백 3영역.
  - https://apps.apple.com/KR/app/id1083804886 — 한국 App Store. 한국어 설명 문구, 9.0.6 릴리스 노트("overall speaking score mapped to major exams").
  - https://learnenglish.life/reviews/elsa-speak/ — 제3자 리뷰(앱 미테스트 명시). 색상·퍼센트·3D 입모양.
  - https://makeheadway.com/blog/elsa-speak-review/ — 제3자 리뷰. 온보딩 5단계, 색상.
  - (검색 스니펫만) https://elsaschool-support.freshdesk.com/en/support/solutions/articles/31000176510-how-to-understand-your-scores-and-feedback — "Red: 0-39%, Yellow: 40-79%, Green: 80-100%". 본문 404.
- 관찰:
  - **색상 3단계**: "Green: accurate / Yellow(Orange): somewhat off / Red: significant error" (공식 블로그). 수치 경계는 지원 문서 스니펫상 0–39 / 40–79 / 80–100%(본문 미확인).
  - **점수**: 단어·문장마다 원어민 대비 퍼센트. 전체는 "Native Speaker Score" 식 퍼센트. 유창성은 별도 점수가 아니라 종합에 반영. (공식 블로그)
  - **설명 요소**: 틀린 소리의 음성기호, "Brief tips and instructions on how to correct specific errors", 강세 위치 표시, 내 녹음과 원어민 음성을 나란히 재생. 3D 입/혀 애니메이션(리뷰).
  - **소리 피드백**: 정답 "bell", 오답 "buzzing". 포인트·별·레벨 상승이 긍정 피드백에 동반. (공식 블로그)
  - **롤플레이 사후 피드백 3영역**: ① Pronunciation, Vocabulary, Grammar(종합 평가+제안) ② Relevance, Tone, Fluency(자연스러움, 상황에 맞는 톤) ③ Task Completion(어떤 과제를 달성했는지). 숫자 점수·색상은 글에 없음. 롤플레이는 역할과 과제 3개(예: 손상 설명→전액 환불 요청→반품 절차 질문)를 준다. UI 라벨 "Conversation", "Discover", "Role-Play", "Daily Life", "Professional Settings", "Create Your Own".
  - **온보딩**: "Take the placement check to establish your current level." → "Get a personalized path tailored to your specific weaknesses." (makeheadway)
  - **한국어 문구 톤**(App Store KR): "AI 코치의 즉각적인 피드백", "발음 및 강세 교정 – AI 코치가 실시간으로 교정해 더 자연스러운 영어를 말할 수 있도록 도와줍니다.", "학습 성과 추적 – 데이터 기반 분석으로 성장 과정을 한눈에 확인하세요." — 명사형 소제목 + 존댓말 설명.
- 가져올 것: 3단계 색상 의미(맞음/거의/틀림)를 점수와 독립된 "의미"로 고정하는 방식. 롤플레이 피드백을 "언어 정확성 / 자연스러움·톤 / 과제 달성"으로 나누는 틀(LEO의 grammar·vocabulary·fluency·task와 거의 1:1). 원문 옆에 "왜 틀렸는지 한 줄 팁".
- 가져오지 않을 것: 단어·음소 단위 퍼센트와 빨강 하이라이트의 밀도(LEO는 발음 앱이 아님). 벨/버즈 효과음, 포인트·별 게이미피케이션. 시험 점수 매핑(IELTS 등).
- 이유: LEO 피드백은 문장 단위 교정·표현 제안이며 1–10 점수가 넷뿐이다. 색상은 상태 의미로만 쓰고 수치 과잉을 피해야 한다(BRIEF의 품질 기준에 따름).

### Cambly

- 본 자료:
  - https://studentsupport.cambly.com/hc/en-us/articles/13108728538765-Your-classroom — 학생 헬프센터. 1분 전 입장, 종료 시각 표시, 5분 남으면 타이머, 정시 종료.
  - https://studentsupport.cambly.com/hc/en-us/articles/4411566878733-Tech-issues-with-a-lesson — 학생 헬프센터. 로비 화면 3종, 연결 불안 시 동작, [Cancel] 버튼.
  - https://apps.apple.com/us/app/cambly-english-teacher/id564024107 — App Store 설명·리뷰. "online clock that shows the class time", 수업 중 채팅, 녹화 다시보기.
  - (검색 스니펫만) https://support.cambly.com/hc/en-us/articles/19714727321101 — 튜터용 연습 교실: "lesson length is 10 minutes ... you will see the lesson timer begin counting down." 본문 403.
- 관찰:
  - **타이머**: "Once you've entered the classroom, you'll see the time your lesson will end. When you have 5 minutes left, a timer will appear." 남은 5분은 "ask remaining questions or get feedback from your tutor" 용도로 안내. 수업은 늦게 들어와도 정시에 끝남. (Your classroom)
  - **입장 전**: "You can join your lesson 1 minute early to check your camera and microphone." 로비 상태 3종: 튜터 연결 대기(connecting) / 카메라 접근 불가(no video) / 알 수 없는 연결 문제(general issue, "try joining again"). 튜터가 안 오면 로비의 **[Cancel]**로 수업 반환. (Tech issues)
  - **연결 불안**: "the video may show a picture of your tutor or a black screen while audio continues" — 영상이 끊겨도 오디오는 유지. (Tech issues)
  - 통화 중 컨트롤(음소거·종료 버튼 위치)은 열어본 문서 어디에도 서술이 없음. App Store 리뷰는 "Cambly already has an online clock that shows the class time", 수업 중 채팅, 녹화 다시보기를 언급.
- 가져올 것: "종료 시각 표시 + 막판 N분 카운트다운 등장"의 2단 타이머 패턴. 남은 시간을 "마무리 질문/피드백 시간"으로 의미 부여하는 안내. 통화 전 마이크 점검 단계와 명시적 로비 상태(연결 중 / 권한 없음 / 오류). 영상이 아니어도 "오디오는 살아 있음"을 알리는 상태.
- 가져오지 않을 것: 정시 강제 종료(LEO는 연장 10분이 있음). 예약·튜터 매칭 흐름.
- 이유: LEO의 10분 통화는 종료 임박을 명확히 알리되 연장 선택을 열어둬야 한다. Cambly는 "언제 끝나는지"를 두 단계로 알리는 선례를 공식 문서로 확인해 준다.

### Duolingo

- 본 자료:
  - https://blog.duolingo.com/explain-my-answer-now-free — "Explain My Answer" 버튼 위치(초록 "Correct!"/빨강 "Incorrect" 팝업 안)와 설명 예문.
  - https://blog.duolingo.com/streak-milestone-design-animation — 스트릭 마일스톤 애니메이션 설계 글(3가지 개선 영역, 공유 카드 문구).
  - https://blog.duolingo.com/core-tabs-redesign/ — "Elevating craft: How we refreshed our core tabs". 타이포 위계·여백·일관성 원칙.
  - https://blog.duolingo.com/hub/design/ — 디자인 허브 목록(design.duolingo.com이 여기로 리다이렉트됨).
  - https://www.wearedawn.co.uk/?p=11033 — 에이전시 Dawn의 브랜드 가이드라인 소개(2차 자료). 가이드 구성(Identity/Writing: voice, tone, Duo, style, glossary), 색·일러스트 원칙 일부.
  - (리다이렉트로 본문 미확인) https://design.duolingo.com/writing/voice , /writing/tone , /writing/duo — 모두 blog.duolingo.com/hub/design/으로 301. 검색 스니펫: voice는 고정, tone은 "reading the room", Duo는 "#1 fan and biggest cheerleader".
- 관찰:
  - **정답/오답 상태**: "Explain My Answer" 버튼은 정답 시 **초록 "Correct!" 팝업**, 오답 시 **빨강 "Incorrect" 팝업** 안에 있다. 오답 설명 레이아웃은 "정답 형태를 학습자 답과 나란히 → 설명 → 대조 예문 2개". 예문: "Remember that niño is a masculine noun, so the correct definite article to use is "el" instead of "la"." 이어서 "El niño y sus padres" / "La niña y sus padres". 정답 설명 예: "Maleta means suitcase and is a feminine noun. That's why it uses the feminine article una." 설명은 2인칭, "Remember that…" 프레이밍, 짧고 직접적. 피드백을 볼지 말지 학습자가 선택("Choose whether you want feedback on a mistake").
  - **스트릭**: 마일스톤(1주·1달·100일·1년)에만 특별 애니메이션. 3가지 개선축 "universal / celebratory / shareable". 이전 풍선 버전은 "cute, but not quite celebratory enough". 공유 카드 문구 "I just reached a streak!".
  - **타이포·여백 원칙**(core tabs): 문제는 "typography lacked hierarchy", "spacing felt inconsistent". 해결은 "evolve our type system to be consistent and intentional with a minimal number of styles", 헤더 크기를 탭 목적에 따라 단계화하되 타이틀 위치는 고정, 컨테이너를 강제하지 않고 "purposefully using the whitespace around the components". 원칙 문장: "Good design means knowing what to remove and what to keep." / "Consistency was sometimes at odds with the purpose of the design."
  - **색**(Dawn 2차 자료): 흰색·회색 음영은 "provide utility and hierarchy without competing with their core and secondary colours". 구체 값 없음.
  - 효과 수치(1.7% 리텐션 등)는 3자 사이트 인용이라 미확인.
- 가져올 것: 오답 설명의 구조(내 답 ↔ 올바른 형태를 나란히 → 한두 문장 이유 → 대조 예문). 피드백을 짧고 2인칭으로. 타입 스타일 수를 최소화하고 여백으로 구획하는 원칙. 축하는 마일스톤에만(매번이 아니라).
- 가져오지 않을 것: 스트릭·마스코트·게이미피케이션 전반(LEO에 기능 없음, 추가 금지). "Incorrect" 빨강 팝업 식 즉시 판정(통화 중 교정을 미루는 LEO 흐름과 상충).
- 이유: 리포트의 "원문→수정→설명"은 Duolingo 오답 설명 구조와 같다. 다만 LEO는 성인 개발자 대상이라 Duo식 유머·압박 톤은 BRIEF의 톤과 맞지 않는다고 판단.

---

## 2. 인터뷰 연습

### Pramp (현재 Exponent Practice → aced.io)

- 본 자료:
  - https://www.pramp.com/faq — 공식 FAQ(과거형 서술). 60분 권장, 역할 교대, 비디오+공유 에디터, 종료 시 피어 피드백 폼.
  - https://www.aced.io/practice — Pramp 세션이 이전된 서비스. 루브릭 기반 피어 노트 + AI 점수.
  - https://dev.to/alex_hunter_44f4c9ed6671e/is-pramp-worth-it-in-2026-my-review-after-23-sessions-19dj — 사용자 리뷰. 루브릭 영역 3개.
- 관찰:
  - **세션**: "Interviews are live, 1-on-1 video sessions ... over a collaborative code editor." 60분 권장, 30~40분씩 역할 교대, 약 2시간 후 자동 종료. 카메라를 켜두면 "additional feedback regarding your soft interviewing skills"를 받을 수 있다고 권장. (FAQ)
  - **피드백**: "At the end of a practice session, make sure to fill out your peer's feedback form." 계정에서 받은 피드백 열람. 폼 내용·척도는 FAQ에 없음. 리뷰는 "Rubric-based feedback forms covering communication, problem-solving, and technical skills". aced.io: "Trade detailed notes with your partner using realistic rubrics after the session ends." / AI 피드백은 "a score for each attribute and a recommendation on how to improve your scores", 전사 제공, 준비되면 이메일.
- 가져올 것: 항목별 점수 + "점수를 올리려면"이라는 개선 권고 쌍. 전사를 피드백과 함께 주는 것. 소프트 스킬 피드백을 별도 축으로 두는 발상.
- 가져오지 않을 것: 피어 매칭·역할 교대·코드 에디터. 이메일 알림.
- 이유: LEO는 1인 AI 연습이므로 "각 항목 점수 + 개선 행동"만 유효.

### Interviewing.io

- 본 자료:
  - https://interviewing.io/ — 홈. "Each session ends with an in-depth rundown of what you did well on and how you can improve." 오디오+채팅, 비디오 없음, 익명.
  - https://interviewing.io/faq — "Interviews have voice but no video." 인터뷰어 2개 지표 추적. 환불.
  - https://interviewing.io/how-it-works , https://interviewing.io/mocks — 리플레이 목록 구조(제목, "FAANG Interviewer", 언어, 필터).
  - https://interviewing.io/blog/own-interview-performance — 피드백 폼 구조: 예/아니오 질문 1개 + 1–4 척도, 양쪽 제출 후 공개.
  - https://interviewing.io/blog/how-know-ready-interview-faang — "candidates are measured on a 1-4 scale against three criteria (technical ability, problem solving, and communication)" + "overall hire/no hire rating".
  - https://interviewing.io/blog/our-business-depends-on-having-the-best-interviewers-so-we-built-an-interviewer-rating-system-and-you-can-too — 양방향 블라인드 피드백, 인터뷰어 폼은 이미지라 텍스트 미확인.
- 관찰:
  - **피드백 형식**: 기준 3개(technical ability / problem solving / communication)를 **1–4 척도**로, 그리고 **hire / no hire** 하나. "a technical score of 3 or above seems to be the rough cut-off for hirability." 양측이 모두 제출해야 서로의 평가가 보임("you don't see the other person's feedback until you submit yours"). 인터뷰이는 "자기 평가" 추가 질문을 받음.
  - **세션**: 음성+채팅, 비디오 없음, 익명(가명 예: "Colossal Narwhal", "Pseudo Centaur").
  - **문구 톤**: 홈 헤드라인 "We know exactly what to do and say to get the company, title, and salary you want." — 단정적·결과 지향.
- 가져올 것: 척도를 작게(1–4) 두고 "합격선"을 명시하는 발상 → LEO 1–10 점수에도 "어느 선이면 면접 가능 수준인지" 기준 문구를 붙일 근거. "잘한 점 → 개선점" 2단 구조. 음성 전용 인터뷰가 표준이라는 점(LEO의 음성 통화 포맷을 정당화).
- 가져오지 않을 것: hire/no-hire 이진 판정(LEO는 언어 연습이며 합불 판정 기능이 없음). 블라인드 상호 평가.
- 이유: LEO 점수 4종에 해석 기준이 없으면 숫자만 남는다. interviewing.io는 "3 이상이면 채용권"처럼 척도에 의미를 붙인 선례.

### Final Round AI

- 본 자료:
  - https://www.finalroundai.com/ — 홈. Interview Debrief 스크린샷 텍스트(점수 82, 축 5개), CoPilot 화면 3영역, 톤.
  - https://www.finalroundai.com/ai-mock-interview — Practice Interview 3단계, 8개 시나리오, 디브리프 내용.
- 관찰:
  - **리포트("Interview Debrief")**: "The moment a session ends, CoPilot writes a plain-language debrief: what worked, what to fix and how ready you sound." 버튼 없이 자동 생성("No button to press"). 스크린샷 텍스트: "Interview Debrief", "Senior SWE · Stripe", 점수 **82**, 축 **Clarity / Structure / Depth / Signals / Follow-up**. 디브리프의 약점이 "Re-drill" 대상이 되어 다음 세션으로 이어짐("Readiness signals update the Goal so the next session starts sharper"). FAQ의 전형적 발견: "answers lacking structure, thin examples, and questions you struggled to start."
  - **실시간 화면**: 3영역 "Interviewer / You / Suggested answer". 제안 예: "Start with the bottleneck, then quantify the trade-offs." "Your spoken answer stays short while the long solution sits beside it."
  - **흐름**: Preflight(유형 선택) → "Answer out loud" → "Re-drill weak spots".
  - **문구 톤**: 히어로는 과장("100% invisible. 100% undetectable.", "Ace Your Interview with #1 AI Interview Assistant"), FAQ는 "designed to", "supported"로 완화. 짧은 명령형 헤딩 "Start practicing", "Re-drill weak spots".
- 가져올 것: "세션 끝나면 자동으로 리포트가 생긴다"는 기대 설정. 리포트를 "what worked / what to fix / 다음에 할 것"으로 쓰는 평문 구조. 축 이름을 짧은 명사 하나로(Clarity, Structure…). 약점이 다음 세션의 과제로 이어지는 연결(LEO의 "next tasks").
- 가져오지 않을 것: 실제 면접 중 답안 제안(코파일럿) 전반과 "undetectable" 류 과장 톤. 종합 점수 1개로 뭉개는 것(LEO는 4개 축 유지).
- 이유: LEO는 연습 도구이며 한국어 UI 톤은 과장 없이 담백해야 한다(BRIEF). 리포트의 3단 구조와 next tasks 연결만 가져온다.

---

## 3. 통화 UI

### iOS 전화 앱

- 본 자료:
  - https://support.apple.com/en-asia/guide/iphone/while-on-a-call-iph3c9951d7/12.0 , https://support.apple.com/en-gw/guide/iphone/while-on-a-call-iph3c9951d7/13.0/ios — iPhone 사용 설명서(iOS 12/13). 통화 화면 이미지 캡션으로 버튼 배치 서술.
  - https://www.macworld.com/article/2027705/ios-17-phone-app-end-call-button-moving.html , https://9to5mac.com/?p=901294 — iOS 17 베타에서 End 버튼 위치 변경 보도.
  - (TOC만 반환, 본문 미확인) https://support.apple.com/guide/iphone/while-on-a-call-iph3c9951d7/ios 등 최신 버전 페이지.
- 관찰:
  - **iOS 12/13 배치**(Apple 캡션 원문): "In the top row from left to right are the mute, keypad, and speaker buttons." / "In the bottom row from left to right are the add call, FaceTime, and contacts buttons." 음소거 길게 누르면 보류(hold). 볼륨은 측면 물리 버튼.
  - **iOS 16→17**: iOS 16은 "End button was centered at the very bottom, with two separate rows of buttons above it". iOS 17 베타에서 End를 다른 6개 버튼과 같은 열(우하단)로 옮겼다가 "Developer Beta 6, Apple moved End Call back to the middle"(키패드와 자리 교환). 버튼은 모두 회색이고 End만 빨강: "still red and quite obvious". (Macworld, 9to5Mac)
  - Apple HIG의 통화 화면 지침은 확인 못 함(검색 결과에 HIG 페이지 없음).
- 가져올 것: 종료 버튼은 **빨강 단독 색**, 다른 컨트롤은 무채색. 컨트롤을 2×3 그리드로 고정하고 종료는 가운데 아래(iOS 16·17 최종 모두 "중앙")에 두는 배치. 음소거를 1순위 버튼으로.
- 가져오지 않을 것: 키패드·추가 통화·연락처 등 LEO에 없는 컨트롤. 길게 누르기 숨은 제스처.
- 이유: iOS가 End 버튼을 옮겼다가 되돌린 사례는 "빨강 종료 버튼은 익숙한 자리(중앙 하단)에 홀로"가 사용자 기대임을 보여준다.

### Android 전화 앱 (Google Phone)

- 본 자료:
  - https://support.google.com/phoneapp/answer/2811745?hl=en-GB — 공식 도움말 "Use phone call options".
- 관찰:
  - 통화 중 옵션 목록(라벨 원문): **Keypad / Speaker("Switches among the earpiece, speakerphone, or any connected Bluetooth headset") / Mute("Mutes or unmutes your microphone") / Hold / Switch / Call merge / Video call / Add call / Transfer**. **End call**은 "When you've finished with the call, tap End call" — 통화 걸기 절차에 있음. 통화를 최소화하면 **call bubble**이 되고, "drag the call bubble to the bottom right of the screen"으로 종료 버튼에 닿음, 아래 "Hide"로 숨김. 레이아웃·색상 서술 없음.
- 가져올 것: 라벨 어휘("Mute", "Speaker", "End call")의 단순성 → 한국어 라벨도 "음소거 / 스피커 / 통화 종료"로 1:1. 앱을 떠나도 통화가 살아 있다는 최소화 상태 개념(LEO에서는 탭 이동 시 통화 유지 표시로 번역 가능, 단 기능 추가는 아님).
- 가져오지 않을 것: Hold/Switch/Merge/Transfer.
- 이유: LEO 통화 컨트롤은 음소거·종료·연장 셋뿐이므로 라벨만 차용.

### Zoom

- 본 자료:
  - https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0010207 — "Muting and unmuting yourself". 음소거 상태 표시.
  - https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0062674 — "Participant controls in a meeting". 데스크톱/모바일/웹 툴바 구성.
  - https://help.hawken.edu/portal/en/kb/articles/zoom-in-meeting-controls — 3자(학교) 가이드. Zoom Rooms 컨트롤 목록. 참고용.
  - (검색 스니펫만) 액티브 스피커 테두리 색: 자료마다 초록/노랑으로 엇갈림. 공식 문서 미확인.
- 관찰:
  - **음소거 상태**: "The microphone icon will display a red diagonal line, indicating that you're muted." 비디오 타일 좌하단에도 **빨간 마이크+사선** 아이콘. 음소거 해제 시 타일엔 이름만. 푸시투토크(스페이스바) 중에는 "the microphone appears green while you talk" + 임시 해제 메시지. (KB0010207)
  - **툴바**(데스크톱 하단): Audio(Join Audio/Mute) · Video · Participants · Chat · React · Share · More · **Leave**. "Only the host can end it for everyone." 모바일은 컨트롤이 탭해야 나타나며 "Always show meeting controls" 옵션. 우상단: 암호화 상태 아이콘, "Speaker View (video layout)" 전환 아이콘. (KB0062674)
- 가져올 것: 음소거 = "마이크 아이콘 + 빨간 사선"이라는 관례. 말하는 중(송신 중) = 초록 마이크. 나가기(Leave)를 툴바 맨 끝에 분리.
- 가져오지 않을 것: 호스트/참가자 권한 체계, 레이아웃 전환, 반응 이모지.
- 이유: 1:1 통화에 다자 회의 UI는 과하다. 음소거 아이콘 문법만 표준을 따르면 된다.

### Google Meet

- 본 자료:
  - https://workspaceupdates.googleblog.com/2021/06/expanding-google-meet-visual-refresh-to.html — 2021 비주얼 리프레시. 파란 테두리, 음소거 표시 톤 다운, 하단 바 재배치.
  - https://workspaceupdates.googleblog.com/2021/01/network-performance-troubleshoot-issues-google-meet.html — "Troubleshooting and Help" 패널(네트워크 안정성·CPU 차트).
  - https://support.google.com/meet/answer/7501121?hl=en — 고정/음소거 도움말. 말하는 중 표시는 서술 없음.
  - (검색 스니펫만) 통화 품질 저하 시 "notification bubble ... along with a red dot on the 'More options' menu" — 본문(commercialintegrator) 403.
- 관찰:
  - **말하는 사람 표시**: "their tile will be outlined in blue" — 대규모 회의에서 화자를 찾기 쉽게. (2021 리프레시)
  - **음소거 표시**: "more subdued, helping to reduce visual distraction" — 의도적으로 약하게.
  - **하단 바**: "The leave call button has been moved away from the microphone and camera buttons." 바는 항상 보이되 "it will not cover captions and bottom video feeds". 참가자·채팅 등은 우하단으로 이동. 타일 모서리 둥글게, Google Sans 사용.
  - **네트워크**: 통화 중 ⋮ 메뉴 → "Troubleshooting and Help"에서 "CPU load and network stability over time" 차트와 "Suggested actions". 타일 위 상시 네트워크 아이콘에 대한 공식 서술은 찾지 못함.
  - **음소거 권한**: "You can't unmute another person for privacy reasons."
- 가져올 것: **화자 표시는 테두리 색(파랑) 한 가지**로. 음소거 표시는 조용하게, 종료 버튼은 마이크 버튼과 떨어뜨리기(오터치 방지). 하단 바가 자막(=LEO의 라이브 전사)을 가리지 않게 하는 원칙.
- 가져오지 않을 것: 진단 차트 패널. 다자 타일 레이아웃.
- 이유: LEO의 "누가 말하는 중" 표시에 가장 단순한 선례. 종료 버튼 분리는 iOS 사례와도 일치.

### ChatGPT Voice Mode

- 본 자료:
  - https://www.engadget.com/ai/now-you-can-use-chatgpt-voice-without-leaving-your-chat-195000538.html — 인라인 모드 기본화, "Separate mode" 설정, 실시간 전사, 시작 아이콘.
  - https://dataconomy.com/2025/11/26/openai-moves-chatgpt-voice-into-main-chat-thread/ — 같은 변경. OpenAI 인용 "You can now use ChatGPT Voice right inside chat—no separate mode needed."
  - https://bgr.com/2036902/openai-fixes-chatgpt-voice-separate-mode — Separate mode에서 오브가 "lights up while talking to the chatbot".
  - https://godofprompt.ai/blog/what-is-chatgpt-voice-mode , https://techwiser.com/chatgpts-advanced-voice-mode-what-you-need-to-know/ — 3자 가이드. "a screen with a blue orb in the center", "a dynamic blue sphere that pulses as the conversation flows", 중간에 끼어들기 가능.
  - https://www.change.org/p/ensure-accessibility-in-openai-s-voice-interface — 사용자 청원. 오브 UI가 "doesn't show what I say", "cuts me off when my speech is slow or broken".
  - (403) OpenAI 헬프센터 https://help.openai.com/en/articles/8400625-voice-conversations-beta — 검색 스니펫: 보이스는 "inside the main chat page, as a floating voice orb, or in Separate Voice", 화면 공유 중 오브 중앙에 cast 아이콘.
- 관찰:
  - **상태 표시**: 공식 문서에서 "listening / thinking / speaking" 별 오브 모양을 서술한 글은 찾지 못함. 확인된 범위: 분리 모드에서 **중앙의 파란 오브**가 대화 흐름에 따라 **맥동(pulse)** 하고 말할 때 "lights up". 표준 모드는 검은 원(3자 자료).
  - **전사**: 인라인 모드에서는 "a live transcript appears in the chat" (Engadget). 청원은 과거 오브 전용 화면이 내가 말한 내용을 보여주지 않아 접근성 문제였다고 주장 → OpenAI는 이후 전사를 채팅 안으로 들여옴.
  - **끼어들기**: "can cut in mid-sentence without waiting for ChatGPT to finish" (techwiser). 청원은 느리거나 끊기는 발화를 잘라버린다고 불만.
  - **버튼**(음소거·종료)의 공식 서술은 확인 못 함. 시작은 입력창 옆 "waveform" 아이콘.
- 가져올 것: 단일 오브/파형 하나로 "듣는 중↔말하는 중"을 애니메이션 강도로 구분하는 발상. **전사를 상태 표시 옆에 항상 두는 것**(오브만 있던 UI가 접근성 민원을 받았다는 교훈; Speak 리뷰의 "대기 중 애니메이션 없음" 불만과 같은 축). 끼어들기 허용 여부를 명시.
- 가져오지 않을 것: 전체 화면 오브 단독 모드. 상태 라벨 없이 색/모양만으로 구분하는 것.
- 이유: LEO는 느린 비원어민 발화를 다루므로 "생각 중 멈춤을 끊지 않는다"(Speak GPT-Live-1 수치)와 "내 말이 전사로 보인다"가 둘 다 필요하다.

---

## 4. 리포트 · 피드백 표현

### Grammarly

- 본 자료:
  - https://www.grammarly.com/blog/product/better-writing-with-grammarly/ — 밑줄 색 4종의 의미(공식 블로그).
  - https://www.grammarly.com/blog/product/new-grammarly-editor/ — 에디터 알림(alert) 구성: 클릭→제안, 휴지통=무시, 깃발=신고, 점 3개=상세 설명, 카테고리별 일괄 무시.
  - https://support.grammarly.com/hc/en-us/articles/115000091411 — 현재 docs(app.grammarly.com): 빨간 밑줄 hover/click→suggestion card, 수락/무시; 문단 재작성은 파란 점.
  - (503) https://guides.norwich.edu/online/grammarly/cards — 카드 내용 설명. 미확인.
- 관찰:
  - **색 의미**(공식): "Red underlines correspond to suggestions about spelling, punctuation, and grammar." / "Blue underlines signify potential clarity and conciseness improvements." / "Green underlines mark suggestions to make your writing more engaging." / 보라 = "politeness, formality, and friendliness". 즉 **정확성(빨강) vs 개선 제안(파랑·초록·보라)** 을 색으로 분리.
  - **상호작용**: 밑줄 → 클릭/hover → 카드. 카드에서 제안 클릭=수락, 휴지통=무시, "three dots at the bottom of the alert"=상세 설명. 카테고리 이름 옆 휴지통으로 일괄 무시. 검사 중엔 Assistant 아이콘에 애니메이션 원.
  - 카드 안의 "원문 vs 제안" 구체 레이아웃 서술은 공식 페이지에 없음(이미지).
- 가져올 것: "틀림(정확성)"과 "더 나은 표현(제안)"을 **색과 명칭으로 분리** — LEO의 grammar corrections(빨강 계열)와 better expressions/vocabulary(파랑 계열)에 대응. 설명은 기본 접고 "자세히"로 펼치는 2단계. 항목 단위로 묶어 보여주기.
- 가져오지 않을 것: 4색 체계 전부(LEO는 2종이면 충분). 인라인 밑줄(LEO 리포트는 전사 전체에 밑줄을 긋기보다 교정 카드 목록이 명세).
- 이유: 리포트 명세가 "원문→수정→설명" 카드이므로 Grammarly의 카드 상호작용과 색 분리 원칙만 가져온다.

### Linear

- 본 자료:
  - https://linear.app/blog/how-we-redesigned-the-linear-ui — 리디자인 2부. 타이포(Inter Display 헤딩, Inter 본문), LCH 테마 변수 3개, 대비 상향, 밀도.
  - https://linear.app/blog/a-design-reset — 1부. 디자인 부채와 리셋 주기(시각 규칙 없음).
- 관찰:
  - **타이포**: "Inter Display to add more expression to our headings while maintaining their readability", 본문은 regular Inter. 크기·행간 수치 없음.
  - **색**: HSL→**LCH**("perpetually uniform"). 테마는 "base color, accent color, and contrast" 셋으로 정의, 고대비 테마 자동 생성. 텍스트·중립 아이콘 대비를 라이트에서 더 어둡게, 다크에서 더 밝게. 액센트 사용을 줄여 "a more neutral and timeless appearance". 표면은 elevation으로 구분.
  - **밀도**: 목표 "reduce visual noise", "increase the hierarchy and density of navigation elements". 밀도 옵션 "from very condensed to more spacious" 탐색. 사이드바·탭에서 라벨/아이콘/버튼을 수직·수평 정렬. Apple 표준을 참고해 "close to the feeling of a native app".
  - **원칙**: "an exciting evolution of the product"(해체 아닌 진화), "It's always better to do a redesign quickly."
  - 3자 사이트의 "13px/4px 그리드" 류 수치는 Linear 공식이 아님(확인 못 함).
- 가져올 것: 색을 base/accent/contrast 세 변수로 토큰화하고 액센트를 아껴 중립 톤 유지. 텍스트·아이콘 대비를 먼저 올리기. 헤딩만 표현적 서체, 본문은 중립. 밀도 옵션을 "압축↔여유"로 탐색하되 정렬 규칙은 고정.
- 가져오지 않을 것: 키보드 중심 내비게이션·사이드바 구조(LEO는 3화면짜리 앱). 다크 테마 자동 생성 시스템 전체.
- 이유: LEO 리포트는 정보가 많다(교정 목록·점수·제안). Linear의 "노이즈 줄이고 위계·밀도 올리기"가 직접 적용 가능한 원칙.

### Vercel Geist

- 본 자료:
  - https://vercel.com/geist/introduction — 소개. "A high contrast, accessible color system", Geist Sans/Mono, Grid "A core part of the Vercel aesthetic".
  - https://vercel.com/geist/colors — 색 스케일 구조와 사용 규칙.
  - https://vercel.com/geist/typography , https://vercel.com/geist/text — 타이포 클래스 체계와 용도 규칙.
- 관찰:
  - **색**: 스케일 10종(backgrounds, gray, gray-alpha, blue, red, amber, green, teal, purple, pink), 각 100~1000 **10단계**. 단계별 역할(gray 기준): 1 기본 배경 / 2 hover 배경 / 3 active 배경 / 4 기본 테두리 / 5 hover 테두리 / 6 active 테두리 / 7 고대비 배경 / 8 그 hover / 9 **보조 텍스트·아이콘** / 10 **주 텍스트·아이콘**. 규칙: "Gray for text, icons, fills, borders, and dividers by default." gray-alpha는 배경이 비쳐야 할 때만. 배경은 "use Background 1—especially when color is being placed on top of the background", Background 2는 드물게. 테두리는 "Use solid gray by default." 그림자는 반투명. success/error/warning 같은 의미 색 매핑은 페이지에 없음.
  - **타이포**: 클래스가 "font-size, line-height, letter-spacing, and font-weight"를 묶어 프리셋. 4계열: Heading(72~14) / Button(16·14·12) / Label(20~12, 단일 행·아이콘 동반, 넉넉한 행간) / Copy(24~13, 다중 행, Label보다 큰 행간). "text-label-14 is the most common style in menus", "text-copy-14 is the most commonly used" 본문, Label-13은 보조 행에 **tabular figures**, Label-12는 "tertiary text in busy views", copy-13-mono는 인라인 코드. 강조는 Strong/Subtle 수식어로만.
- 가져올 것: 텍스트 위계를 **주(10)/보조(9)/3차(12px label)** 세 단계로 못 박는 것. 숫자(점수·타이머)에 tabular figures. "단일 행 Label vs 다중 행 Copy"로 행간을 역할별로 분리. 배경은 하나, 테두리는 불투명 회색 기본.
- 가져오지 않을 것: 10종×10단계 전체 팔레트(LEO는 중립 1 + 상태색 2~3이면 충분). 72px급 마케팅 헤딩.
- 이유: LEO 리포트·통화 화면은 타이머·점수 같은 숫자와 짧은 라벨이 많다. Geist의 Label/Copy 분리와 tabular figures 규칙이 바로 쓰인다.

---

### 접근 실패 목록

| 대상 | URL | 결과 | 시도한 것 |
|---|---|---|---|
| Speak (Android Authority AI Tutor Call 기사) | https://www.androidauthority.com/speak-ai-tutor-call-3725246 | 403 | 대신 speak.com 공식 블로그 글로 대체 |
| Speak (Google Play) | https://play.google.com/store/apps/details?id=com.selabs.speak&hl=en_US | 본문 없음(truncated) | App Store US 페이지로 대체 |
| Speak (copycatcafe 리뷰) | https://copycatcafe.com/blog/speak-app-review | 403 | languatalk 리뷰로 대체 |
| ELSA 지원 "How to Understand Your Scores and Feedback" | https://elsaschool-support.freshdesk.com/en/support/solutions/articles/31000176510-... (및 /support/… 변형) | 404 ×2 | 수치 경계(0–39/40–79/80–100)는 검색 스니펫만 확인 |
| ELSA 지원 "FAQ about Speech Analysis", "Understanding EPS" | …/31000177613-…, …/31000178777-… | 404 | — |
| ELSA Score Medium 글 | https://medium.com/@elsaspeak/discover-your-elsa-score-… | 403 | — |
| ELSA 블로그 완전 가이드 | https://blog.elsaspeak.com/update-the-complete-guide-to-using-elsa-speak-… | 404 | — |
| ELSA 리뷰(alllanguageresources) | https://www.alllanguageresources.com/elsa-speak/ , /?p=17806 | 본문 빈 페이지 ×2 | learnenglish.life, makeheadway 리뷰로 대체 |
| Cambly 튜터 헬프 "During a Lesson", "Practice classroom", 40336772245005 | https://support.cambly.com/hc/en-us/articles/360050467651-During-a-Lesson 외 2건 | 403 ×3 | 학생 헬프센터 2건과 App Store로 대체 |
| Duolingo 디자인 가이드 Writing(voice/tone/duo) | https://design.duolingo.com/writing/voice , /tone , /duo | 전부 blog.duolingo.com/hub/design/ 으로 301, 원문 소실 | web.archive.org는 도구에서 차단됨. Dawn 2차 자료와 검색 스니펫만 |
| Duolingo core tabs 원문 | https://blog.duolingo.com/core-tabs-redesign/ | 성공(미러 https://aggregoctt.github.io/… 도 동일 내용) | — |
| Apple iPhone 사용 설명서 최신(iOS 17+) "While on a call" | https://support.apple.com/guide/iphone/while-on-a-call-iph3c9951d7/ios , en-us 변형, iph3c99f1d0 | 목차(TOC)만 반환 ×4 | iOS 12/13 버전 페이지로 배치 확인, iOS 17 변경은 Macworld/9to5Mac |
| Apple HIG(통화/CallKit 지침) | — | 검색 결과에 HIG 페이지 없음 | 확인 못 함 |
| AT&T iPhone 12 통화 화면 튜토리얼 | https://www.att.com/device-support/article/wireless/000097548/Apple/iPhone12 | 내비게이션만 반환 | — |
| Zoom 액티브 스피커 테두리 색 공식 문서 | https://community.zoom.com/t5/Zoom-Meetings/Green-Border-line-is-not-visible/m-p/202725 | 404 | 3자 자료는 초록/노랑 엇갈림 → 확인 못 함 |
| Google Meet 통화 품질 알림 기사 | https://www.commercialintegrator.com/insights/google-meet-has-an-updated-ui-call-quality-notifications/99907/ | 403 | 검색 스니펫만(빨간 점+알림 풍선) |
| OpenAI 헬프센터 Voice Mode FAQ | https://help.openai.com/en/articles/8400625-voice-conversations-beta , https://help.openai.com/articles/8400625 | 403 ×2 | 검색 스니펫 + 언론 기사로 대체. 오브의 listening/thinking/speaking 별 모양은 **확인 못 함** |
| OpenAI "see, hear, and speak" 발표 | https://openai.com/index/chatgpt-can-now-see-hear-and-speak/ | 403 | — |
| ChatGPT 음성 UI 기사(phonearena, macrumors, techradar, artificialcorner) | 각 URL | 403 / 403 / 본문 truncated / 404 | — |
| OpenAI 커뮤니티 오브 색 요청 스레드 | https://community.openai.com/t/…/1396625.md | 열렸으나 오브 상태 서술 없음 | — |
| Grammarly 카드 가이드(Norwich) | https://guides.norwich.edu/online/grammarly/cards | 503 | 공식 블로그·지원 문서로 대체 |
| Pramp 체험기(Medium option-zero) | https://medium.com/option-zero/an-experience-with-pramp-c1011530c776 | 403 | dev.to 리뷰와 aced.io로 대체 |
| interviewing.io 인터뷰어 피드백 폼 실제 문항 | 블로그 3건은 성공했으나 폼이 이미지 | 텍스트 미확인 | 척도(1–4)·기준 3개·hire/no hire만 텍스트로 확인 |
