# LEO

개발자의 해외 취업을 돕는 영어 회화 연습 웹사이트. 텍스트 채팅과 10분 전화 영어로 Claude와 영어 대화를 하고, 끝나면 문법·어휘 교정 리포트를 받는다.

- 제품 명세: `docs/SPEC.md`
- 결정 기록: `docs/DECISIONS.md`
- 구현 계획: `docs/PLAN.md`
- 진행 기록(단계별 검증 결과, 미확인 항목): `docs/PROGRESS.md`
- UI/UX 개선(디자인 시스템·문구·화면별 근거·스크린샷): `docs/design/README.md`
- 디자인 4종(기본·서재·무대·콘솔)의 비교·상태·남은 과제: `docs/design/directions/README.md`, 다듬기 기록 `docs/design/POLISH_PROGRESS.md`

## 기능

- **텍스트 채팅**: 테마(자유·면접·일상·업무·비즈니스) 선택, 스트리밍 답변, 교정 힌트 토글(답변 아래 한 줄 교정), 대화 저장·이어하기, 리포트 생성
- **전화 영어**: 테마·시간(10/20/30분)·포트폴리오 선택 → 마이크 확인 → 통화. 브라우저 음성 인식의 문장 조각을 모아 3초 기다린 뒤 전송. ‘인식된 말 확인 후 보내기’로 실제 말한 표현을 수정·확인해 전송할 수 있다. 상대 답변은 문장 단위로 음성 합성. 아이폰은 상대 음성 재생 후 마이크를 켜고 ‘내가 말하기’로 끼어든다. 마이크 다시 켜기·다시 듣기, 음소거, 끊기, 남은 1분에 10분 연장(최대 30분), 만료 시 자동 종료 후 리포트. 음성 미지원 브라우저는 텍스트 입력으로 대체
- **리포트**: 요약, 점수(문법·어휘·유창성·과제 수행), 문법 교정, 어휘 제안, 표현 제안, 다음 과제, 면접류 테마의 STAR 피드백과 예상 질문, 포트폴리오 면접의 기술 설명 명확성 점수. 스키마 검증 실패 시 오류와 재시도
- **기록**: 통화·채팅 목록, 트랜스크립트와 리포트 열람
- **포트폴리오**: 텍스트/마크다운 붙여넣기 또는 PDF 업로드(텍스트 추출), 여러 개 등록, "포트폴리오 면접" 테마에서 선택
- **사용량**: 사용자별·기간별 토큰·추정 비용 합계, 기능별 분포, 최근 호출 50건
- **설정**: 테마 모드(시스템/라이트/다크), 디자인(기본·서재·무대·콘솔 — 색·서체·형태만 다르고 기능은 같다, `docs/design/directions/README.md`), 교정 힌트 기본값, 상대 목소리, 통화 기본 길이

## 기술 스택

- Next.js 16 (App Router, React 19) — 프론트와 API 라우트가 한 프로세스
- Prisma 7 + SQLite (`better-sqlite3` 어댑터). 스키마는 Postgres 호환
- `@anthropic-ai/sdk` 1.x — 모델 `claude-opus-5`, 스트리밍, 구조화 출력, 프롬프트 캐싱, 서버 측 refusal fallback
- Vitest(단위·통합), Playwright(E2E, 가짜 VoiceAdapter 주입), `@axe-core/playwright`(접근성 자동 점검)
- UI: 전역 CSS + 디자인 토큰(`src/design/tokens.ts` → `src/app/tokens.css`, 라이트·다크), 디자인 4종(`src/design/directions.ts` → `src/app/directions/tokens.css` + `src/app/directions/<디자인>.css`), 컴포넌트 `src/components/ui/`, 문구 `src/content/ko.ts`, 서체 Pretendard Variable(jsDelivr 다이나믹 서브셋; 서재·콘솔은 Google Fonts 추가), 아이콘 `lucide-react`

## 설치와 실행

요구 사항: Node.js 22 이상, npm.

```bash
bash scripts/bootstrap.sh   # .env 생성(AUTH_SECRET 자동), npm install, prisma generate, migrate, 시드
npm run dev                 # http://localhost:3000
```

시드 계정: `dev1@leo.local`, `dev2@leo.local` (비밀번호는 `.env`의 `SEED_USER_PASSWORD`, 기본 `leo-pass-1234`). 회원가입 화면도 있다.

프로덕션:

```bash
npm run build && npm start
```

Windows에서 기존 외부 접속 주소에 업데이트하려면 **`deploy.bat`를 더블클릭**한다. 별도 빌드 → 임시 포트에서 사전 검사 → 기존 포트의 앱 교체 → 같은 외부 주소에서 새 빌드 확인까지 진행한다. **기존 Cloudflare 터널과 주소를 유지하며 새 터널은 만들지 않는다.** 앱 교체 순간에는 짧은 접속 중단이 있고, 실패하면 이전 앱 복구를 시도한다. 배포 완료 후 창을 닫아도 앱과 터널은 계속 실행된다. 처음 주소를 지정하는 방법과 터널이 꺼졌을 때의 제한은 [배포 안내](docs/DEPLOY_TUNNEL.md)를 참고한다.

## 환경 변수

`.env.example`을 `.env`로 복사해 채운다 (`bootstrap.sh`가 해 준다).

| 변수 | 필수 | 설명 |
|---|---|---|
| `LEO_ANTHROPIC_API_KEY` | 실제 사용 시 | 웹사이트가 Claude API를 호출할 때 쓰는 키. `ANTHROPIC_API_KEY`라는 이름은 쓰지 않는다. 비어 있으면 화면 상단에 안내 배너가 뜨고(통화 화면 제외) 채팅·통화 시 오류 메시지를 보여 준다 |
| `LEO_CLAUDE_MODEL` | 아니오 | 기본 `claude-opus-5`. 날짜 접미사 없는 모델 ID |
| `CLAUDE_MOCK` | 아니오 | `1`이면 API를 호출하지 않고 결정적인 가짜 응답. 테스트와 UI 작업용. 헤더에 "모의 모드" 칩 표시 |
| `DATABASE_URL` | 예 | 기본 `file:./dev.db` (프로젝트 루트 기준) |
| `AUTH_SECRET` | 예 | 세션 토큰 해시용 비밀값, 32자 이상. `bootstrap.sh`가 생성 |
| `APP_URL` | 아니오 | 공개 URL. `https://`로 시작하면 세션 쿠키에 `Secure` |
| `SEED_USER_PASSWORD` | 아니오 | 시드 사용자 비밀번호 |
| `LEO_MAX_TURNS` | 아니오 | 대화 1건당 사용자 턴 상한(기본 60). 서버가 초과 시 429 |
| `LEO_ALLOW_SHORT_CALLS` | 아니오 | `1`이면 20초 테스트 통화 옵션 노출(E2E·테스트 전용) |

Claude 사용 단가는 `src/config/pricing.ts`에서 바꾼다.

