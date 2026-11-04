# 상태와 마이크로 인터랙션 (5단계)

모든 상태는 `src/content/ko.ts` 문구 + `src/components/ui` 컴포넌트로 통일했다(WRITING 2.7~2.10, SYSTEM 7절). 스크린샷은 `docs/design/screenshots/after/`, reduced-motion 은 `after-reduced-motion/`. 테스트 열의 E2E 는 `e2e/*.spec.ts` 의 테스트 이름, 통합은 `tests/integration`, 단위는 `tests/unit`.

## 1. 상태 표 (화면 × 상태)

| 화면 | 상태 | 구현 | 스크린샷 | 테스트 |
|---|---|---|---|---|
| 로그인 | 기본 | `AuthForm` TextField ×2 + primary 버튼 | `login` | E2E "키보드만으로 로그인할 수 있고 포커스 순서가 자연스럽다" |
| 로그인 | 제출 중 | 버튼 `loading` + "로그인하는 중" | (순간) | E2E "로그인 → 홈 → 로그아웃" |
| 로그인 | 오류(자격 증명) | `StatusMessage error focus` 폼 안 | `login-error` | E2E "잘못된 비밀번호는 오류를 보여 준다", 통합 auth 401 |
| 로그인 | 네트워크 오류 | `auth.networkError` | — (fetch 예외, 모의 불가) | — 미확인(수동) |
| 회원가입 | 기본 / 힌트 "8자 이상" | TextField `hint` | `signup` | E2E "회원가입 후 바로 로그인 상태가 된다", 통합 400/409 |
| 홈 | 빈 상태 | `EmptyState` + 보조 버튼 | `home-empty` | — (렌더만, E2E 는 데이터 있는 홈) |
| 홈 | 목록 | `.list-item` + Badge + 라벨 있는 버튼 1개 | `home` | E2E "로그인 → 홈" 헤딩 |
| 채팅 목록 | 빈 상태 / 목록 | `EmptyState` / `.list-item` | `chat-list-empty`, `chat-list` | E2E "주요 컨트롤에 접근 가능한 이름이 있다" |
| 새 채팅 | 생성 중 | 버튼 `loading` "채팅을 시작하는 중" | (순간) | E2E "로그인 → 새 채팅 → …" |
| 채팅 | 대화 시작 전 | `EmptyState` + 영어 예문 | `chat-empty` | E2E 위와 같음 |
| 채팅 | 답변 기다리는 중 | `Bubble waiting` "답변을 기다리는 중" | `chat-sending` | E2E `streaming` testid 소멸 확인 |
| 채팅 | 대화 중 + 교정 힌트 | `Bubble hint` 말풍선 밖 블록 | `chat-hints` | E2E 힌트 "went" 포함, "교정 힌트를 끄면 힌트가 붙지 않는다" |
| 채팅 | 응답 오류 → 다시 보내기 | `StatusMessage error focus` + "다시 보내기", 입력 보존 | `chat-error` | 통합 chat "제공자 오류→error 이벤트, 사용자 턴 삭제" |
| 채팅 | 상대가 답하지 않기로 함(refusal) | 같은 컴포넌트, 재전송 버튼 없음 | `chat-refusal` | 통합 chat refusal |
| 채팅 | 네트워크 끊김 | `chat.networkError` + 새로고침 | `chat-network-error` | 단위 client-fetch(비 JSON 응답) |
| 채팅 | 대화 횟수 한도 | 서버 429 → `StatusMessage error` | `chat-turn-cap` | 통합 usage-and-turncap 429, 단위 client-fetch code |
| 채팅 | 리포트 만드는 중 | 버튼 `loading` "리포트를 만드는 중" | (순간) | E2E 리포트 이동 |
| 채팅 | 리포트 다시 만들기 확인 | `Dialog`(취소 첫 포커스) | `chat-remake-dialog` | 단위 ui/dialog |
| 채팅 | 끝난 대화 | `StatusMessage info` + "새 채팅 시작하기" | `chat-ended` | E2E "끝난 대화예요" |
| 채팅 | Claude 연결 없음 | 서버 오류 문구 | `chat-nokey-error` | 단위 claude-errors |
| 통화 설정 | 기본 / 마이크 미확인 | `ChoiceGroup` + `StatusMessage info` | `call-setup` | E2E "통화 시작 → …" |
| 통화 설정 | 마이크 확인 중 / 확인됨 / 거부 | 버튼 `loading` / success / error | `call-setup-mic-ok` (거부는 권한 팝업이라 모의 불가) | E2E 마이크 상태 testid; 거부 — 미확인(README 수동 1번) |
| 통화 설정 | 포트폴리오 없음 | `StatusMessage warning` + 추가 버튼, 다음 비활성 | `call-setup-portfolio-empty` | 통합 portfolio_required 400 |
| 통화 | 시작 전 | 카드 + 규칙 2개 + 56px 버튼 | `call-idle` | E2E `start-call` |
| 통화 | 듣는 중 | `CallStatus listening` 펄스 | `call-live` | E2E `listening()` true |
| 통화 | 상대가 생각하는 중 / 말하는 중 | `thinking` 회전 / `speaking` 강조 테두리 | (순간; 모의 TTS 30ms) | E2E `spoken()` ≥ 4, 단위 voice |
| 통화 | 내 말 인식 중(interim) | `Bubble interim` + sr-only "인식 중" | (순간; 가짜 어댑터는 interim→final 즉시) | 단위 voice fake say |
| 통화 | 음소거 | `CallStatus muted` + 버튼 `aria-pressed` | `call-muted` | E2E "음소거와 끊기" |
| 통화 | 1분 남음 | 타이머 주의색 + `StatusMessage warning polite` | `call-live`(20초 통화라 즉시) | E2E 연장 버튼 표시 |
| 통화 | 연장 | 오른쪽 칸 버튼 → 총 길이 갱신 | `call-live` | E2E "남은 시간 1분 이하에서 10분 연장 버튼이 동작한다" |
| 통화 | 오류(음성 인식) | `StatusMessage error` | — (실제 브라우저 오류 필요) | 단위 voice.test, 수동 README 11번 |
| 통화 | 텍스트 모드 | `StatusMessage info` + 고정 영역 폼 | `call-text-mode` | E2E "음성 인식 미지원 브라우저는 텍스트 입력으로 대체한다" |
| 통화 | 대화 횟수 한도 | `StatusMessage info` "한도에 닿아 통화를 마쳐요" → 종료 | `call-turn-cap` | 단위 client-fetch(turn_cap code) |
| 통화 | 종료 중 | `CallStatus ending` 회전 + "보통 1분 안에 끝나요", 버튼 비활성 | `call-ending` | E2E 리포트 URL 도착 |
| 리포트 | 정상(채팅·통화·면접·포트폴리오) | 순서·목차·ScoreGauge·DiffText·다음 행동 | `report-chat-interview`, `report-call-interview` | E2E "리포트가 모든 항목을 렌더하고 …", 단위 report-view 5개 |
| 리포트 | 아직 없음 | `EmptyState` + "리포트 만들기" | `report-missing` | E2E 스키마 실패 시나리오 1단계 |
| 리포트 | 만드는 중 | `Spinner` "리포트를 만드는 중 · 보통 1분 안에 끝나요." | (순간) | E2E 재시도 성공 |
| 리포트 | 생성 실패(스키마·거부·연결) | `StatusMessage error focus` + "다시 시도" | `report-error` | E2E "스키마 검증 실패 시 오류와 재시도 버튼을 보여 주고, 재시도로 성공한다", 통합 502/422 |
| 리포트 | 저장본 손상 | `report.corrupted` 초기 오류 | — (DB 손상 재현 안 함) | — 미확인 |
| 대화 내용 | 기본 / 빈 상태 | `Bubble` / `EmptyState` | `transcript` | E2E 기록 → 대화 내용 → 리포트 |
| 기록 | 빈 상태 / 목록 / 메시지 없음 | `EmptyState` / Badge / 버튼 없음 + "주고받은 말 없음" | `history-empty`, `history` | E2E `history-list` |
| 포트폴리오 | 빈 상태 / 목록 | `EmptyState` / `.list-item` | `portfolios-empty`, `portfolios` | E2E 포트폴리오 등록 |
| 포트폴리오 | 추가 중 / 추가됨 | 버튼 `loading` / `StatusMessage success` + 토스트 | `portfolios` | E2E "추가했어요" |
| 포트폴리오 | PDF 모드 / PDF 오류 | 파일 입력 / 서버 400 문구 | `portfolios-pdf-mode` | 통합 portfolio(깨진 PDF 400, 빈 내용 400) |
| 포트폴리오 | 삭제 확인 | `Dialog danger` [삭제][취소] | `portfolios-delete-dialog` | E2E 삭제(다이얼로그 버튼) |
| 포트폴리오 | 삭제됨 / 통화 중이라 삭제 불가 | 토스트 / `StatusMessage error` 409 | (순간) / — | 통합 portfolio_in_use 409 |
| 사용량 | 빈 상태 / 데이터 | 표 빈 행 "이 기간에는 기록이 없어요." / 표 | `usage-empty`, `usage` | E2E "사용량 페이지가 합계와 표를 렌더한다", 통합 usage-summary |
| 설정 | 기본 / 저장 중 / 저장됨 | 카드 3개 / 버튼 `loading` / 토스트 | `settings`, `settings-saved` | 단위 ui/theme-select, toast; E2E — 미확인(6단계 키보드 흐름에서 설정 저장 추가 예정) |
| 전역 | 모의 모드 배너 / Claude 연결 없음 배너 | `ConfigBanner` status / alert | 모든 화면 상단 / `home-nokey` | — (서버 환경 변수 렌더) |
| 전역 | 404 | Next 기본 | — | — 미확인(범위 밖, 기능 추가 금지) |

