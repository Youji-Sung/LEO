# 시각 방향 시안 3개 (1차 세션, 2026-11-04)

세 시안을 같은 화면 세트로 만들어 비교한다. 어느 시안도 적용되어 있지 않다(쿠키가 없으면 현행 화면). 운영자가 아래 "선택" 칸을 채워 push 하면 2차 세션이 그 방향을 전 화면에 반영한다.

문서 순서: `00-understanding.md`(서비스·사용자 이해) → `01-exploration.md`(후보 8개, 선정 이유, 출처) → `02-build-rules.md`(세 시안 공통 규칙과 뼈대) → 시안별 `study/`, `stage/`, `console/`(한 쪽 설명 `README.md` + 스크린샷 `shots/`).

## 비교표

| | 서재 `study` | 무대 `stage` | 콘솔 `console` |
|---|---|---|---|
| 한 줄 | (채움) | (채움) | (채움) |

## 로컬에서 보는 방법

1. 서버를 띄운다: `npm run dev` (모의 모드로 보려면 `.env` 에 `CLAUDE_MOCK=1`).
2. 주소에 쿼리를 붙인다. 쿠키로 저장되므로 그 뒤로는 모든 화면이 그 시안으로 보인다.
   - 서재: `http://localhost:3000/?direction=study`
   - 무대: `http://localhost:3000/?direction=stage`
   - 콘솔: `http://localhost:3000/?direction=console`
   - 현행으로 되돌리기: `http://localhost:3000/?direction=off`
3. 다크 모드는 설정 페이지의 "테마 모드" 또는 OS 설정으로 바꾼다. 세 시안 모두 라이트·다크 팔레트를 따로 가진다.
4. 기본값을 고정하려면 `.env` 에 `LEO_DIRECTION=study|stage|console` (쿠키가 우선).

스크린샷만 보려면 `docs/design/directions/<시안>/shots/` 에 9개 상태 × 1280/390 × 라이트/다크 = 48장이 있다(`index.md` 에 목록). 다시 찍으려면 `npx tsx scripts/screenshots.ts --direction <시안> --axe`.

## 구현 범위와 한계

- 세 시안은 각각 `src/app/directions/<시안>.css` 한 파일이다. 마크업·문구·흐름은 공통이고, 2차 세션이 고른 시안의 CSS 를 토큰(`src/design/tokens.ts`)과 `globals.css` 로 흡수한다.
- CSS 만으로 못 한 것(마크업이 필요한 것)은 각 시안 README 10절에 있다.
- 접근성 하한(텍스트 4.5:1, UI 3:1, 타깃 44/56px, reduced-motion)은 세 시안 모두 지켰다. 수치는 각 README 9절.

## 세션의 추천

(채움)

## 선택 (운영자가 채운다)

- 시안:
- 조정 요청:
