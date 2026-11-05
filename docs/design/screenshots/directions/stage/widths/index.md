# 스크린샷 목록 (stage)

각 상태는 `--1280-light`, `--1280-dark`, `--390-light`, `--390-dark` 네 장이 있다.

캡처 방식: `fullPage` 로 문서 전체를 찍으므로 고정 요소(채팅 입력창, 통화 컨트롤, 다이얼로그 스크림)가 긴 화면에서는 문서 중간 위치에 찍힌다. 실제 브라우저에서는 뷰포트 하단에 고정되고 스크림은 화면 전체를 덮는다(7단계 리뷰 A 32).

| 파일 접두사 | 상태 |
|---|---|
| `login` | 로그인 |
| `login-error` | 로그인 오류(잘못된 비밀번호) |
| `signup` | 회원가입 |
| `home-empty` | 홈 · 빈 상태 |
| `chat-list-empty` | 채팅 목록 · 빈 상태 |
| `history-empty` | 기록 · 빈 상태 |
| `portfolios-empty` | 포트폴리오 · 빈 상태 |
| `usage-empty` | 사용량 · 빈 상태 |
| `call-setup-portfolio-empty` | 통화 설정 · 포트폴리오 면접인데 포트폴리오 없음 |
| `home` | 홈 |
| `chat-list` | 채팅 목록 |
| `chat-empty` | 채팅 · 대화 시작 전 |
| `chat-hints` | 채팅 · 대화 중 + 교정 힌트 |
| `chat-sending` | 채팅 · 답변 기다리는 중 |
| `chat-error` | 채팅 · 응답 오류 + 다시 시도 |
| `chat-ended` | 채팅 · 종료된 대화 |
| `call-setup` | 통화 설정 |
| `call-setup-mic-ok` | 통화 설정 · 마이크 확인 후 |
| `call-setup-mic-denied` | 통화 설정 · 마이크 권한 거부 |
| `call-setup-mic-notfound` | 통화 설정 · 마이크 없음 |
| `call-idle` | 통화 · 시작 전 |
| `call-live` | 통화 중(듣는 중, 연장 버튼) → 종료 중 → 통화 리포트 |
| `call-muted` | 통화 중(듣는 중, 연장 버튼) → 종료 중 → 통화 리포트 |
| `call-ending` | 통화 중(듣는 중, 연장 버튼) → 종료 중 → 통화 리포트 |
| `report-call-interview` | 통화 중(듣는 중, 연장 버튼) → 종료 중 → 통화 리포트 |
| `call-text-mode` | 통화 · 음성 인식 미지원(텍스트 입력) |
| `call-mic-denied` | 통화 · 마이크 권한 거부로 글 입력 전환 |
| `call-send-error` | 통화 · 보내지 못한 말 + 다시 보내기 |
| `report-chat-interview` | 리포트(채팅·면접) |
| `report-missing` | 리포트 · 생성 실패(스키마) + 다시 시도 |
| `report-error` | 리포트 · 생성 실패(스키마) + 다시 시도 |
| `chat-refusal` | 채팅 · 상대가 답하지 않기로 함(refusal) |
| `chat-network-error` | 채팅 · 네트워크 끊김 |
| `chat-remake-dialog` | 채팅 · 리포트 다시 만들기 확인 대화 |
| `portfolios-delete-dialog` | 포트폴리오 · 삭제 확인 대화 |
| `settings-saved` | 설정 · 저장 토스트 |
| `transcript` | 트랜스크립트 |
| `history` | 기록 목록 |
| `portfolios` | 포트폴리오 목록 |
| `portfolios-pdf-mode` | 포트폴리오 · PDF 업로드 모드 |
| `usage` | 사용량 |
| `settings` | 설정 |
| `home-nokey` | 홈 · API 키 없음 배너 |
| `chat-nokey-error` | 채팅 · API 키 없음 오류 |
| `chat-turn-cap` | 채팅 · 대화 횟수 한도 |
| `call-turn-cap` | 통화 · 대화 횟수 한도로 종료 |
