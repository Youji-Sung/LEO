# 화면별 재설계 (4단계)

형식: 문제(AUDIT ID) → 결정 → 근거 → 대안(기각) → after 스크린샷. 스크린샷은 `docs/design/screenshots/after/{이름}--{1280|390}-{light|dark}.png`. 우선순위 순서(PLAN 4단계).

## 1. 통화 중 (`/call/[id]`) — 핵심

문제(AUDIT): C1 상태 표시가 작고 색만 다름, C2 1분 전 경고 없음, C3 첫 인사가 대화에 없음, C4 끊기 버튼 비중, C5 연장 버튼이 끊기 위치를 밀어냄, C6 통화 규칙 안내 없음, C7 interim 대비 2.74:1, C8 텍스트 모드에서 컨트롤이 입력창을 덮음, C9 헤더·배너가 23% 차지, C10 종료 중 진행 표시 없음, C11 음소거 상태 약함, C12 숫자 둘, C13 턴 상한 안내 작음, C14 컨트롤 폭, G12 h1 없음, T1 화자 구분.

결정
- 전용 레이아웃: `/call/[id]` 를 `(call)` 라우트 그룹으로 옮겨 전역 헤더·메뉴 없이 렌더(`.call-shell`). 상단은 "LEO · 테마 · 총 길이" 와 타이머뿐. 운영 배너는 압축형으로만.
- 상태 1개: `CallStatus` — 40px 아이콘 원 + 본문 크기 굵은 글자 + 보조 한 줄(말하는 중엔 "말을 시작하면 상대가 멈추고 들어요", 음소거엔 "음소거 해제"). 듣는 중=초록 마이크, 상대가 말하는 중=강조색 스피커 + 카드 테두리 강조, 음소거=빨강 마이크 사선, 생각 중·종료 중=회전 아이콘. 듣는 중·말하는 중은 1.6초 느린 펄스(reduced-motion 에서 정지). `role=status` 하나.
- 시간 1개: `Timer` — 36px 링(남은 비율) + 24px tabular 숫자. 60초 이하면 주의색으로 바뀌고, 별도 `role=status`(polite) 로 "1분 남았어요" 를 한 번 띄운다. 총 길이는 상단 메타에 말로("20초 통화", "10분 20초 통화").
- 행동 1개: `끊기` 는 56px 빨강 버튼을 하단 중앙에 고정(iOS/Android 관습). 음소거는 왼쪽, 연장은 오른쪽 칸에 나타나며 가운데 끊기 위치는 `1fr auto 1fr` 격자라 절대 움직이지 않는다. 버튼은 아이콘 + 라벨(아이콘만 아님). 끊기의 접근 가능한 이름은 "통화 끊기".
- 대화: `Bubble` 로 화자 라벨(sr-only "나/상대")·`lang=en`·위치·채움·테두리로 구분. 상대의 첫 인사를 첫 말풍선으로 보여 준다(저장은 하지 않음). interim 은 점선 테두리 + 옅은 강조 배경 + 진한 글자(대비 8.02:1) + sr-only "인식 중".
- 시작 전: 카드에 제목 + 한 줄 설명 + 규칙 2개(끼어들기, 연장) + 56px "통화 시작하기".
- 종료 중: 상태 카드가 "리포트를 만드는 중 · 통화를 마쳤어요. 보통 1분 안에 끝나요" 로 바뀌고 버튼은 비활성.
- 텍스트 모드: 입력 폼을 하단 고정 영역 안(버튼 위)에 둬 겹침 제거.
- 오류·턴 상한: `StatusMessage` error/info.

근거: P1(한 번에 하나), WCAG 1.4.1·1.4.11·2.5.8·4.1.3, Apple 44pt / M2 48dp 타깃, iOS 17 End 버튼 복귀 사례·Android "End call"·Zoom 음소거 아이콘·Meet "화자 = 테두리 하나"(RESEARCH 3부), Cambly 의 막판 카운트다운, Apple reduce-motion(펄스 정지), WCAG 2.2.1 Essential(제한을 통화 전에 명시 + 1분 전 알림).
대안(기각): 전체 화면 오브만(ChatGPT 식 — 전사가 없어 접근성 민원 사례), 하단 탭 유지(공간), 연장 버튼을 끊기 옆에 끼워 넣기(C5 재발), 끊기 아이콘만(라벨 없는 빨간 원은 관습이지만 WCAG 이름 요구와 첫 사용자 학습 비용).
after: `call-idle`, `call-live`, `call-muted`, `call-ending`, `call-text-mode`, `report-call-interview`.

## 2. 리포트와 대화 내용 (`/history/[id]/report`, `/history/[id]`)

### 리포트

