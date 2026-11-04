# 클라우드 세션 실행 안내

이 문서는 운영자가 본다. 세션에 보내는 프롬프트는 맨 아래에 있다.

## 1. 환경 설정 (claude.ai/code → 환경 선택기 → 환경 편집)

### Environment variables (`.env` 형식)

```
LEO_ANTHROPIC_API_KEY=sk-ant-...
LEO_CLAUDE_MODEL=claude-fable-5-1
BASH_DEFAULT_TIMEOUT_MS=600000
```

`LEO_ANTHROPIC_API_KEY`는 웹사이트용 키다. 이름을 `ANTHROPIC_API_KEY`로 바꾸면 세션의 Claude Code가 그 키를 가져다 쓸 수 있다. 네트워크 시크릿은 `api.anthropic.com`에 붙지 않으므로 환경 변수로 넣는다. UI/UX 작업 세션은 이 키를 쓰지 않는다(실제 호출 0회).

### Network access

- 기능 구현 작업: `Trusted`(기본)로 충분하다.
- **UI/UX 작업: `Full`로 바꾼다.** 세션이 외부 가이드라인(W3C, Apple, Google, NN/g 등)과 레퍼런스 제품 페이지를 WebFetch로 읽어야 한다. `Trusted`에서는 패키지 레지스트리 외 사이트가 막혀 "확인 못 함"만 쌓인다. `Custom`으로 제한하려면 최소 아래를 넣고 "기본 목록 포함"을 체크한다.

```
www.w3.org
developer.apple.com
m3.material.io
material.io
www.nngroup.com
learn.microsoft.com
polaris.shopify.com
atlassian.design
fonts.googleapis.com
fonts.gstatic.com
github.com
raw.githubusercontent.com
developer.mozilla.org
nextjs.org
www.prisma.io
playwright.dev
vitest.dev
```

실행 중인 세션에도 약 1분 안에 적용된다.

### Setup script

비워 둔다. 의존성 설치는 저장소의 `scripts/install_pkgs.sh`가 SessionStart 훅으로 처리한다.

## 2. 세션 시작

### 터미널에서

저장소 루트에서, 최신 커밋이 push된 상태로:

```bash
claude --cloud "docs/CLOUD_TASK.md 의 '세션 프롬프트' 절을 그대로 수행해."
```

### 브라우저에서

claude.ai/code → 저장소 `Youji-Sung/LEO`, 브랜치 `main` → 권한 모드 **Auto**(없으면 Accept edits) → 모델은 가장 높은 등급, effort 높음 → 아래 프롬프트를 붙여 넣는다. Plan 모드는 질문으로 멈추므로 쓰지 않는다.

## 3. 세션이 끝난 뒤

- claude.ai/code의 Changes 카드에서 diff를 보고 PR을 만든다. 또는 `claude --teleport <session-id>`.
- `docs/design/PROGRESS.md`의 "미확인" 항목과 `docs/design/screenshots/after/`를 본다.
- 실제 브라우저에서 다크 모드, 모션, 통화 화면을 직접 확인한다(클라우드에는 오디오 장치가 없다).

## 세션 프롬프트 (UI/UX 개선)

```
CLAUDE.md 를 읽고, docs/design/BRIEF.md 와 docs/design/PLAN.md 를 전부 읽은 뒤 PLAN 의 0단계부터 8단계까지 순서대로 끝까지 수행해.

규칙:
- 조사(0·1단계) 없이 화면부터 고치지 마. 외부 가이드라인과 레퍼런스는 실제로 읽고 출처 URL 을 docs/design/RESEARCH.md 에 남겨. 읽지 못한 건 "확인 못 함"이라고 써.
- 모든 디자인·문구 결정은 docs/design/DECISIONS.md 에 "결정 · 근거 · 기각한 대안 · 출처"로 기록해. 근거 없는 결정은 하지 마.
- 사용자에게 질문하지 말고, 판단이 필요하면 BRIEF 의 제약 안에서 결정해서 기록하고 진행해.
- 각 단계의 완료 조건을 실제로 실행해서 확인한 뒤에만 닫고, docs/design/PROGRESS.md 에 수치와 함께 적어. 확인 못 한 것은 "미확인"으로 남겨.
- 단계마다 npm run check 와 npm run test:e2e 를 통과시키고 커밋해. 테스트를 지워서 통과시키지 마. 모든 단계가 끝나면 push 해.
- 원칙·토큰·용어집을 먼저 확정한 뒤, 독립적인 작업(컴포넌트, 문구 개정, 화면별 재설계)은 서브에이전트로 병렬화해.
- 실제 Claude API 는 한 번도 호출하지 마. 전부 CLAUDE_MOCK=1.
- 8단계 마무리 보고를 마지막 메시지로 남겨.

모든 단계가 끝나기 전에는 멈추지 마.
```

## 이전 작업 프롬프트 (기능 구현, 완료됨 2026-11-03)

기록용. `docs/PLAN.md` 0~9단계를 수행한 세션: https://claude.ai/code/session_01XeQNYypevvowdRR81FjMGs
