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