- 문제(AUDIT): R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12
- 결정:
  - 섹션 순서를 요약 → 점수 → 면접 피드백(면접류 테마만; 예상 추가 질문 h3 포함) → 문법 교정 → 어휘 제안 → 더 나은 표현 → 다음 연습 과제로 고정. 면접 섹션을 맨 아래에서 점수 바로 뒤로 올렸다(R8). 요약 문장은 Claude 출력이라 화면에서는 손대지 않고 첫 자리에 둔다(R1 은 프롬프트 문체 지시 담당).
  - 모든 섹션은 `<Card as="section" id=… title=… titleId=…>` 로, h2 하나와 `aria-labelledby` 를 가진다. 앵커 id: summary, scores, interview, grammar, vocabulary, better, tasks.
  - 페이지 머리말 아래 `<nav class="report-toc" aria-label="목차">` 에 존재하는 섹션만 앵커 링크로 나열한다(R6). 1024px 이상에서도 인라인 유지, 고정(sticky) 없음.
  - 점수는 `ScoreGauge` 4~5개(`.scores` 2열 그리드). 숫자 + 등급 배지("좋아요/괜찮아요/연습이 필요해요") + 한 줄 코멘트. 바 색은 등급과 함께 가고 텍스트가 동반된다(R2). 종합 점수는 두지 않는다(P2 "종합 점수 하나로 판정하지 않는다").
  - 교정·어휘·표현 모두 `DiffText` 두 줄("내가 한 말" / "이렇게 말해요") + 이유 한 줄. 취소선·화살표 없음(R3, R4). 어휘는 "뜻: …" 과 "예문: …" 을 별도 줄로, 기울임 없음(R5). `.correction` / `.orig` / `.fixed` 클래스는 E2E 호환을 위해 유지.
  - 다음 연습 과제는 `<ol class="tasks">` 뒤에 1차 버튼 하나: 통화 리포트는 "같은 테마로 다시 연습하기" → `/call`, 채팅 리포트는 "채팅으로 연습하기" → `/chat` (R7). `ReportView` 에 `kind: "chat" | "call"` prop 추가.
  - 머리말은 `.page-head`: h1 "리포트" + 메타 한 줄(테마 · 전화 영어/채팅 · 시각 · 포트폴리오, 가운뎃점 3개 이내) + 보조 버튼 "대화 내용", "채팅으로"/"기록으로"(ButtonLink secondary). 너비는 컨테이너 전체(점수 2열 그리드 때문에 `container-narrow` 를 쓰지 않음).
  - 리포트 없음: `EmptyState`(제목 "아직 리포트가 없어요." + 본문 + 1차 버튼 "리포트 만들기"), `role=alert` 제거(R10). 만드는 중: `Spinner`(`role=status`) 라벨 "리포트를 만드는 중 · 보통 1분 안에 끝나요."(R11). 실패: `StatusMessage tone=error` + "다시 시도" 버튼(R9 의 내부 오류 문자열 제거는 API 쪽 문구가 담당).
  - 예상 추가 질문 `<li lang="en">`, 교정문·예문은 DiffText 가 `lang="en"`.
- 근거:
  - P2 "숫자보다 다음 행동": 인정 → 점수(해석 문장) → 교정(원문·교정·이유) → 다음 과제(누를 수 있는 행동). "취소선 금지", "번호 목록으로 끝내지 않는다".
  - WRITING 2.11 교정은 원문 → 고친 문장 → 이유 한 줄, 판정어 대신 "이렇게 말해요". 2.4 가운뎃점은 메타 정보에만 3개까지. 2.8 빈 상태 = 상황 한 문장 + 행동 1개. 2.9 10초 넘는 작업은 예상 시간.
  - Duolingo 오답 설명 구조(RESEARCH 3부: 내 답 ↔ 올바른 형태 나란히 → 이유 → 예문; G-2 Explain My Answer).
  - interviewing.io 척도 의미("3 이상이면 채용권" → 등급 배지로 척도에 뜻을 붙임, RESEARCH 2부).
  - Grammarly 정확성(교정)과 제안(어휘·표현)의 명칭 분리(RESEARCH 4부) — 섹션 이름 "교정" vs "제안".
  - Linear "노이즈 줄이고 위계 올리기", Vercel Geist Label/Copy 분리·tabular 숫자(RESEARCH 4부) — ScoreGauge 숫자, 카드 여백 구획.
  - SYSTEM 7절 Card(`as`, `title`/`titleId`), ScoreGauge, DiffText, EmptyState, StatusMessage(role 규칙), Spinner(`role=status`).
  - BRIEF ②(리포트 읽기 순간: 취약함, "그래서 뭘 하면 되는지").
- 대안(기각):
  - 목차를 1024px 이상에서 좌측 sticky 사이드바로: 섹션 7개 이하이고 1280px 에서 전체 높이가 2화면 안팎이라 인라인 칩 목차로 충분. 구현·테스트 비용 대비 이득 작음.
  - 섹션 접기(아코디언): 교정 10개·어휘 10개라도 스크롤로 훑는 편이 비교에 유리하고 접힌 내용은 검색·스크린리더 탐색에서 숨겨짐(R6 는 앵커로 해결).
  - 종합 점수(평균) 추가: P2 "종합 점수 하나로 사람을 판정하지 않는다" 와 충돌.
  - 면접 섹션을 요약 앞에: 인정(요약)이 먼저라는 P2·WRITING 2.11 에 어긋남. 점수 바로 뒤로 타협.
  - 다음 행동 버튼을 머리말에 두기: 리포트를 다 읽기 전 1차 행동이 눈에 띄면 교정을 건너뛰게 함. 과제 목록 바로 아래가 맥락상 맞음.
  - 다음 행동을 "같은 테마로" 자동 설정(`/call?theme=…`): 통화 설정 흐름 변경이 필요하고 기능 추가에 해당해 기각. 라벨은 ko.ts 그대로 두고 링크만 `/call`.
  - 만드는 중 상태를 EmptyState 안의 로딩 버튼으로: 스피너+문구(`role=status`) 하나가 WRITING 2.9 에 맞고 두 개의 진행 표시는 중복.
