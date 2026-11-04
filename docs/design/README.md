# LEO UI/UX 개선 — 문서 지도

2026-11-04 클라우드 세션이 `PLAN.md` 0~8단계를 수행한 결과. 모든 결정은 근거와 함께 남겼고, before/after 스크린샷과 자동 검사 결과가 저장소에 있다.

## 무엇을 어디서 보는가

| 알고 싶은 것 | 문서 |
|---|---|
| 전제·확정 사항·품질 기준 | `BRIEF.md` |
| 단계와 완료 조건 | `PLAN.md` |
| 단계별로 무엇을 어떻게 확인했는가(수치, 미확인 항목), 7단계 리뷰 62건의 조치·미조치 | `PROGRESS.md` |
| 왜 그렇게 했는가(결정 · 근거 · 기각한 대안 · 출처) | `DECISIONS.md` |
| 개선 전 문제 목록(81건, 심각도, 증거) | `AUDIT.md` |
| 읽은 외부 가이드라인·레퍼런스 발췌(출처 URL, 접근 실패 목록) | `RESEARCH.md` |
| 톤 결정, voice & tone 차트, 디자인 원칙 5개 | `PRINCIPLES.md` |
| 한국어 문구 규칙과 용어집 | `WRITING.md` |
| 문구 전수 인벤토리(개선 전) / 개정표(원문→개정→이유, 4절은 7단계 리뷰 반영분) | `STRINGS.md` / `STRINGS-REVISED.md` |
| 토큰(색·타이포·간격·모션), 대비 표, 폰트·아이콘 결정, 컴포넌트 명세 | `SYSTEM.md` |
| 화면별 "문제 → 결정 → 근거 → 대안 → after 스크린샷"(8절은 7단계 리뷰로 바뀐 것) | `SCREENS.md` |
| 상태 표(화면 × 상태), 모션의 reduced-motion 대체, 포커스 규칙 | `STATES.md` |
| 첫 로드 성능(CLS·전송량) | `PERF.md` |
| 스크린샷 | `screenshots/before/`, `screenshots/after/`(각 34개 상태 × 1280/390 × 라이트/다크 + `axe.md`), `screenshots/after-widths/`(360/640/768 + 가로 스크롤 검사), `screenshots/after-reduced-motion/` |

코드에서 보는 곳: 문구 `src/content/ko.ts`, 토큰 `src/design/tokens.ts`(생성물 `src/app/tokens.css`), 전역 CSS `src/app/globals.css`, 컴포넌트 `src/components/ui/`, 테마 `src/lib/theme.ts`, 도구 `scripts/screenshots.ts`·`scripts/build-tokens.ts`·`scripts/perf.ts`.

## before / after 대표 화면

| 화면 | before | after |
|---|---|---|
| 통화 중(모바일) | `screenshots/before/call-live--390-light.png` — 13px 알약 상태, 작은 끊기 버튼이 왼쪽에, 헤더·배너가 화면 23% | `screenshots/after/call-live--390-light.png` — 아이콘+글자 상태 카드, 링 타이머, 끊기 56px 중앙 고정, 전용 레이아웃 |
| 통화 중(다크) | (다크 모드 없음) | `screenshots/after/call-live--390-dark.png` |
| 리포트(모바일) | `screenshots/before/report-chat-interview--390-light.png` — 점수 바 1.28:1, 취소선, 초록 4.32:1, 목차 없음 | `screenshots/after/report-chat-interview--390-light.png` — 목차, 등급 배지, "내가 한 말 / 이렇게 말해요" 두 줄, 다음 행동 버튼 |
| 통화 설정 | `screenshots/before/call-setup--390-light.png` — select 에 설명이 잘림 | `screenshots/after/call-setup--390-light.png` — 테마 카드, 마이크 상태 메시지 |
| 채팅 | `screenshots/before/chat-hints--1280-light.png` — 힌트가 상대 말풍선 안에 | `screenshots/after/chat-hints--1280-light.png` — 힌트가 말풍선 밖 별도 블록, 고정 입력창 |
| 홈(모바일) | `screenshots/before/home--390-light.png` — 메뉴 2줄, 세로로 깨진 로그아웃 | `screenshots/after/home--390-light.png` — 메뉴 버튼, 행동 카드 2개, 라벨 있는 목록 버튼 |
| 포트폴리오 삭제 | 브라우저 `confirm` | `screenshots/after/portfolios-delete-dialog--390-light.png` — [삭제][취소] 다이얼로그 |

## 결정 요약

- 톤: 목소리는 "차분한 코치", 시각은 "개발자 도구 감성", 온기는 시작·칭찬 순간에만. 해요체 전면, 주 버튼 "~하기", 오류는 "무슨 일 + 할 일", 기술 정보 금지.
- 원칙 5개: P1 통화 중에는 한 번에 하나만 · P2 숫자보다 다음 행동 · P3 같은 뜻 같은 말, 같은 역할 같은 모양 · P4 접근성은 기본값 · P5 조용한 화면, 분명한 글.
- 시스템: 역할 토큰 31개 × 라이트/다크(모두 AA 이상, 테스트로 고정), Pretendard Variable 다이나믹 서브셋, lucide 아이콘, 컴포넌트 17종(단위 테스트 100개), `UserSettings.theme` + 쿠키로 FOUC 없는 테마 전환.
- 화면: 통화 전용 레이아웃·고정 컨트롤 격자, 리포트 순서(인정→점수→면접→교정→제안→다음 행동)+목차, 테마 카드 라디오, 네이티브 confirm → Dialog, 빈 상태·오류·토스트 통일, 포커스 규칙.
- 리뷰 패스(7단계)로 바뀐 것: 모의 모드 배너 → 헤더 칩, 로마자 뒤 조사 붙여쓰기, 보조 버튼 명사형, 교정(이렇게 말해요)과 제안(이렇게도 말해요) 구분, 실패한 메시지 보존, 표시 시간대 Asia/Seoul 고정, 포커스 이동 버그(div autoFocus) 수정.

## 검증 수치 (자세한 것은 PROGRESS.md)

- 단위·통합 테스트 251개, E2E 21개(기본 18 + 키보드 전용 3), 모두 통과.
- 대비: 토큰 조합 66개 전부 AA 이상(최저 라이트 3.10:1 UI, 5.32:1 텍스트).
- axe: before 118노드(대비 64, h1 44, 스크롤 영역 10) → after 의 최종 수치는 PROGRESS 6단계.
- 반응형: 360/390/640/768/1280 폭에서 가로 스크롤 0장(262장 자동 검사).
- 성능: CLS 최대 0.0001, CSS 41.6KB, 폰트 128~368KB(서브셋).

## 운영자가 실제 브라우저에서 볼 것

클라우드 세션에는 마이크·스피커·실제 Claude 키가 없다. README 의 수동 점검 체크리스트(마이크 권한, TTS, 끼어들기, 음소거, 연장, 다크 모드 전환, "동작 줄이기" 에서 펄스 정지, Chrome/Android 통화 화면)를 사람이 확인해야 한다.
