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
