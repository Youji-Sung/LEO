# 시안 4종 다듬기 진행 기록

`POLISH_PLAN.md` 단계별 완료 조건의 확인 결과. 형식: `- [x|미확인] 조건 — 확인 방법 — 결과(수치)`. 결정과 근거는 `DECISIONS.md` "시안 4종 다듬기" 절.

## 1단계. 외부 테스트 피드백 반영

| 건 | 조치 | 근거·테스트 |
|---|---|---|
| 1 통화 첫 인사가 대화 내용·메시지 수에 빠짐 | **조치.** 통화 시작 시 첫 인사를 index 0 assistant 메시지로 저장, Claude 히스토리에서는 앞을 잘라 냄(`toProviderMessages`) | 통합 `tests/integration/call-opening.test.ts`(저장 1회·index 순서·메시지 수·리포트 생성·채팅에 적용 거부 4개), E2E `call.spec.ts` 첫 테스트에 대화 내용·기록 메시지 수(7개) 확인 추가 |
| 3 메시지 없는 대화가 기록에 남음 | **조치.** 홈·기록·채팅 목록이 같은 기준(`hasContentWhere`)으로 숨김. "주고받은 말 없음" 문구 삭제 | 통합 `call-opening.test.ts`(시작만 한 통화·빈 채팅은 숨고 말한 통화는 보임) |
| 2 빈 채팅 예문이 예시인지 구분 안 됨 | **조치.** "예시" 배지 + `<q lang="en">` 따옴표·이탤릭 | E2E `chat.spec.ts` 첫 테스트(라벨·q 요소 확인). 네 시안 촬영은 2단계 `chat-empty` |
| 4 마이크 없는 브라우저에서 오류색 + 안내 겹침 | **조치.** 통화 중 fatal 인식 오류는 info 안내 한 줄로(이유 문구), 설정의 권한 거부는 warning, 장치 없음은 새 문구 info | E2E `call.spec.ts` "마이크를 쓸 수 없게 되면…"(status 1개, alert 0개, 기본 안내 문구 없음, 글 입력으로 대화). 가짜 어댑터에 `fail()` 추가. 설정 화면의 장치 없음 상태는 2단계 촬영 `call-setup-mic-notfound` |
| 5 통화에서 실패한 말이 사라짐 | **조치.** 실패한 말풍선 유지 + [다시 보내기], 거부는 info, 연결 끊김은 [새로고침] | E2E `call.spec.ts` "보내지 못한 말은 남고…"(말풍선 1개 유지, 재전송 후 다시 실패, 새 말에 내려감). 촬영은 2단계 `call-send-error` |
| 6 리포트 교정이 사소하거나 중복 | **조치.** `normalizeReport` 가 사소한 항목·같은 원문 중복을 제거, 프롬프트 규칙 보강 | 단위 `report-schema.test.ts`(정규화·제거 규칙·모의 리포트 보존). 실제 모델 출력은 **미확인**(CLAUDE_MOCK 만) |

- [x] 6건 각각 조치와 이유 — 위 표, 결정은 `DECISIONS.md` 1단계 — 조치 6/6
- [x] 조치한 것의 테스트 — 통합 4개(`call-opening.test.ts`), 단위 1개(`report-schema`), E2E 수정 1개·추가 2개(`call.spec`, `chat.spec`) — 모두 통과(아래 검증)
- [x] 단계 끝 `npm run check` — 항목별 커밋 전 매번 실행 — 종료 코드 0(단위 265개, 빌드 성공)
- [x] 단계 끝 `npm run test:e2e` — 전체 — 23개 통과(2.2분)
- 촬영 스크립트 확장: `--direction basic|study|stage|console` 이 전체 상태를 `screenshots/directions/<시안>/` 에 찍고, 상태 4개 추가(`call-setup-mic-denied`, `call-setup-mic-notfound`, `call-mic-denied`, `call-send-error`). 기본 시안으로 5개 상태 × 4 = 20장 시험 촬영, 가로 스크롤 0. 네 시안 전수 촬영은 2단계
- 미확인: 피드백 6 의 실제 모델 출력 효과(모의 모드만 실행), 피드백 4 의 실제 브라우저 권한 팝업 흐름(가짜 어댑터·getUserMedia 모킹으로 대체)

## 2단계. 미촬영 화면을 네 시안으로 촬영하고 깨진 곳 수정

- [x] 촬영 — `npx tsx scripts/screenshots.ts --direction <basic|study|stage|console> --axe --port 315x` 4회(기본 3150, 서재 3151, 무대 3152, 콘솔 3153) — **시안당 46개 상태(계획의 42 + 1단계 추가 4) × 4변형 = 184장, 합 736장**, 촬영 실패 0. 위치 `screenshots/directions/<시안>/`(`index.md`, `axe.md`, `axe.json`, `overflow.md`)
- [x] axe — 네 시안 각 184장, 태그 wcag2a/2aa/21a/21aa/22aa/best-practice — **위반 0건 × 4**(`screenshots/directions/<시안>/axe.md`)
- [x] 가로 스크롤 — 네 시안 각 184장 — **0장 × 4**(`overflow.md`)
- [x] 깨진 곳 점검 — 서브에이전트 4개(시안당 1개)에게 결함 기준(겹침·넘침·안 보임·토큰 미적용·대비·레이아웃)만 주고 184장 전부 열게 함. 연 파일 184/184 × 4 — 보고 결함: 기본 1건, 서재 3건, 무대 0건, 콘솔 아래 표. 메인 세션이 보고된 장면을 직접 열어 확인
  | 보고 | 판정 | 조치 |
  |---|---|---|
  | 사용량 390 의 표가 카드 오른쪽에서 잘림(네 시안 공통, 기본·서재·무대 보고) | 설계된 가로 스크롤 영역(`.table-wrap`, 스크롤 그림자 + 첫 열 고정, 2026-11-04 결정). 전체 페이지 캡처는 스크롤 안쪽을 못 찍는다 | 미조치(의도) |
  | 서재 `chat-nokey-error` 390 에서 고정 입력창이 오류 상자의 [다시 보내기] 아래를 덮음(무대도 같은 관찰) | API 키 배너로 문서가 뷰포트(844px)보다 길어져 `fullPage` 캡처가 고정 입력창을 문서 중간에 그린 것. 같은 구조의 `chat-error` 390(문서 = 뷰포트)은 겹치지 않음 | 미조치(캡처 방식, `index.md` 설명) |
  | 서재 포트폴리오 목록 제목이 세리프가 아님(10장) | 목록 제목이 `<a>` 가 아니라 `<strong>` 이라 `.list-main a` 규칙이 안 먹음 | **조치**: `.list-main > strong` 도 세리프 |
  | API 키 없음 배너의 운영자 안내 문장 전체가 `<code>` 라 한글 자간이 벌어짐(무대 관찰, 네 시안 공통) | 마크업 문제 | **조치**: `.env`·`LEO_ANTHROPIC_API_KEY` 만 `<code>` 로 감쌈(`ConfigBanner`) |
- 참고(결함 아님으로 판정): 마우스 호버 위치의 선택 카드 회색, 다이얼로그 스크림이 긴 문서 하단을 안 덮는 것, 토스트·입력창이 문서 중간에 찍히는 것 — 모두 `fullPage` 캡처 방식
