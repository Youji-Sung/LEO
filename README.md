# LEO

개발자의 해외 취업을 돕는 영어 회화 연습 웹사이트. 텍스트 채팅과 10분 전화 영어로 Claude와 영어 대화를 하고, 끝나면 문법·어휘 교정 리포트를 받는다.

- 제품 명세: `docs/SPEC.md`
- 결정 기록: `docs/DECISIONS.md`
- 구현 계획: `docs/PLAN.md`
- 진행 기록: `docs/PROGRESS.md`

## 기술 스택

- Next.js 16 (App Router, React 19) — 프론트와 API 라우트가 한 프로세스에서 동작
- Prisma 7 + SQLite (`better-sqlite3` 드라이버 어댑터)
- Vitest(단위·통합), Playwright(E2E)
- `@anthropic-ai/sdk`

## 로컬 실행

요구 사항: Node.js 22 이상, npm.

```bash
bash scripts/bootstrap.sh   # .env 생성, 의존성 설치, Prisma 생성, 마이그레이션, 시드
npm run dev                 # http://localhost:3000
```

`bootstrap.sh`는 `.env`가 없으면 `.env.example`을 복사하고 `AUTH_SECRET`을 자동 생성한다. Claude API를 실제로 쓰려면 `.env`의 `LEO_ANTHROPIC_API_KEY`를 채운다. 비워 두면 채팅·통화에서 안내 문구가 뜬다. `CLAUDE_MOCK=1`이면 API 없이 가짜 응답으로 전체 흐름을 써 볼 수 있다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm start` | 프로덕션 빌드 / 실행 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest 단위·통합 테스트 (항상 `CLAUDE_MOCK=1`) |
| `npm run test:e2e` | Playwright E2E. 별도 포트(3100)와 별도 DB(`prisma/e2e.db`)로 모의 모드 서버를 띄운다 |
| `npm run check` | lint → typecheck → test → build |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:migrate:dev` | `prisma migrate dev` (스키마 변경 시) |
| `npm run db:seed` | 개발용 사용자 2명 시드 |

E2E는 Playwright가 설치한 Chromium을 쓰고, 없으면 `CHROME_PATH`의 Chrome을 헤드리스로 쓴다.

## 환경 변수

`.env.example`을 `.env`로 복사해 채운다. 변수 설명은 그 파일 안에 있다.

## 수동 점검 체크리스트 (실제 브라우저)

E2E 는 가짜 VoiceAdapter 로 돌기 때문에 아래는 사람이 Chrome(데스크톱·Android)에서 직접 확인한다.

1. `/call` 에서 "마이크 권한 확인"을 누르면 브라우저 권한 팝업이 뜨고, 허용하면 "마이크를 사용할 수 있습니다."가 표시된다. 거부하면 안내 문구가 뜨고 텍스트 입력으로 통화가 가능하다.
2. "다음" → "통화 시작"을 누르면 상대의 첫 인사가 음성으로 재생되고 상태가 "듣는 중"으로 바뀐다.
3. 영어로 말하면 회색 기울임 글씨(중간 인식)가 보였다가 확정되면 파란 말풍선으로 올라가고, 2~3초 안에 상대 답변이 스트리밍되며 문장 단위로 읽힌다.
4. 상대가 말하는 도중에 내가 말을 시작하면 TTS 가 즉시 끊긴다.
5. "음소거"를 누르면 인식이 멈추고(상태 "음소거"), 해제하면 다시 "듣는 중"이 된다.
6. 10초 이상 말이 없어 브라우저가 인식을 멈춰도 자동으로 다시 듣기 시작한다.
7. 남은 시간이 1:00 이하가 되면 "10분 연장" 버튼이 나타나고, 누르면 타이머가 늘어난다(최대 30분).
8. "끊기" 또는 타이머 만료 시 "리포트를 만드는 중" 안내 후 리포트 화면으로 이동한다.
9. 모바일 폭(≤600px)에서 타이머·트랜스크립트·끊기 버튼이 가려지지 않는다.
10. 설정 페이지에서 TTS 음성을 바꾸고 "미리 듣기"가 그 음성으로 재생된다.
11. Safari 등 `SpeechRecognition` 미지원 브라우저에서는 안내 문구와 텍스트 입력이 표시된다.

알려진 제한: 통화 화면을 새로고침하면 타이머가 처음부터 다시 시작한다(대화 내용은 유지). Chrome 은 TTS 가 재생되는 동안 마이크가 상대 음성을 일부 받아 적을 수 있으므로 헤드폰 사용을 권장한다.