- after 스크린샷: `report-chat-interview--*`, `report-call-interview--*`, `report-error--*`, `report-missing--*`

### 대화 내용(트랜스크립트)

- 문제(AUDIT): K4, T1
- 결정:
  - 머리말 `.page-head`: h1 "대화 내용" + 메타 한 줄(테마 · 전화 영어/채팅 · 시각 · 통화 길이). 행동은 리포트가 있으면 "리포트 보기"(1차), 없으면 "리포트 만들기"(1차) + 채팅이면 "채팅으로"(보조). 1차 버튼은 화면당 하나.
  - 메시지는 `Bubble speaker="me"|"partner"` 로 렌더. 화자 라벨(sr-only "나:"/"상대:")과 `lang="en"` 이 자동으로 붙고, 교정 힌트는 말풍선 밖 별도 블록에 "교정 힌트:" sr-only 라벨과 아이콘으로 표시(K4, T1).
  - 메시지 없음: `EmptyState` 제목 "아직 주고받은 말이 없어요." 행동 버튼은 두지 않음(머리말에 이미 1차 행동이 있어 같은 결과로 가는 버튼이 둘이 되는 것을 피함, WRITING 2.2). 이 경우 `role=log` 컨테이너는 렌더하지 않는다(로그 안에 제목이 들어가는 것을 피함).
  - 메시지가 있으면 `.chat-messages` 에 `role="log" aria-label="대화 내용"` 유지.
- 근거:
  - P4 접근성(WCAG 1.4.1 색만으로 뜻 전달 금지 → 화자 텍스트 라벨), P3 같은 역할 같은 모양(채팅·통화·대화 내용이 같은 Bubble).
  - SYSTEM 7절 Bubble(화자 라벨 + `lang="en"`, 힌트는 말풍선 밖), EmptyState(행동 1개), Button(1차는 화면당 하나).
  - WRITING 2.2(두 버튼이 같은 결과로 가지 않음), 2.4(가운뎃점 3개 이내), 용어집 "대화 내용".
- 대안(기각):
  - 화자 이름을 항상 보이는 텍스트로(말풍선 위 "나"/"상대"): 좌우 정렬·채움·테두리로 시각 구분이 이미 3중이라 보조 기술용 sr-only 로 충분. 보이는 라벨은 통화 리포트(메시지 20개 이상)에서 노이즈.
  - 빈 상태에 "채팅으로" 버튼: 머리말의 같은 버튼과 중복.
  - "리포트 만들기" 를 메시지 0개일 때 숨기기(K2): 흐름 변경이라 이번 범위에서 하지 않음. 기록 화면 담당 결정에 맞춰 후속.
- after 스크린샷: `transcript--*`

## 3. 통화 설정 (`/call`)

문제(AUDIT): S1 테마가 select 라 비교 불가·잘림, S2 마이크 확인이 선택처럼 보임, S3 "다음" 이 모호, S4 라디오 타깃, S5 거부 안내 길이, S6 기술 설명문, S7 포트폴리오 없음 처리.

결정
- 테마는 `ChoiceGroup` 카드(제목 + 한 줄 상황 설명, 44px+ 히트 영역, 선택 시 강조 배경·테두리). 기본 "면접".
- 통화 시간은 압축 카드 라디오(10/20/30분, 테스트). 마이크는 카드 제목 "마이크" + "마이크 확인하기" 버튼 + 결과 `StatusMessage`(미확인 info "통화 시작 전에 한 번 확인하면 첫 인사를 놓치지 않아요", 성공 success, 거부 error + 행동 안내).
- 주 버튼 "다음"(56px) 옆에 "다음 화면에서 통화를 시작해요" 예고(토스 Predictable hint).
- 포트폴리오 없음: 경고 `StatusMessage` + "포트폴리오 추가하기" 버튼, "다음" 비활성.
근거: P3(같은 역할 같은 모양), WRITING 2.2·2.7, NN/g H6(재인), 토스 다음 화면 힌트, WCAG 2.5.8.
대안(기각): 네이티브 select 유지(비교 불가), 마이크 확인 강제(권한 팝업을 통화 시작 제스처와 분리하는 현재 흐름이 Chrome 자동재생 정책에 맞음 — DECISIONS 2026-11-03), 세로 스텝 마법사(화면 수 증가).
after: `call-setup`, `call-setup-mic-ok`, `call-setup-portfolio-empty`.

## 4. 채팅 (`/chat`, `/chat/[id]`)

### 채팅 목록·새 채팅