## 2. 모션

| 대상 | 기본 | `prefers-reduced-motion: reduce` | 근거 |
|---|---|---|---|
| 통화 "듣는 중"·"상대가 말하는 중" 펄스 | 아이콘 원 바깥 링이 1.6초 주기로 커지며 사라짐(`--motion-pulse`) | 링 제거(`display:none`), 아이콘·색·글자만 | WCAG 2.2.2(5초 이상 자동 움직임은 멈출 수 있어야), Apple "반복 애니메이션 줄이기" |
| 생각 중·종료 중 회전 아이콘 | 1.2초 회전 | 정지 아이콘 + 글자 | 위와 같음 |
| 스트리밍 텍스트 | 델타가 도착하는 대로 추가(전환 없음), 말풍선 "답변을 기다리는 중" | 동일(모션 없음) | NN/g 진행 표시(1초 즉시 피드백) |
| 점수 바 채움 | 400ms `standard` | 0ms | M3 duration medium |
| 버튼 hover/press | 150ms 색·1px 이동 | 0ms | M3 short |
| 토스트 | 250ms 아래→위 페이드 등장, 5초 뒤 사라짐(호버·포커스 시 정지) | 즉시 표시 | M3 medium, WCAG 2.2.1(사라지는 메시지는 호버 시 유지) |
| 페이지 전환 | `main.page-enter` 400ms 페이드 | 0ms | Apple "전환은 페이드로" |
| 스피너·스켈레톤 | 회전 / 1.4초 명멸 | 점선 정지 / 정지 | WCAG 2.3.3 |
| 다이얼로그 | 브라우저 기본(전환 없음) | 동일 | — |

