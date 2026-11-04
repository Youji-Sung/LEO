# UI/UX 개선 진행 기록

단계별 완료 조건의 확인 결과를 적는다. 형식: `- [x|미확인] 조건 — 확인 방법 — 결과(수치)`

## 0단계. 현황 조사와 도구

- [x] 스크린샷 스크립트 — `scripts/screenshots.ts` 작성, `npx tsx scripts/screenshots.ts --phase before --axe` 실행 — 자체 Next 개발 서버(포트 3150, `shots.db`, `CLAUDE_MOCK=1`, 가짜 VoiceAdapter) 2회 기동(모의 모드 → API 키 없음 모드), 34개 상태 × 4변형(1280·390 × 라이트·다크) = 136장, 실패 0, 소요 약 8분. 상태 목록은 `screenshots/before/index.md`
- [x] before 스크린샷 전부 — PLAN 의 요구 상태 17종(로그인, 회원가입, 홈, 채팅 빈/대화 중/힌트, 통화 설정, 통화 중, 종료 중, 리포트, 리포트 오류, 기록, 포트폴리오 빈/목록, 사용량, 설정, API 키 없음 배너) 모두 포함 + 추가 17종(로그인 오류, 빈 상태 5종, 통화 설정 포트폴리오 없음·마이크 확인 후, 통화 시작 전·음소거·텍스트 모드, 채팅 전송 중·오류·종료, 리포트 없음, 트랜스크립트, PDF 모드, API 키 없음 채팅 오류). 용량 9.1MB(1x PNG)
- [x] 휴리스틱 평가 — `AUDIT.md`: 12개 화면 영역, 81건(심각도 3 = 13, 2 = 46, 1 = 22), 각 항목에 휴리스틱 번호·증거 스크린샷 파일명. 심각도 척도는 NN/g 0~4
- [x] axe 자동 점검 — 136장 전부 검사(`screenshots/before/axe.md`, `axe.json`) — 위반 3종 118노드: `color-contrast` 64(리포트 교정문 초록 4.32:1), `page-has-heading-one` 44(채팅·통화 화면 h1 없음), `scrollable-region-focusable` 10(사용량 표). 대비 실제 값 23조합을 `src/lib/contrast.ts` 로 계산해 AUDIT 표에 기록(AA 미달 5조합)
- [x] UI 문자열 전수 인벤토리 — `STRINGS.md`: `grep -rn -P "[가-힣]" src`(주석·generated 제외) 후보 368줄을 368/368 읽고 분류. 사용자 노출 316줄 → 347행(서로 다른 문구 281, 비한글 11행 포함), 제외 30줄, 모의 응답 22줄. 316 + 30 + 22 = 368 검산
- [x] `npm run check`(lint·typecheck·vitest 76개·build) 종료 코드 0, `npm run test:e2e` 18개 통과(1.4분), 종료 코드 0 — 둘 다 순차 실행
- 메모: 클라우드 컨테이너에 한글 글꼴이 없어 `apt-get install fonts-noto-cjk` 로 Noto Sans CJK 를 설치한 뒤 촬영했다(저장소 변경 아님). 다른 환경에서 재촬영하면 글꼴이 달라질 수 있다
- 메모: 다크 변형 68장은 코드에 다크 모드가 없어 라이트와 바이트 단위로 동일(`cmp` 로 2쌍 확인)
- 미확인: 360px·768px 폭은 0단계 범위(1280·390)에 없어 찍지 않았다. 6단계 반응형 검증에서 촬영한다

## 1단계. 조사와 원칙

- [x] 외부 가이드라인 읽기 — `RESEARCH.md` 1부(WCAG 2.2 조항 19개 + Understanding 6편, Apple HIG 5페이지, Material 3 6페이지 + M2 접근성, 한국어 타이포 2편, 폰트 4종), 2부(NN/g 6편, Google 대체 2편, Microsoft 5편, Polaris 저장소 원본 4편, Atlassian 7편, 국립국어원 길잡이 PDF·KRDS, 토스 4편 + 해요체/버튼 관련 6편, Duolingo 4편), 3부(제품 16개) — 서브에이전트 3개가 WebFetch 로 읽고 URL·발췌·적용을 적음. 메인 세션이 전문을 읽고 통합. "읽음: 예" 표기 80건, "확인 못 함" 표기 36줄(접근 실패 목록 3개 표, `grep -c` 로 셈)
- [x] 접근 실패 명시 — Material 3 콘텐츠 디자인 5페이지(SPA/404 → Google Codelab 대체), Polaris voice-and-tone·actionable-language(삭제됨 → 저장소 원본 empty-state 로 대체), Apple HIG(JS 렌더링 → JSON 엔드포인트), OpenAI 헬프센터(403), ChatGPT 오브 상태별 모양·Zoom 화자 테두리 색·카카오·네이버 가이드 등은 "확인 못 함" 으로 남김
- [x] 레퍼런스 분석 — 3부에 제품 16개(언어 학습 4, 면접 3, 통화 UI 5, 리포트·타이포 3)마다 본 자료·관찰·가져올 것·가져오지 않을 것·이유
- [x] 사용자·상황 분석 — `PRINCIPLES.md` 1절: 핵심 순간 3개 × 인지 부하·감정·손/눈·바라는 것·하면 안 되는 것 표
- [x] 톤 결정 — `PRINCIPLES.md` 2절: 후보 3개를 순간 3개 × 레퍼런스로 비교, "차분한 코치(목소리) + 개발자 도구(시각) + 온기(시작·칭찬)" 채택, 기각 이유 기록. Voice & tone 차트 7상황(시작·통화 중·실수·칭찬·오류·비용/한도·운영 상태)
- [x] 디자인 원칙 5개 — 각각 "하지 않는 것" 포함, AUDIT 81건과의 대응표 포함
- [x] `npm run check`·`npm run test:e2e` — 1단계는 문서만 바꿔 코드 변경이 없다. 0단계 통과 결과(76 단위·18 E2E)가 그대로 유효
- 미확인: WCAG 2.2 본문 마지막 69,706자(용어 정의)·Apple Typography JSON 뒤 81,026자·M3 라이트/다크 기본 톤 표는 읽지 못했다. 필요한 수치는 Understanding 페이지·Apple Accessibility 표·Material Web 토큰 소스로 대신 확인했다