- 문제(AUDIT): L1, L2, L3, S1(테마 `select` 공통), G12(페이지 구조), D2(목록 링크 행선지)
- 결정
  - 테마 선택을 네이티브 `select` 에서 `ChoiceGroup`(fieldset/legend "테마 고르기") + `Choice` 라디오 카드(제목 + 설명)로 바꿨다. 통화 설정(`CallSetupForm`)과 같은 컴포넌트·같은 순서. 기본값 "자유 대화".
  - "교정 힌트" 는 `CheckRow` 로 두고 그 아래 힌트 문구(`chat.hintsToggleDesc`: "켜면 내 메시지마다 상대 답변 아래에 한 줄 교정이 붙어요.")를 붙였다. 체크박스 접근 가능한 이름은 "교정 힌트" 그대로.
  - 폼 전체를 `Card as="section"` 하나에 담고, 1차 버튼은 `Button primary lg` "채팅 시작하기"(로딩 중 "채팅을 시작하는 중", `aria-busy`). 오류는 `StatusMessage error`(role=alert).
  - 페이지는 `.page-head` h1 "채팅" → 새 채팅 카드 → h2 "이전 채팅" → 목록. 목록 항목은 `.list-item` = `.list-main`(제목 링크 + `.list-meta`) + `.list-actions`. 메타는 가운뎃점 나열 대신 테마 `Badge`(중립) · "메시지 N개" · 상대 날짜(`formatDateTime`) · "리포트 있음" `Badge positive` · "종료" `Badge`. 행동 버튼은 진행 중이면 "이어서 채팅"(→ /chat/[id]), 끝났고 리포트가 있으면 "리포트 보기"(→ 리포트). 제목 링크는 항상 /chat/[id] 로 가서 행선지가 상황에 따라 조용히 바뀌지 않는다.
  - 빈 목록은 `EmptyState` 제목 "아직 채팅이 없어요. 위에서 테마를 고르고 시작하세요." 만 두고 버튼은 두지 않았다(바로 위 폼이 행동).
- 근거
  - P3(같은 역할은 같은 모양): 테마 선택을 통화 설정과 같은 `Choice` 카드로. P5(조용한 화면): 목록의 테마 배지는 중립색, 강조색은 채팅 화면의 1차 버튼에만.
  - P4: 라디오 카드는 44px 히트 영역과 `fieldset/legend`(WCAG 1.3.1, 2.5.8 — RESEARCH 1부 A). 설명이 잘리지 않아 비교하며 고를 수 있다(S1·L1).
  - WRITING 2.8(빈 상태 = 상황 한 문장 + 행동 1개; 여기서는 폼이 행동), 2.4(메타 가운뎃점은 한 줄 3개까지 → 배지·칸으로 분리), 2.6(상대 날짜). NN/g 빈 상태(A-3), Polaris Empty state(D-5), NN/g H6 재인 우선(L1·L2).
  - D2 기각 근거: 홈 목록에서 링크가 상황마다 다른 곳으로 가는 문제를 채팅 목록에서 반복하지 않기 위해 행동 버튼에 행선지 이름을 붙였다(Polaris Actionable language D-2).
- 대안(기각)
  - `Select` 컴포넌트 유지 + 옵션 설명 제거: 설명 없이 고르면 테마 비교가 안 된다(L1 의 원인 유지). 기각.
  - 목록의 테마 배지에 `accent` 톤: 항목마다 강조색이 반복돼 1차 행동과 경쟁한다(P5). 기각.
  - 빈 상태에 "채팅 시작하기" 버튼 추가: 같은 화면에 1차 버튼이 둘이 된다(P5 "한 화면에 1차 버튼 하나"). 기각.
- after 스크린샷: chat-list

### 채팅