`tokens.css` 의 reduced-motion 블록이 duration 토큰을 0ms 로, `globals.css` 의 블록이 모든 animation/transition 을 0.001ms 로 만든다. 스크린샷: `after-reduced-motion/call-live--*`(펄스 링 없음), `chat-sending--*`, `settings-saved--*`.

## 3. 포커스 관리 규칙

| 상황 | 포커스가 가는 곳 | 구현 |
|---|---|---|
| 페이지 이동(클라이언트) | `<main>`(tabindex=-1, 아웃라인 없음) → 다음 Tab 이 본문 첫 요소로 | `RouteFocus`(루트 레이아웃), 첫 로드는 브라우저 기본 |
| 통화 → 리포트 자동 이동 | 위와 같음(리포트 `<main>`) | `router.push` 후 RouteFocus |
| 다이얼로그 열림 | 취소 버튼(실수 방지) | `Dialog` autoFocus + `showModal()` 트랩, Esc·스크림 닫기 |
| 다이얼로그 닫힘 | 열기 전 요소(삭제 버튼 등) | `Dialog` close 이벤트에서 복귀 |
| 폼 제출 오류 | 오류 메시지(role=alert, tabindex=-1) | `StatusMessage focus`: 로그인·회원가입, 포트폴리오, 통화 설정, 채팅 오류, 리포트 오류 |
| 통화 중 오류 | 이동하지 않음(말하는 중 방해 금지), role=alert 로만 알림 | `CallView` |
| 채팅 전송 완료 | 입력창으로 복귀 | `ChatView` `inputRef.focus()` |
| 모바일 메뉴 열기/닫기 | 버튼에 유지, 링크 클릭 시 메뉴 닫힘 | `SiteHeader` |
| 토스트 | 이동하지 않음(role=status), 닫기 버튼은 Tab 으로 접근 가능 | `Toast` |
| 하단 고정 바가 포커스를 가림 | `scroll-padding-bottom: 120px` | `globals.css` (WCAG 2.4.11) |
