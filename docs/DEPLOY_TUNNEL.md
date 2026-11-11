# 배포 안내

현재 무료 배포는 **Render + Turso** 절차를 사용한다. 자체 서버와 Cloudflare Access를 사용할 때는 문서 하단의 **정식 초대 운영 배포** 절차를 사용한다. Windows quick tunnel 절차는 기존 테스트 주소를 유지하는 용도다. Node 24와 최신 DB 마이그레이션이 필요하며, 운영 DB 변경은 백업 후 명시적으로 적용한다.

## 무료 배포: Render + Turso

Render Free 웹 서비스 1개와 Turso Free DB 1개를 사용한다. Render가 제공하는 고정 `https://이름.onrender.com` 주소를 쓰므로 도메인을 구매할 필요가 없다. 15분간 접속이 없으면 서버가 잠들고 첫 접속에 약 1분 걸릴 수 있다. 사용자가 이 대기를 허용했다. 서비스 이름을 유지하면 일반적인 업데이트로 주소가 바뀌지 않는다. Claude API 사용료는 서버 비용과 별도이며 모델·원문·추론 설정·출력 상한은 변경하지 않았다.

무료 플랜에는 가용성 보장이 없다. Render는 무료 서비스를 예고 없이 재시작할 수 있으며 무료 한도나 과도한 외부 트래픽으로 서비스가 정지될 수 있다. 이 구성은 소규모 초대 시험 운영을 위한 것이다. 유료 전환·초과 과금을 자동으로 활성화하지 않는다. Render 화면이 유료 인스턴스를 기본 선택할 수 있으므로 반드시 **Free ($0)**를 확인한다. 공식 조건: [Render Free](https://render.com/docs/free), [Turso Free](https://turso.tech/pricing).

### 최초 배포

1. Turso Free에서 Render와 가까운 지역(현재 Singapore)에 새 DB를 만든다. 해당 DB의 읽기·쓰기 토큰과 `libsql://...turso.io` 주소를 준비한다. 기존 PC의 DB는 자동으로 이전하지 않는다.
2. 로컬의 Git 제외 경로 `.leo-runtime/free-hosting/production.env`에 DB 연결 정보와 운영 환경 값을 보관한다. 실제 값을 Git이나 보고서에 넣지 않는다. Node 24로 `node --env-file=.leo-runtime/free-hosting/production.env scripts/migrate-remote.mjs`를 실행해 빈 DB를 준비한다.
3. Git에 검증한 소스를 올리고 Render의 Blueprint로 루트 `render.yaml`을 적용한다. 웹 서비스 1개, **Free**, Singapore, Node 24이며 별도 디스크·DB·워커·유료 예약 작업을 추가하지 않는다. GitHub 자동 배포는 끄고 검증 후 수동으로 배포한다.
4. Render 환경에 `DATABASE_URL`, `TURSO_AUTH_TOKEN`, 서버용 `LEO_ANTHROPIC_API_KEY`를 입력한다. `AUTH_SECRET`와 `LEO_HEALTH_TOKEN`은 독립적인 난수로 만들고 이후 배포에도 유지한다. 나머지 초대 운영·예산 설정은 Blueprint에 있다. Render 런타임의 `RENDER_EXTERNAL_URL`을 `APP_URL`로 사용한다.
5. 서비스가 시작되면 비회원 API 차단, 가입 차단, 발급 계정 로그인, 계정 정지, 대화·리포트 저장과 재시작을 확인한다. 운영자 CLI가 사용하는 로컬 `production.env`에도 실제 `APP_URL`과 같은 `AUTH_SECRET`를 저장한다.

이 경로에서는 구매 도메인/Cloudflare Access를 사용하지 않으며 앱 자체의 발급 계정 검증을 모든 유료 API에 적용한다. `LEO_DEPLOYMENT_PROFILE=render-free`는 Render의 실제 HTTPS 주소, 외부 Turso DB, 공개 가입 차단, 초대 운영과 비용 설정을 요구한다. 일반 서버 프로필에서 Cloudflare Access 요구를 제거한 것은 아니다. 플랫폼 상태 검사용 `/api/health`는 본문 없는 204/503만 공개하고 계정·DB·API 정보는 반환하지 않는다.

### 회원 발급·백업

아래 명령은 로컬 PC에서 실행한다. Render Free의 웹 셸이나 예약 작업에 의존하지 않는다. 공개 회원가입은 계속 차단한다. 발급 링크는 24시간 내 1회만 사용할 수 있고, 사용자가 자신의 비밀번호를 정한다.

```powershell
node --env-file=.leo-runtime/free-hosting/production.env --import tsx scripts/users.ts issue member@example.com "회원 이름"
node --env-file=.leo-runtime/free-hosting/production.env --import tsx scripts/users.ts issue operator@example.com "운영자" --admin
node --env-file=.leo-runtime/free-hosting/production.env --import tsx scripts/users.ts suspend member@example.com
node --env-file=.leo-runtime/free-hosting/production.env scripts/backup-remote.mjs
node scripts/restore-check.mjs backups/remote/백업파일.sqlite
```

백업은 읽기 트랜잭션의 동일 시점 데이터를 로컬 SQLite로 내보내고 무결성·체크섬을 검사한다. 실패한 백업은 성공 파일로 남기지 않는다. Turso의 무료 복구 보관 기간 외에 중요한 사용 후와 업데이트 전 로컬 백업을 남긴다. 이 명령은 자동 일정이 아니므로 실제 일정 운영은 별도로 연결해야 한다.

### 업데이트와 중단 복구

업데이트 전 로컬 백업 → `scripts/operations.ts drain`으로 진행 중인 작업 확인 → `scripts/migrate-remote.mjs`로 호환 가능한 DB 변경 → Render의 Manual Deploy → 상태 검사 → `scripts/operations.ts resume` 순서다. 운영 명령에는 위와 같은 `--env-file`과 `--import tsx`를 사용한다. 작업이 진행 중이면 drain이 거부하고 기존 서버를 유지한다. 배포 실패로 기존 버전을 계속 쓸 때도 resume으로 새 요청을 다시 허용한다. DB를 이전 스키마로 자동 되돌리지는 않는다.

새 프로세스가 시작돼도 이전 프로세스가 정상 처리 중인 리포트를 실패로 바꾸지 않는다. DB의 작업 임대와 주기적 갱신으로 중복 실행을 막고, 연결이 끊긴 작업은 최대 약 3분 뒤 실패 안내로 전환한다. 이미 완성된 결과는 Turso에 남는다. 중단된 유료 요청은 자동 재호출하지 않으며 미확정 비용 예약을 유지한다. 사용자가 명시적으로 재시도할 때만 새 모델 호출이 가능하다. 무료 호스팅의 강제 종료 중에도 진행 중인 AI 응답이 반드시 완료된다는 보장은 없다.

## Windows 테스트 배포

테스트용. PC가 켜져 있고 터널 프로세스가 살아 있는 동안만 접속된다. "quick tunnel"은 **터널을 새로 만들 때** 임의 주소를 발급한다. `deploy.bat`는 기존 터널을 재사용하므로 앱 업데이트로 주소가 바뀌지 않는다.

## 배치 파일로 실행 (권장)

기존 터널이 떠 있는 상태에서 **루트 폴더의 `deploy.bat`를 더블클릭**한다. 성공한 배포의 주소는 다음 실행에도 그대로 사용한다.

1. 최신 코드를 별도 폴더에 프로덕션 빌드한다.
2. 임시 포트에서 새 앱의 로그인 화면과 빌드 ID를 확인한다. 여기까지 기존 앱을 계속 서비스한다.
3. 기존 터널의 PID·생성 시각·주소와 앱 소유권을 다시 확인하고, **기존 포트의 앱만 교체**한다. 이 순간에는 짧은 접속 중단이 생길 수 있으므로 진행 중인 통화·메시지 전송은 먼저 마친다.
4. 같은 외부 주소의 로그인 화면과 **새 빌드 파일**을 확인한다. 실패하면 새 앱을 정리하고 이전 앱 복구를 시도한다. 터널은 종료하거나 새로 만들지 않는다.
5. 완료 후 창이 닫혀도 앱은 백그라운드에서 계속 실행된다. 이전 배치처럼 Enter로 서버를 끄는 구조가 아니다.

주소와 기록은 유지한다. 초대 운영으로 전환하면 기존 계정도 운영자 재발급(`users reset`)을 거쳐야 로그인할 수 있다. 서버를 교체하므로 진행 중인 연결 자체가 유지되는 무중단 배포는 아니다.

기존 터널이 여러 개이고 처음 주소를 정할 때는 `deploy.bat --url https://현재주소.trycloudflare.com`으로 실행한다. 성공 후 `.leo-runtime/tunnel-target.json`에 기억한다. 이후에는 더블클릭만 하면 된다. 기억한 터널이 없거나 주소가 바뀌면 **새 주소를 만들지 않고 중단**한다.

주소와 로그는 `.leo-runtime/<실행 ID>/`의 `url.txt`, `build.log`, `stage.log`, `app.log`에 저장된다. 복구 시 `rollback.log`를 남긴다. `.leo-runtime/active.json`은 마지막 성공 배포, `latest.json`은 최근 시도 결과다. 동시에 두 번 배포하지 못하도록 `deploy.lock`을 사용한다. 비정상 종료로 잠금이 남으면 그 파일의 PID가 종료된 것을 확인한 뒤 잠금 파일만 제거한다.

- 최초 설치는 README 절차대로 완료되어 있어야 한다(`Node.js 24+`, 의존성·Prisma 생성·DB 설정). 기존 `cloudflared` 터널이 계속 실행 중이어야 한다. 배치 파일은 PATH에 Node 24가 없으면 `.leo-runtime/toolchain`에 설치된 Node 24를 사용한다.
- 가입 차단(`LEO_ALLOW_SIGNUP=0`), 실제 공개 주소의 `APP_URL`, 실제 API 모드(`CLAUDE_MOCK=0`)는 실행할 프로세스에만 적용한다. `.env`는 수정하지 않는다. 요청 출처 검증 때문에 `APP_URL=https://tunnel` 같은 임시 문자열을 사용하지 않는다.
- 마이그레이션·시드·비밀번호 변경은 자동 실행하지 않는다. 아래 공개 전 설정은 최초 공개 전에 확인한다.
- 매번 새 빌드 폴더를 만든다. 종료 후에도 로그와 빌드 파일을 보관하므로, 오래된 파일 정리는 해당 서버가 종료된 것을 확인한 뒤 한다.

실행 전 확인만 하거나 빌드만 하려면 PowerShell에서:

```powershell
cd C:\Users\User\orca\projects\cloud\LEO
.\deploy.bat --check
.\deploy.bat --build-only
```

두 옵션 모두 앱 서버와 터널을 시작하지 않는다. `--check`는 기존 터널·앱도 점검하고, `--build-only`는 터널 없이 빌드만 할 수 있다. 배치와 `scripts/deploy-*.mjs`, `scripts/deploy-process.ps1`을 함께 유지한다. 빌드마다 별도 TypeScript 설정을 사용해 원본 `tsconfig.json`을 수정하지 않고 타입 검사도 수행한다.

**주소 유지의 범위:** 앱 업데이트 때는 유지된다. PC 재부팅이나 터널 프로세스 종료 뒤에는 같은 quick tunnel 주소를 되살릴 수 없다. 그런 경우까지 주소를 고정하려면 도메인을 연결한 named tunnel이 필요하다. 배치 파일은 이 상황에서 새 주소로 조용히 바꾸지 않는다.

## 구조

```
외부 브라우저 ──HTTPS──▶ Cloudflare ──터널(아웃바운드)──▶ cloudflared(이 PC) ──▶ 127.0.0.1:3200 (next start)
```

- 이 PC의 방화벽 포트를 열지 않는다. cloudflared가 밖으로 연결을 맺는다.
- 앱 서버는 `127.0.0.1`에만 묶여(`npm run start:tunnel`) 같은 네트워크의 다른 기기에서도 직접 접근할 수 없다. 터널을 통해서만 들어온다.
- 개발 서버(`npm run dev`, HMR·소스맵·개발용 엔드포인트 노출)는 공개하지 않는다. 프로덕션 빌드만 공개한다.

## 공개 전 체크리스트 (전부 해야 한다)

1. **가입 차단**: `.env`에 `LEO_ALLOW_SIGNUP=0`. 아무나 가입해 API 비용을 쓰지 못하게.
2. **실제 회원 발급**: 개발용 시드 계정과 공개된 기본 비밀번호를 운영에 사용하지 않는다. 신규 회원은 `npm run users -- issue 이메일 "이름"`, 유지할 기존 계정은 `npm run users -- reset 이메일`로 초대하고 개인 비밀번호를 설정하게 한다. 운영에서 `db:seed`를 실행하지 않는다. `LEO_INVITE_ONLY=1`로 발급하지 않은 계정을 차단한다.
3. **AUTH_SECRET**: `bootstrap.sh`가 만든 임의 값이면 된다. 비어 있으면 안 된다.
4. **APP_URL**: 실제 접속할 HTTPS 주소를 앱 프로세스의 환경 변수로 준다. 세션 쿠키와 요청 출처 검증에 사용하므로 `https://tunnel` 같은 임시 값은 사용할 수 없다. 배치 파일은 기존 터널의 실제 주소를 찾아 적용한다.
5. **CLAUDE_MOCK=0**, `LEO_ANTHROPIC_API_KEY` 설정.
6. quick tunnel 주소를 비공개로 두는 것만으로 접근 제어를 대신하지 않는다. 정식 회원 운영은 아래 named tunnel과 Cloudflare Access 절차를 완료한 뒤 시작한다.

## 앱에 들어 있는 보호 장치

- 로그인 제한: 기존 IP·이메일 실패 제한에 더해 DB의 계정별·IP별 제한으로 재시작과 IP 변경 우회를 막는다. 정상 로그인은 계정 누적을 초기화한다. 프록시 IP 헤더는 Access를 필수로 검증하는 닫힌 운영 경로에서만 신뢰한다.
- 비밀번호 scrypt 해시, 세션은 DB 토큰 해시 + `HttpOnly; SameSite=Lax; Secure` 쿠키.
- 보안 헤더: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`(마이크는 이 앱만).
- 대화 1건당 턴 상한(`LEO_MAX_TURNS`, 기본 60). 정식 운영에는 DB에 저장되는 비용 예약, 사용자별 일일 한도, 전체 월 한도와 동시 호출 제한을 추가한다.

## 별도 주소가 필요한 경우에만: 수동 병행 실행

아래는 **새 주소를 만드는 절차**이므로 기존 주소 유지 목적에는 사용하지 않는다. 기존 주소를 유지하려면 위 배치 파일을 사용한다. 새 앱은 **별도 빌드 폴더 + 다른 포트(예: 3201)**를 사용한다. 실행 중인 앱의 `.next`에 다시 빌드하면 기존 요청이 깨질 수 있으므로, 포트만 바꾸는 것으로는 충분하지 않다.

터미널 1 (새 앱) — PowerShell:

```powershell
cd C:\Users\User\orca\projects\cloud\LEO
$leoPort = 3201
if (Get-NetTCPConnection -LocalPort $leoPort -State Listen -ErrorAction SilentlyContinue) {
  throw "포트 $leoPort 사용 중: 다른 빈 포트를 선택하세요."
}
$env:NEXT_DIST_DIR = ".next-release-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
npm run build
if ($LASTEXITCODE -ne 0) { throw "빌드 실패: 기존 서버는 계속 실행됩니다." }
$env:APP_URL = "https://터널에-표시된-실제주소.trycloudflare.com"
npm run start -- -H 127.0.0.1 -p $leoPort
```

터미널 2 (새 터널, 위에서 선택한 포트에 맞춘다). 터널을 먼저 시작해 표시된 주소를 터미널 1의 `APP_URL`에 넣는다:

```powershell
cloudflared tunnel --url http://127.0.0.1:3201
```

- 새 출력의 `https://….trycloudflare.com`으로 접속한다. 주소가 바뀌므로 다시 로그인한다. 이전 주소는 이전 버전을 계속 제공한다.
- 새 서버를 다시 시작할 때는 빌드 때 사용한 **동일한 `NEXT_DIST_DIR`**를 설정한다. `APP_URL`의 HTTPS 값은 새 앱 프로세스에만 준다. `.env`에는 HTTPS 터널 주소를 쓰지 않는다.
- `LEO_ALLOW_SIGNUP=0`은 그대로 유지한다. 새 앱도 기존 `dev.db`를 사용하므로 계정과 기록은 공유한다. 스키마 변경이 있는 버전은 먼저 백업과 마이그레이션이 필요하다. 운영에서 개발 시드를 실행하지 않는다.
- 대화 직렬화와 리포트 중복 생성 방지는 프로세스 내부 보호다. 두 주소에서 **같은 대화를 동시에 조작하는 용도**로 사용하지 않는다. 기존 주소의 진행 중 대화는 그 주소에서 마친다.
- 새 버전만 종료하려면 새 터미널 두 개에서 Ctrl+C를 누른다. 이름으로 모든 `cloudflared`를 종료하거나 기존 3200 프로세스를 종료하지 않는다.
- 백그라운드 실행 시 새 앱·터널의 PID, 포트, 빌드 폴더, 로그 경로를 `.leo-runtime/`에 보관한다(커밋 제외). 종료는 기록된 **새 프로세스 PID만** 대상으로 한다.
- 빌드 후 Next.js가 `tsconfig.json`에 해당 빌드 폴더의 타입 경로를 추가할 수 있다. 배포별 임시 경로는 저장소 설정에 커밋하지 않는다.

## 처음 실행 (기존 서버가 없을 때)

`.env`에 `LEO_ALLOW_SIGNUP=0`을 넣어 두면 가입 차단은 자동이다. `APP_URL`은 `.env`에 넣지 않는다(넣으면 로컬 개발 서버 `http://localhost:3000`의 로그인 쿠키가 Secure 가 되어 로그인이 안 된다). 실행할 때만 환경 변수로 준다.

터미널 1 (앱) — PowerShell:

```powershell
cd C:\Users\User\orca\projects\cloud\LEO
npm run build
$env:APP_URL = "https://터널에-표시된-실제주소.trycloudflare.com"; npm run start:tunnel
```

터미널 2 (터널) — PowerShell:

```powershell
cloudflared tunnel --url http://127.0.0.1:3200
```

터널을 먼저 시작해 주소를 얻은 뒤 앱을 시작한다. Git Bash에서도 `APP_URL`에는 그 실제 HTTPS 주소를 사용한다.

터널 출력에서 `https://….trycloudflare.com` 주소를 찾아 접속한다. 끝낼 때는 두 터미널 모두 Ctrl+C. 두 프로세스는 Claude 세션과 무관한 일반 프로세스라 떠 있는 동안 토큰을 쓰지 않는다.

이미 운영 중인 앱과 터널이 있다면 위의 **배치 파일로 실행** 절차를 따른다. 실행 중인 서버의 빌드 폴더를 덮어쓰지 않는다.

## 한계와 다음 단계

- quick tunnel은 주소가 고정되지 않고, 접근 제어(Cloudflare Access)가 없다. 계속 쓸 거면 Cloudflare에 도메인을 등록해 **named tunnel + Access(이메일 허용 목록)**를 붙이거나, Railway/Fly.io 같은 호스팅으로 옮긴다.
- 일반 회원은 자신의 사용량만 본다. 운영자 역할(`admin`)만 전체 사용량을 조회한다.

## 정식 초대 운영 배포

초기 대상은 초대 회원 약 10명, 서버 운영 예산 월 $10, Claude API 전체 월 한도 $200이다. 도메인 갱신·세금·백업 저장량·API 사용료는 구분해서 계산한다. 1GB 서버는 시작 후보이며 동시 사용 성능을 검증하기 전 충분하다고 단정하지 않는다. 모델, 원문 히스토리, 추론 설정, 출력 토큰 상한은 변경하지 않았다.

### 1. 외부 계정과 도메인

1. AWS·Cloudflare·GitHub 운영 계정에 MFA를 설정한다. 도메인을 구매하고 Cloudflare DNS를 연결한다.
2. Cloudflare Access의 self-hosted 앱을 **터널 공개 경로보다 먼저** 만든다. 앱 전체 도메인과 모든 `/api/*` 경로를 포함한다. Allow의 Emails에 수신자 이메일을 하나씩 등록한다. Everyone, 전체 이메일 도메인, One-time PIN 로그인 방식 자체를 허용 조건으로 사용하지 않는다. Bypass 정책도 만들지 않는다.
3. 이메일 OTP 또는 조직 IdP를 연결한다. Access 앱의 issuer와 AUD를 기록한다. 사람용 인증만 사용하고 공개 서비스 토큰을 브라우저에 배포하지 않는다.
4. 이름이 있는 고정 Tunnel을 생성하고, 구매한 도메인의 서비스를 `http://gateway:8080`으로 지정한다. Protect with Access도 켠다. 앱은 추가로 JWT 서명·issuer·audience·만료와 계정 이메일을 확인한다.
5. Tunnel 토큰은 서버의 `/etc/leo/tunnel-token`에 저장한다. AWS 인바운드 앱 포트는 열지 않는다. SSH는 관리 경로와 키 인증으로 제한한다. 도메인이 정해진 뒤 공개 주소는 앱 업데이트로 바뀌지 않는다.

### 2. 서버와 비밀값 준비

Ubuntu/Debian 계열 Linux, Docker Engine + Compose 플러그인을 설치한다. 앱 저장소는 `/opt/leo`, DB는 `/var/lib/leo`, 백업은 `/var/backups/leo`에 둔다. DB와 백업 디렉터리는 컨테이너의 UID/GID 1000이 읽고 쓸 수 있도록 만들고 다른 사용자 권한은 제한한다. 환경 파일은 root만 읽도록 한다. Docker 그룹도 서버의 관리자 권한으로 취급한다.

`deploy/production.env.example`을 `/etc/leo/production.env`로 복사하고 실제 값을 채운다. 이 파일이나 DB를 Git, 이미지, CI 아티팩트에 넣지 않는다. AUTH_SECRET와 LEO_HEALTH_TOKEN은 각각 독립적인 32바이트 이상의 난수로 생성한다. 앱에는 서버용 `LEO_ANTHROPIC_API_KEY`만 설정한다.

- `LEO_PRODUCTION=1`, `LEO_INVITE_ONLY=1`, `LEO_ALLOW_SIGNUP=0`, `LEO_REQUIRE_ACCESS=1`, `CLAUDE_MOCK=0`은 필수다.
- `APP_URL`은 구매한 실제 HTTPS 도메인, `DATABASE_URL=file:/data/leo.db`다. 필수 설정 누락 시 시작을 거부한다.
- `LEO_API_MONTHLY_USD=200`, 초기 사용자별 일일 상한 $20, 전체 동시 호출 5개·사용자당 2개로 준비했다. 일·월 경계는 UTC다. 개인 일일 상한은 남용 방지용이며 모든 회원에게 그 금액을 보장하는 할당량이 아니다.
- API 호출 전에 UTF-8 입력 크기·시스템 프롬프트·스키마 여유분·출력 상한·최대 알려진 fallback 요금·SDK 재시도를 반영해 보수적으로 예약한다. 완료 시 실제 사용량으로 정산한다. 네트워크 실패/재시도에서 청구 여부가 불명확한 금액은 자동 해제하지 않는다. 그래서 청구액이 $200에 도달하기 전 일시 차단될 수 있다.
- 앱의 사용량은 공급자 청구서와 완전히 동일한 결제 장부가 아니다. 최초 운영 전에 현재 모델/fallback 가격표와 **공급자 계정의 지출 제한·알림**을 확인하고 `LEO_BILLING_LIMIT_CONFIRMED=1`로 둔다. 공급자가 강제 한도를 제공하지 않는 경우 이를 별도 제한으로 오해하지 말고 출시 검토에서 한계를 기록한다.
- 키 회전, 회원 정지, 로그인 실패 제한은 모니터링 대상이다. 민감한 대화·비밀번호·초대 토큰은 감사 로그에 기록하지 않는다. Docker 로그도 운영자만 접근한다.

### 3. 이미지 만들기와 배포

작은 운영 서버에서 빌드하지 않고 개발 PC 또는 CI에서 `docker build -t leo:<커밋ID> .`로 만든다. Dockerfile은 Node 24.22.2 기반 이미지를 digest로 고정한다. `.github/workflows/verify.yml`은 테스트·감사·빌드를 실행하고, 수동 실행일 때만 배포 이미지 tar.gz를 3일간 보관한다. 실제 운영 배포·구매·DNS 변경을 자동 실행하지 않는다.

서버에 이미지를 전송해 `docker load`로 읽는다. 공식 nginx와 cloudflared 이미지도 내려받아 `docker image inspect --format '{{index .RepoDigests 0}}' <이미지>`로 digest를 확인한다. `/etc/leo/images.env`에 `LEO_IMAGE`, `NGINX_IMAGE`, `CLOUDFLARED_IMAGE`를 기록한다. 기존 이미지도 복구용으로 보관한다.

```bash
cd /opt/leo/deploy
set -a
source /etc/leo/images.env
set +a
bash release.sh
```

release.sh는 배포 잠금 → 기존 DB 온라인 백업 → additive 마이그레이션 → 네트워크 없는 후보 컨테이너 상태 검사 → 진행 중인 작업 확인 → 앱 교체 → 상태 검사 순서다. 작업이 남아 있으면 기존 앱을 유지하고 종료하므로 나중에 다시 실행한다. 성공 후 같은 named tunnel을 사용한다. 앱 교체 중 짧은 중단은 가능하다. 후보 검사는 실제 Cloudflare 인증·외부 DNS·음성 검사를 대신하지 않는다.

앱 교체 실패 시 이전 이미지로 복구를 시도한다. DB 마이그레이션을 자동으로 되돌리지는 않는다. 컬럼 삭제 등 호환되지 않는 마이그레이션은 이 절차로 배포하지 않는다. 최초 데이터 이전은 기존 DB를 온라인 백업한 파일로 시작하고, 기존 계정의 공개 발급 여부를 하나씩 확인한다. `LEO_INVITE_ONLY=1`에서는 운영자 도구로 발급하지 않은 기존 계정은 차단된다.

### 4. 회원 발급과 회수

실제 회원 이메일을 Access 허용 목록에 등록한 뒤 다음을 실행한다. 공개 회원가입이나 웹 관리자 생성 API는 사용하지 않는다.

```bash
docker compose -f compose.yaml exec app npm run users -- issue member@example.com "회원 이름"
docker compose -f compose.yaml exec app npm run users -- issue operator@example.com "운영자" --admin
docker compose -f compose.yaml exec app npm run users -- list
docker compose -f compose.yaml exec app npm run users -- suspend member@example.com
docker compose -f compose.yaml exec app npm run users -- resume member@example.com
docker compose -f compose.yaml exec app npm run users -- reset member@example.com
```

발급·재발급 명령의 출력은 수신자에게 개인적으로 전달한다. 초대 링크는 24시간 내 1회만 사용할 수 있고 DB에는 해시만 저장한다. URL fragment의 토큰은 서버 URL·Referer에 전달되지 않으며 화면 진입 후 주소에서 제거된다. 사용자는 12자 이상의 비밀번호를 정하고 로그인한다. 재발급은 기존 비밀번호와 모든 세션을 무효화한다. 정지는 모든 세션과 초대도 회수하며, 필요하면 Access 허용 목록에서도 삭제한다. 이미 공급자에게 전달된 AI 요청의 비용까지 취소할 수 있는 것은 아니다.

### 5. 백업·복구·운영 확인

`npm run backup`은 SQLite Online Backup API로 일관된 단일 파일을 만들고 integrity/foreign-key 검사와 SHA-256을 남긴다. 새 백업 검사 성공 후 이 도구가 만든 이전 백업만 정리하며 기본 7개를 보관한다(`BACKUP_KEEP`). `npm run restore:check -- /backups/<파일>.sqlite`는 임시 DB에 복사해 무결성과 주요 테이블을 확인하며 운영 DB를 덮어쓰지 않는다. `deploy/leo-backup.service`, `leo-backup.timer`를 systemd에 등록하면 매일 실행할 수 있다. 실패는 systemd 저널로 확인한다.

백업은 기본적으로 서버 안에 있으므로 **서버 자체 손실에 대비한 별도 위치의 암호화 백업**을 연결해야 한다. 보관 기간·원격 저장소·복호화 키를 결정하고 실제 복구 시험을 마친 뒤 출시한다. 백업 파일을 웹 경로에 두지 않는다. 실제 복구는 앱 정지, 현재 DB의 별도 보존, 검증한 복사본 교체, 해당 스키마와 호환되는 이미지 시작 순으로 운영자가 수행한다. 실행 중인 DB 위에 복사하지 않는다.

`npm run ops -- budget`은 진행 중·미확정 비용 예약을 보여 준다. 공급자의 사용량에서 추가 청구액을 확인한 뒤 `npm run ops -- reconcile <예약ID> <추가비용USD>`로 정산할 수 있다. 확인 없이 0으로 정산하지 않는다. 서버 재시작 시 생성 중 리포트는 중단 안내로 바뀌고, 사용자가 명시적으로 재시도할 때만 모델을 호출한다.

출시 조건: 실제 도메인의 비회원 차단과 Access 이메일 불일치 차단, 회원 정지 후 기존 쿠키 거부, 다른 회원 데이터 접근 거부, 비용 한도와 경합, 백업 복원, 배포 실패 복구, 1GB 서버의 실제 동시 사용 메모리·지연을 확인한다. iPhone 13 mini Chrome의 실제 음성 입출력·잠시 멈춤·복귀 동작도 실기기에서 확인한다. 대화·포트폴리오의 보관 기간/삭제 요청 처리, 외부 AI 전송 안내와 장애 연락 방법도 운영자가 확정해야 한다.