- 문제(AUDIT): T1, T2, T3, T5, T6, T7, T8, T9(부분), T10, G12
- 결정
  - 페이지에 `h1.sr-only` "채팅" 을 두어 제목 구조를 잇는다(axe `page-has-heading-one`). 화면 공간은 쓰지 않는다.
  - 툴바(`.chat-toolbar`): 테마 `Badge accent` + 제목(보조색, 한 줄 말줄임) + `.spacer` + "교정 힌트" 체크박스(`check-row`, 이름 그대로) + 리포트 버튼(`secondary`; 리포트가 없으면 "리포트 만들기", 있으면 "리포트 다시 만들기", 로딩 중 "리포트를 만드는 중" + 스피너 + `aria-busy`) + 리포트가 있으면 `ghost` "리포트 보기". 1차 버튼(강조색)은 "보내기" 하나뿐.
  - T6: 리포트가 이미 있으면 "리포트 다시 만들기" 가 `Dialog` 를 연다 — 제목 "리포트를 다시 만들까요?", 본문 "지금 리포트는 새 리포트로 바뀌어요. 보통 1분 안에 끝나요.", 버튼 [다시 만들기] [취소]. 리포트가 없으면 바로 만든다.
  - 말풍선은 `Bubble` 로 통일: 화자 라벨("나:"/"상대:")이 sr-only 로 먼저 읽히고 영어 본문은 `lang="en"`(T1). 교정 힌트는 상대 말풍선 밖 별도 블록(전구 아이콘 + 긍정색 옅은 배경 + sr-only "교정 힌트:")으로 분리돼 상대 말로 읽히지 않는다(T2).
  - 답변 대기: `Bubble waiting` 에 "답변을 기다리는 중" 텍스트(T3). `role=log aria-live=polite` 는 유지.
  - 빈 대화: `EmptyState` 제목 "영어로 첫 메시지를 보내 보세요" + 예문 `<p lang="en">`. 예문이 영어라 `body` 대신 행동 자리에 넣었다(T9 는 문구 범위에서 유지).
  - 오류: `StatusMessage error`(role=alert) + 보낼 수 있으면 "다시 보내기" 버튼. 끝난 대화: `StatusMessage info` "끝난 대화예요." + "새 채팅 시작하기" 링크 버튼(T5).
  - 입력(T8·T10): `form.chat-input` 은 하단 `sticky`(CSS). 텍스트 영역은 `rows=1` 에서 내용만큼 자라고 `max-height` 에서 스크롤. 보내는 동안에도 입력은 잠그지 않고(미리 적을 수 있음) Enter 는 보내는 중이 아닐 때만 전송, Shift+Enter 는 줄바꿈. 전송이 끝나면 포커스가 입력창으로 돌아온다. "보내기" 는 `primary` + Send 아이콘(`aria-hidden`), 내용이 없거나 보내는 중이면 `disabled`.
  - 스크롤은 새 메시지·스트리밍마다 맨 아래로(기존 유지).
- 근거
  - P2(숫자보다 다음 행동)·WRITING 2.7: 오류는 "무슨 일 + 할 일" 과 재시도 버튼, 입력 보존(NN/g A-2, Microsoft C-4). 종료 안내에 바로 누를 행동(T5, 토스 F-2d "다음 화면으로 넘어가게 하는 안내").
  - P4: 화자 라벨 텍스트 + 위치·색(WCAG 1.4.1, RESEARCH 1부 A). 상태 변화는 `role=status/alert`(WCAG 4.1.3). 힌트를 별도 블록으로 둔 것은 Grammarly 의 "정확성(교정)과 제안을 시각적으로 분리"(RESEARCH 3부 4).
  - P5: 툴바에서 강조색을 빼고(리포트 버튼은 secondary) 1차 행동은 "보내기" 하나(T7). 아이콘은 Lucide, `aria-hidden`(SYSTEM 6절).
  - WRITING 2.9(진행 = "대상 + ~하는 중", 10초 넘는 작업은 예상 시간 → 대화 상자 본문 "보통 1분 안에 끝나요"), 2.10(확인 대화 = 질문 제목 + 결과 본문 + 행동 이름 버튼; Atlassian E-5, Polaris D-7), 2.5(영어 예문은 별도 블록·`lang="en"`).
  - T8: 입력을 잠그지 않는 것은 NN/g H3(사용자 통제)·H7(효율); 전송 중 중복 제출은 버튼 `disabled` 와 Enter 가드로 막는다.
- 대안(기각)
  - 리포트 버튼을 `primary` 로: 리포트 생성이 채팅의 1차 행동처럼 보인다(T7, P5). 기각.
  - 리포트 다시 만들기도 확인 없이 바로 실행: 비용·시간이 드는 덮어쓰기라 WRITING 2.10 의 확인 대상. 기각. 브라우저 `confirm` 도 P3("네이티브 confirm 금지") 로 기각.
  - 보내는 동안 입력창 `disabled` 유지(기존): 다음 말을 미리 적을 수 없다(T8). 기각.
  - 힌트를 말풍선 안 점선 블록으로 유지: 상대의 말처럼 읽힌다(T2). 기각.
  - 입력창을 `position: fixed` 로: 전역 레이아웃(헤더·배너)과 겹치고 모바일 키보드에서 뷰포트 계산이 어긋난다. CSS `sticky` 로 충분. 기각.
  - 빈 상태 예문을 `EmptyState body` 로 그대로: `lang` 속성을 줄 수 없어 스크린리더가 영어를 한국어 음성으로 읽는다. 기각.
- after 스크린샷: chat-empty, chat-hints, chat-sending, chat-error, chat-ended

## 5. 홈 (`/`)

### 홈