토큰 비용 최적화: 대화는 시스템·포트폴리오 캐시와 함께 누적 메시지까지 5분 프롬프트 캐시를 사용한다. 모델·프롬프트·전체 대화·추론 수준·출력 상한은 유지한다. 리포트는 같은 사용자·대화·입력이 동시에 요청된 경우에만 진행 중 작업을 공유한다(단일 프로세스). 완료 후 다시 생성하거나 실패 후 재시도하는 동작은 유지한다. 캐시 읽기는 입력 단가를 낮추며 토큰 수 자체를 없애지는 않는다. 운영 중 새 버전을 띄울 때는 `docs/DEPLOY_TUNNEL.md`의 별도 포트·빌드 폴더 절차를 따른다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (`127.0.0.1`로 접속해도 되도록 `allowedDevOrigins` 설정됨) |
| `npm run build` / `npm start` | 프로덕션 빌드 / 실행 |
| `deploy.bat` | 기존 터널·주소 유지, 사전 검사 후 앱 교체·외부 확인·실패 시 이전 앱 복구 |
| `deploy.bat --url <기존 주소>` | 기존 터널이 여러 개일 때 사용할 주소 지정. 성공하면 다음 실행부터 기억 |
| `deploy.bat --check` / `deploy.bat --build-only` | 사전 점검만 / 빌드까지만 실행(서버·터널 시작 안 함) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest 단위·통합 테스트 (항상 `CLAUDE_MOCK=1`, 별도 `test.db`) |
| `npm run test:e2e` | Playwright E2E. 포트 3100, 별도 `e2e.db`, 모의 모드 서버를 자동으로 띄운다 |
| `npm run test:deploy` | 주소 유지·교체 순서·실패 복구·프로세스 소유권 테스트(공개 터널·유료 API 호출 없음) |
| `npm run check` | lint → typecheck → test → test:deploy → build |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:migrate:dev` | `prisma migrate dev` (스키마 변경 시) |
| `npm run db:seed` | 개발용 사용자 2명 시드 |
| `npx tsx scripts/smoke-claude.ts` | 실제 API 로 리포트 생성 1회 호출해 키·모델 확인(비용 발생, 약 $0.1) |
| `npx tsx scripts/screenshots.ts --phase after [--axe] [--widths 360,640,768] [--reduced-motion] [--only call,chat]` | 모의 서버를 띄워 모든 화면·상태를 1280/390 × 라이트/다크로 촬영(`docs/design/screenshots/`), axe 검사·가로 스크롤 검사 |
| `npx tsx scripts/screenshots.ts --direction basic\|study\|stage\|console [--axe] [--widths …] [--reduced-motion] [--compare]` | 디자인 하나를 골라 모든 화면·상태를 `docs/design/screenshots/directions/<디자인>/` 에 촬영(`--compare` 는 1차 비교 세트 9개만 `docs/design/directions/<디자인>/shots/`). 디자인 설명은 `docs/design/directions/README.md` |
| `npx tsx scripts/build-tokens.ts [--check] [--table]` | 디자인 토큰 TS → `tokens.css` 생성, 대비 표 출력 |
| `npm run build && npx tsx scripts/perf.ts [--direction basic\|study\|stage\|console]` | 프로덕션 서버로 첫 로드 CLS·전송량 측정(`docs/design/PERF.md`, 디자인을 주면 `docs/design/screenshots/directions/<디자인>/perf.md`) |

E2E는 Playwright가 설치한 Chromium을 쓰고, 없으면 `CHROME_PATH`의 Chrome을 헤드리스로 쓴다. `npm test`와 `npm run test:e2e`를 동시에 돌리지 않는다(둘 다 DB 파일을 새로 만든다). E2E 서버는 `scripts/e2e-server.mjs`가 띄우며 빌드 폴더를 `.next-e2e`로 분리하므로 `npm run dev`가 켜져 있어도 함께 돌 수 있다.

## 수동 점검 체크리스트 (실제 브라우저)

E2E 는 가짜 VoiceAdapter 로 돌기 때문에 아래는 사람이 Chrome(데스크톱·Android)에서 직접 확인한다.

1. `/call` 에서 "마이크 권한 확인"을 누르면 브라우저 권한 팝업이 뜨고, 허용하면 "마이크를 사용할 수 있습니다."가 표시된다. 거부하면 안내 문구가 뜨고 텍스트 입력으로 통화가 가능하다.
2. "다음" → "통화 시작"을 누르면 상대의 첫 인사가 음성으로 재생되고 상태가 "듣는 중"으로 바뀐다.
3. 영어로 말하면 인식 내용이 보이고, 말이 확정된 뒤 3초 동안 더 말하지 않으면 한 번에 전송된다. 1~2초 쉬었다 이어 말했을 때 한 말풍선에 합쳐지는지 확인한다.
4. 아이폰에서는 상대 답변 재생 중 ‘내가 말하기’를 눌러 마이크로 전환한다. 다른 기기의 동시 입출력 모드에서는 말을 시작하면 TTS가 끊긴다.
5. "음소거"를 누르면 인식이 멈추고(상태 "음소거"), 해제하면 다시 "듣는 중"이 된다.
6. 10초 이상 말이 없어 브라우저가 인식을 멈춰도 자동으로 다시 듣기 시작한다.
7. 남은 시간이 1:00 이하가 되면 "10분 연장" 버튼이 나타나고, 누르면 타이머가 늘어난다(최대 30분).
8. "끊기" 또는 타이머 만료 시 "리포트를 만드는 중" 안내 후 리포트 화면으로 이동한다.
9. 모바일 폭(≤600px)에서 타이머·대화·끊기 버튼이 가려지지 않고, 끊기 버튼은 항상 하단 중앙에 있다. "듣는 중"·"상대가 말하는 중" 펄스가 OS 의 "동작 줄이기" 설정에서는 멈춘다.
10. 설정 페이지에서 상대 목소리를 바꾸고 "미리 듣기"가 그 목소리로 재생된다. 테마 모드를 다크로 바꿔 저장하면 새로고침·다른 페이지에서도 깜빡임 없이 다크로 뜬다.
11. Safari 등 `SpeechRecognition` 미지원 브라우저에서는 안내 문구와 텍스트 입력이 표시된다.
12. 실제 키로 채팅을 한 번 해서 교정 힌트 줄(`[HINT]`)이 답변에 섞여 보이지 않고 아래에 작게 표시되는지 확인한다(클라우드 세션은 리포트 호출 1회만 실제로 검증했다).
13. ‘인식된 말 확인 후 보내기’를 켜고 말한다. 쉬어도 자동 전송되지 않고, ‘인식된 말 수정’에서 실제 말한 문법으로 고쳐 보내면 기록과 리포트 입력에 그대로 남는지 확인한다. 확인하지 않은 초안은 통화 종료 시 자동 제출하지 않는다.
14. 아이폰 13 mini의 Chrome에서 첫 방문·통화 재개·화면 잠금 후 복귀를 확인한다. 음성이 안 들리면 ‘상대 답변 다시 듣기’, 마이크가 반응하지 않으면 ‘마이크 다시 켜기’로 화면 이동 없이 복구되는지 확인한다. 실제 휴대폰 재생음·마이크는 자동 테스트로 검증되지 않는다.

## 알려진 제한

- 통화 화면을 새로고침하면 서버에 기록된 시작 시각("통화 시작" 클릭 시점) 기준으로 남은 시간을 복원한다. 상대의 첫 인사는 다시 재생하지 않는다.
- 단일 프로세스 전제: 같은 대화에 대한 동시 전송은 프로세스 안의 락으로 직렬화한다. 여러 인스턴스로 띄우면 이 보호가 사라진다.
- Chrome 은 TTS 가 재생되는 동안 마이크가 상대 음성을 일부 받아 적을 수 있다. 헤드폰 사용을 권장한다.
- Web Speech 지원은 기기·브라우저에 따라 다르다. 지원 여부를 감지해 음성 인식 미지원 환경에서는 텍스트 입력을 제공한다.
- 브라우저가 이미 정규화한 인식문에서 원래의 문법 오류나 발음을 복원할 수는 없다. 오류가 바뀌었다면 확인 모드에서 실제 말한 표현으로 고쳐 보낸다. 이 리포트는 오디오 자체의 발음 평가가 아니다.
- 추가 음성 API 비용은 없다. 설치된 고품질 영어 음성이 브라우저 목록에 있으면 우선 사용하지만, 기기에서 제공하지 않는 자연스러운 음성을 새로 만들어 내지는 못한다. 설정에서 목소리 선택·미리 듣기를 사용할 수 있다.
- 사용량 페이지는 모든 사용자의 사용량을 모두에게 보여 준다(운영자 단일 키, 사용자 2명 전제).
- 리포트 생성은 보통 30초~1분 걸린다(`effort: high`).
- 스캔 이미지 PDF 는 텍스트가 추출되지 않는다.
