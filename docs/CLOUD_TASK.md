# 클라우드 세션 실행 안내

이 문서는 운영자가 본다. 세션에 보내는 프롬프트는 맨 아래에 있다.

## 1. 사전 준비 (한 번만)

### GitHub 연결

claude.ai/code에서 GitHub를 연결한다. 연결한 계정에 이 저장소의 push 권한이 있어야 세션이 브랜치를 올릴 수 있다. 공개 저장소라 clone은 어느 계정이든 된다.

### 클라우드 환경 설정

claude.ai/code → 환경 선택기 → Default 환경 편집(또는 새 환경 `leo`):

- Network access: `Trusted` (기본값). `api.anthropic.com`과 npm 레지스트리가 기본 허용 목록에 있다.
- Environment variables (`.env` 형식):

```
LEO_ANTHROPIC_API_KEY=sk-ant-...
LEO_CLAUDE_MODEL=claude-opus-5
BASH_DEFAULT_TIMEOUT_MS=600000
```

`LEO_ANTHROPIC_API_KEY`는 웹사이트가 Claude API를 호출할 때 쓰는 키다. 세션은 이 키로 2단계에서 스모크 호출을 1회만 한다. 나머지 테스트는 모의 모드로 돈다. 이름을 `ANTHROPIC_API_KEY`로 바꾸면 안 된다(세션의 Claude Code가 그 키를 가져다 쓸 수 있다).

네트워크 시크릿 기능은 `api.anthropic.com`에는 붙지 않으므로 환경 변수로 넣는다. 환경 변수는 그 환경을 쓰는 사람이면 읽을 수 있으니 개인 환경에만 넣는다.

- Setup script: 비워 둔다. 의존성 설치는 저장소의 `scripts/install_pkgs.sh`가 SessionStart 훅으로 처리한다.

### Claude GitHub App (선택)

https://github.com/apps/claude/installations/new 에서 저장소 소유 계정에 설치하면 `claude --cloud`가 로컬 번들 업로드 대신 GitHub에서 clone한다. PR Auto-fix도 켤 수 있다.

## 2. 세션 시작

### 터미널에서

저장소 루트(이 폴더)에서, 최신 커밋이 push된 상태로:

```bash
claude --cloud "docs/CLOUD_TASK.md 의 '세션 프롬프트' 절을 그대로 수행해."
```

### 브라우저에서

claude.ai/code → 저장소 `Youji-Sung/LEO`, 브랜치 `main` 선택 → 권한 모드는 **Auto**(없으면 **Accept edits**) → 아래 "세션 프롬프트"를 붙여 넣고 전송.

모델은 가장 높은 등급(Opus 계열), effort는 높게 둔다. 세션이 길고 자율적으로 돌아야 하므로 중간에 질문을 받지 않도록 Plan 모드는 쓰지 않는다.

## 3. 세션이 끝난 뒤

- claude.ai/code의 Changes 카드에서 diff를 보고 PR을 만든다.
- 또는 로컬에서 `claude --teleport <session-id>`로 가져와 이어서 작업한다.
- `docs/PROGRESS.md`에서 "미확인" 항목을 확인하고 README의 수동 점검 체크리스트를 실제 브라우저에서 돌린다(마이크 권한, TTS).

## 세션 프롬프트

```
CLAUDE.md 와 docs/SPEC.md, docs/DECISIONS.md, docs/PLAN.md 를 전부 읽고, docs/PLAN.md 의 0단계부터 9단계까지 순서대로 끝까지 수행해.

규칙:
- 사용자에게 질문하지 말고, 판단이 필요하면 docs/DECISIONS.md 의 제약 안에서 결정해서 "세션 결정" 절에 기록하고 진행해.
- 각 단계의 완료 조건을 실제로 실행해서 확인한 뒤에만 닫고, docs/PROGRESS.md 에 확인 결과를 적어. 확인 못 한 것은 "미확인"으로 남겨.
- 단계마다 npm run check 를 통과시키고 커밋해. 모든 단계가 끝나면 push 해.
- 독립적인 작업은 서브에이전트로 병렬화해서 전체 시간을 줄여. 통합과 검증은 직접 해.
- Claude API 코드를 쓰기 전에 /claude-api 스킬을 로드해.
- 환경 변수 LEO_ANTHROPIC_API_KEY 가 있으면 2단계 스모크 스크립트를 1회만 실행해 실제 동작을 확인해. 그 외의 모든 테스트는 CLAUDE_MOCK=1 로 돌려.
- 8단계 코드 리뷰까지 끝내고, 9단계 마무리 보고를 마지막 메시지로 남겨.

모든 단계가 끝나기 전에는 멈추지 마.
```