- 문제(AUDIT): D1, D2, D3, D4 (+ G8 이모지 아이콘, G9 날짜 형식)
- 결정
  - `.page-head` 에 h1 `home.greeting(name)` + p `home.intro`("오늘은 어떤 연습을 할까요?"). 이름은 WRITING 2.12 대로 홈 인사 한 곳에서만 쓴다.
  - 행동 카드 2개(`.grid-2` + `Card`): 통화(1차 버튼, Phone 아이콘) / 채팅(보조 버튼, MessageSquare 아이콘). 카드 제목 h2 + 한 줄 설명(`startCallDesc`/`startChatDesc`) + 버튼. 이모지는 lucide 아이콘(`aria-hidden`)으로 바꿨다.
  - 최근 대화: 메시지가 1개 이상이거나 리포트가 있는 대화만 5개(`OR: [{ messages: { some: {} } }, { report: { isNot: null } }]`). 메시지 0개짜리 미완 통화는 보이지 않는다(D1).
  - 항목은 `.list-main`(제목 링크 = `종류 · 테마 · 제목`, 항상 `/history/[id]`) + `.list-meta`(formatDateTime, `메시지 n개`, 리포트 있으면 Badge accent) + `.list-actions` 에 라벨이 있는 버튼 하나: 리포트 있음 → "리포트 보기", 진행 중 채팅 → "이어서 채팅", 그 밖에 → "대화 내용 보기"(D2: 어디로 가는지 버튼 이름이 말한다).
  - 목록 아래 "기록 전체 보기" ghost 링크. 빈 상태는 `EmptyState` 제목 `home.recentEmpty` + 행동 "통화 시작하기"(D4).
- 근거
  - P3(같은 자리 버튼이 상황마다 다른 곳으로 가지 않는다 → 라벨로 목적지 명시), P5(이모지 금지, 1차 버튼 1개), P2(숫자보다 다음 행동 — 목록의 행동이 "리포트 보기/이어서 채팅").
  - WRITING 2.2(1차 버튼 "~하기", 보조 버튼 명사형), 2.6(날짜 상대 표기), 2.8(빈 상태 = 상황 한 문장 + 행동 1개), 2.12(님 남발 금지).
  - RESEARCH A-3 NN/g 빈 상태("Provide direct pathways to getting started with key tasks"), E-6 Atlassian 빈 상태(CTA 1개, 제목과 호응), A-1 H4 일관성.
- 대안(기각)
  - 최근 목록 제목 링크 자체를 상황별 목적지로 두고 라벨 없이 유지 → D2 그대로라 기각.
  - 메시지 0개 통화를 "진행 중" 배지로 남겨 두기 → 홈에서는 다음 행동이 없으므로 숨기고, 기록 화면에서만 "주고받은 말 없음" 으로 보인다.
  - 빈 상태 버튼을 1차 버튼으로 → 같은 화면의 통화 카드 1차 버튼과 결과가 같아 P5 "1차 버튼 하나" 에 걸리므로 보조 버튼으로 확정(메인 세션 결정).
- after 스크린샷: home, home-empty

## 6. 기록·포트폴리오·사용량·설정·로그인/회원가입

### 기록

- 문제(AUDIT): K1, K2, K3 (+ G9)
- 결정
  - `.page-head` 에 h1 과 `Segmented`(링크형, `aria-current="page"`, 라벨 "종류") 를 나란히. 필터가 1차 버튼처럼 보이지 않는다(K1).
  - 항목 `.list-main`: 제목 링크(`종류 · 테마 · 제목`, `/history/[id]`) + `.list-meta` 에 종류 Badge(Phone/MessageSquare 아이콘), 시작 시각, `메시지 n개` 또는 "주고받은 말 없음", 통화 길이(`formatDurationWords`), 상태 Badge("진행 중" positive / "종료" neutral), 리포트 Badge accent. 가운뎃점 나열 대신 Badge 와 간격으로 구분(K3).
  - `.list-actions` 버튼 하나: 리포트 있음 → "리포트"; 진행 중 채팅 → "이어서 채팅"; 메시지가 있으면 "리포트 만들기"; 메시지 0개면 버튼 없음(K2 — 누르면 오류 나던 버튼 제거).
  - 빈 상태 `EmptyState`(`history.empty`/`history.emptyFiltered`) + "통화 시작하기".
  - `data-testid="history-list"` 와 제목 텍스트 형식 유지(E2E `/면접 · I go to school/`).
- 근거
  - P3(필터는 필터처럼), P2(K2: 실행 불가능한 행동을 보여 주지 않는다 — NN/g H5 오류 예방), P4(링크형 필터 `aria-current`, SYSTEM 7 Segmented).
  - WRITING 2.4(가운뎃점은 한 줄 3개까지), 2.6(통화 길이 "10분 30초", 날짜 상대 표기), 2.8(빈 상태).
  - RESEARCH A-1 H4/H5, A-3 NN/g 빈 상태, SYSTEM 7(Badge 는 텍스트 필수, 색은 보조).
- 대안(기각)
  - 메시지 0개 대화에도 비활성 "리포트 만들기" 를 두고 이유를 표시 → 할 수 있는 행동이 없으므로 버튼 자체를 빼고 메타에 "주고받은 말 없음" 으로 상태만 알린다.
  - 필터를 `role="tablist"` 탭으로 → 패널 전환이 아니라 URL 이동이므로 `nav` + `aria-current`(SYSTEM 7).
- after 스크린샷: history, history-empty

### 포트폴리오

- 문제(AUDIT): P1, P2, P3, P4
- 결정
  - 순서: `.page-head`(h1 + intro) → "추가한 포트폴리오" 목록 → 추가 폼 Card(P2). 빈 상태는 `EmptyState` 제목만(버튼 없음 — 폼이 바로 아래). 문구는 "위에서 추가하면" → "아래에서 추가하면" 으로 고쳤다(`portfolio.empty`).
  - 입력 방식은 `ChoiceGroup`(legend "입력 방식") + compact `Choice` 라디오 2개. 제목 `TextField`(placeholder 유지), 내용 `TextArea rows=8`, PDF 는 `.field` 안의 `<input type="file">`.
  - 제출 `Button primary loading` ("추가하는 중"). 성공 시 `useToast` success + 폼 안 `StatusMessage success`(role=status, E2E 가 폼 안 status 를 본다). 성공 메시지는 다음 제출 때 비워진다(P3 완화).
  - 삭제: `window.confirm` → `Dialog`(제목 "포트폴리오를 삭제할까요?", 본문 "{제목} 을(를) 삭제하면 되돌릴 수 없어요.", 버튼 [삭제](danger) [취소], 취소에 첫 포커스, Esc·스크림 닫기). 삭제 후 토스트 "{제목} 을(를) 삭제했어요."(P1). 항목 삭제 버튼은 Trash2 아이콘 + "삭제", `aria-label` "{제목} 삭제" 유지.
  - 미리보기: 줄 머리 `#` 제거 + 공백 한 칸으로 접어 200자, 초과 시 "…"(P4). 메타는 추가 시각 + `n자`.
  - E2E: `page.once("dialog", accept)` 제거, `getByRole("dialog").getByRole("button", { name: "삭제" })` 클릭으로 교체. `data-testid="portfolio-list"` 유지.
- 근거
  - P3(네이티브 `confirm` 금지 — 버튼 이름 "확인/취소" 대신 행동 이름), P4(Dialog 포커스 트랩·복귀), P5(장식 없이 밀도).
  - WRITING 2.2(파괴적 확인 버튼 [삭제] [취소], "확인" 금지), 2.10(확인 대화 구조), 2.4(물음표는 진짜 질문에만), 2.8(빈 상태).
  - RESEARCH E-5 Atlassian 위험 행동 확인("OK 가 아닌 구체적 행동 레이블", 되돌릴 수 없음 명시), E-4 Atlassian 성공 메시지(결과만, "성공적으로" 금지), D-3 Polaris 토스트(짧은 진술), A-3 NN/g 빈 상태(채우는 경로 제공), A-1 H3·H6.
- 대안(기각)
  - 성공 메시지를 토스트만으로 → E2E 와 "폼 안 결과 확인" 모두를 위해 inline status 도 유지. 추가된 항목을 목록 맨 위에 두어 메시지와 항목이 이어진다.
  - 미리보기를 마크다운 렌더링 → 의존성 추가·범위 밖. `#` 만 떼는 것으로 충분.
  - 폼을 접었다 펴는 disclosure → 기능 변경에 가깝고, 목록을 먼저 두는 것으로 P2 가 해결된다.
- after 스크린샷: portfolios, portfolios-empty, portfolios-pdf-mode

### 사용량

- 문제(AUDIT): U1, U2, U3, U4
- 결정
  - `.page-head` h1 + p `usage.intro`("Claude 를 부른 기록이에요. 비용은 단가표로 계산한 추정값이에요.").
  - 필터 2개를 `Segmented` 링크형으로, 라벨 "기간"(오늘/7일/30일/전체 기간) 과 "사용자"(모든 사용자/이름…). "전체" 가 두 번 나오지 않는다(U1).
  - 합계는 Card(제목 "합계 · 기간 · 사용자") 안 `dl.usage-totals`; 비용은 `formatUsd`(2자리), 토큰은 쉼표(U4 — 포맷 함수는 이미 WRITING 2.6 대로).
  - 표 3개는 각각 `div.table-wrap[tabIndex=0][role=region][aria-labelledby=caption id]` 안의 `table.table` + `caption#id`. 키보드로 스크롤 영역에 들어갈 수 있다(U2, axe `scrollable-region-focusable`). 사용자별 표에도 빈 행(`usage.empty`) 추가. 캡션 텍스트 유지(E2E `/사용자별/ /기능별/ /최근 호출/`), 모델 셀 텍스트 유지.
  - 모바일(U3): 가로 스크롤 영역을 포커스 가능하게 두는 것까지만. 열을 숨기거나 카드로 바꾸지 않는다(운영자용 화면, 전체 열이 필요).
- 근거
  - P3(같은 뜻은 같은 말 — "전체" 중복 제거), P4(WCAG 2.1.1 키보드, 1.3.1 표 구조 `caption`/`th scope`), P5(숫자 tabular).
  - WRITING 2.6(토큰 천 단위 쉼표, 비용 2자리), 3 용어집("사용량", "추정 비용").
  - RESEARCH A WCAG 2.1.1 Keyboard, 1.3.1 Info and Relationships; 3부 Vercel Geist(tabular figures), Linear(밀도·위계).
- 대안(기각)
  - 모바일에서 열 숨기기/카드형 전환 → 운영자가 전체 열을 보는 화면이라 정보 손실. 스크롤 영역 접근성만 보장(메인 지시).
  - 필터를 `select` 로 → 선택지가 4~5개뿐이라 한눈에 보이는 Segmented 가 맞다(S1 과 같은 이유).
- after 스크린샷: usage, usage-empty

### 설정

- 문제(AUDIT): E1, E2, E3
- 결정
  - 설정을 세 카드로 나눈다: 화면(테마 모드 시스템/라이트/다크 — 3단계에서 추가한 `ThemeSelect`, 고르면 즉시 미리보기, 저장은 폼 제출), 채팅(새 채팅에서 교정 힌트 켜 두기 + 보조 설명), 전화 영어(상대 목소리 Select + 미리 듣기, 통화 기본 길이).
  - "TTS 음성" → "상대 목소리", 목록을 못 불러오면 Select 의 hint 로 안내(E1).
  - 저장 결과는 토스트 "설정을 저장했어요."(role=status) + 버튼 로딩 "저장하는 중"(E2).
- 근거: P3(용어집), P4(토스트 role=status, Choice 카드 44px), WRITING 2.5(약어 금지), 2.9(로딩), BRIEF 다크 모드 확정, SYSTEM 1.3(쿠키+DB).
- 대안(기각): 설정 자동 저장(변경마다 요청, 실패 처리가 흩어짐), 헤더의 테마 토글(Apple 은 앱 내 토글 자체를 비권장 — 설정 안에만 둔다).
- after 스크린샷: settings

### 로그인·회원가입

- 문제(AUDIT): A1, A2, A3, A4, A5
- 결정
  - `main.container.container-narrow` 에 브랜드 블록(`common.brand` t-display + `common.tagline` muted) → h1 → intro(`auth.loginIntro`/`auth.signupIntro`) → 폼 Card → 전환 링크. 브랜드 블록에는 포커스 요소가 없어 Tab 순서 이메일 → 비밀번호 → 제출이 유지된다(A1).
  - 회원가입 intro "초대받은 분만 가입할 수 있어요." (A2 는 문구로 설명; 동작 제한은 기능 범위 밖).
  - `AuthForm`: `TextField` 이름/이메일/비밀번호(`autoComplete` 유지), 가입 시 비밀번호 `hint` "8자 이상"(A3 — 입력 전에 규칙이 보인다). 오류는 폼 안 `StatusMessage error`(role=alert, 아이콘 + 텍스트, A5). 제출은 `Button primary block loading`("로그인하는 중"/"가입하는 중", A4). `aria-label` = "로그인"/"회원가입" 유지.
  - 서버가 돌려주는 오류(`errors.auth.*`)는 필드 단위가 아니라 폼 단위라 폼 상단 alert 로 둔다.
- 근거
  - P4(상태 변화 role=alert, 로딩 `aria-busy` 와 라벨 유지), P5(브랜드 한 줄로 조용히).
  - WRITING 2.2(로그인·회원가입은 관용어 그대로, "가입하기"), 2.7(오류 구조), 2.9(로딩 "~하는 중").
  - RESEARCH A WCAG 3.3.1/3.3.3(오류 식별·제안), 4.1.3 Status Messages, A-2 NN/g 오류 가이드, A-4 NN/g 진행 표시.
- 대안(기각)
  - 비밀번호 규칙을 필드 오류(`error`)로 연결(`aria-describedby`) → 서버 오류가 어느 필드인지 구분해 주지 않아 지금은 폼 단위 alert. API 가 필드를 돌려주면 `TextField error` 로 옮길 수 있다.
  - 브랜드를 h1 로, "로그인" 을 h2 로 → E2E 가 h1 "로그인" 을 보고, 페이지 제목은 행동이어야 하므로 기각.
- after 스크린샷: login, login-error, signup

## 7. 전역 (헤더·배너·전환)

문제(AUDIT): G1 모바일 헤더 깨짐, G2 현재 페이지 표시 없음, G3 다크 모드 없음, G4 포커스 링, G5·G6 배너, G7 경계 대비, G8 이모지, G9 날짜, G10 비활성, G11 서체, G12 h1.

결정
- 헤더: 56px 고정 상단, 데스크톱 가로 메뉴 + `aria-current="page"` 강조 배경, 768px 미만은 메뉴 버튼(aria-expanded/controls)으로 세로 메뉴를 열고 사용자·로그아웃은 메뉴 안으로. 로그아웃은 ghost 버튼.
- 배너: 모의 모드는 `role=status` 정보 배너(아이콘 + 한 줄), API 키 없음은 `role=alert` 주의 배너로 사용자 문장 + 운영자 코드. 통화 화면에서는 운영자 코드 없이 압축.
- 다크 모드·포커스 링·경계·서체·아이콘·날짜·비활성은 3단계 토큰·컴포넌트로 전역 해결(SYSTEM.md).
- 페이지 전환: `main.page-enter` 400ms 페이드(reduced-motion 에서 0ms).
근거: P4·P5, SYSTEM 1~6절, Apple Dark Mode, M3 surface, WCAG 2.4.7/1.4.11.
대안(기각): 하단 탭 바(7개 항목), 사이드바(화면 수 적음), 배너 완전 제거(운영자가 상태를 알아야 함).
after: 모든 화면의 상단, `home-nokey`, `chat-nokey-error`.
