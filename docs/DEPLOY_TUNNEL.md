# 이 PC에서 Cloudflare Tunnel로 외부 공개하기

테스트용. PC가 켜져 있고 터널 프로세스가 살아 있는 동안만 접속된다. "quick tunnel"은 **터널을 새로 만들 때** 임의 주소를 발급한다. `deploy.bat`는 기존 터널을 재사용하므로 앱 업데이트로 주소가 바뀌지 않는다.

## 배치 파일로 실행 (권장)

기존 터널이 떠 있는 상태에서 **루트 폴더의 `deploy.bat`를 더블클릭**한다. 성공한 배포의 주소는 다음 실행에도 그대로 사용한다.

1. 최신 코드를 별도 폴더에 프로덕션 빌드한다.
2. 임시 포트에서 새 앱의 로그인 화면과 빌드 ID를 확인한다. 여기까지 기존 앱을 계속 서비스한다.
3. 기존 터널의 PID·생성 시각·주소와 앱 소유권을 다시 확인하고, **기존 포트의 앱만 교체**한다. 이 순간에는 짧은 접속 중단이 생길 수 있으므로 진행 중인 통화·메시지 전송은 먼저 마친다.
4. 같은 외부 주소의 로그인 화면과 **새 빌드 파일**을 확인한다. 실패하면 새 앱을 정리하고 이전 앱 복구를 시도한다. 터널은 종료하거나 새로 만들지 않는다.
5. 완료 후 창이 닫혀도 앱은 백그라운드에서 계속 실행된다. 이전 배치처럼 Enter로 서버를 끄는 구조가 아니다.

주소·계정·기록은 그대로 유지한다. 서버를 교체하므로 진행 중인 연결 자체가 유지되는 무중단 배포는 아니다.

기존 터널이 여러 개이고 처음 주소를 정할 때는 `deploy.bat --url https://현재주소.trycloudflare.com`으로 실행한다. 성공 후 `.leo-runtime/tunnel-target.json`에 기억한다. 이후에는 더블클릭만 하면 된다. 기억한 터널이 없거나 주소가 바뀌면 **새 주소를 만들지 않고 중단**한다.

주소와 로그는 `.leo-runtime/<실행 ID>/`의 `url.txt`, `build.log`, `stage.log`, `app.log`에 저장된다. 복구 시 `rollback.log`를 남긴다. `.leo-runtime/active.json`은 마지막 성공 배포, `latest.json`은 최근 시도 결과다. 동시에 두 번 배포하지 못하도록 `deploy.lock`을 사용한다. 비정상 종료로 잠금이 남으면 그 파일의 PID가 종료된 것을 확인한 뒤 잠금 파일만 제거한다.

- 최초 설치는 README 절차대로 완료되어 있어야 한다(`Node.js 22+`, 의존성·Prisma 생성·DB 설정). 기존 `cloudflared` 터널이 계속 실행 중이어야 한다.
- 가입 차단(`LEO_ALLOW_SIGNUP=0`), HTTPS 쿠키(`APP_URL=https://tunnel`), 실제 API 모드(`CLAUDE_MOCK=0`)는 실행할 프로세스에만 적용한다. `.env`는 수정하지 않는다.
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
2. **시드 비밀번호 교체**: README에 적힌 기본 비밀번호(`leo-pass-1234`)는 공개 저장소에 있다. `.env`의 `SEED_USER_PASSWORD`를 긴 임의 문자열로 바꾸고 `npm run db:seed`를 다시 실행한다(두 계정의 비밀번호가 바뀐다).
3. **AUTH_SECRET**: `bootstrap.sh`가 만든 임의 값이면 된다. 비어 있으면 안 된다.
4. **APP_URL**: `https://`로 시작해야 세션 쿠키에 `Secure`가 붙는다. 터널 주소는 매번 바뀌므로 실행 시 `APP_URL=https://tunnel`처럼 환경 변수로 준다(값 자체는 쿠키 플래그 판단에만 쓴다).
5. **CLAUDE_MOCK=0**, `LEO_ANTHROPIC_API_KEY` 설정.
6. 터널 주소를 두 사용자 외에는 공유하지 않는다. 주소가 새면 터널을 끄면 끝이다(프로세스 종료).

## 앱에 들어 있는 보호 장치

- 로그인 실패 제한: 같은 IP·이메일로 15분 안에 10번 실패하면 15분 차단(`src/lib/auth/rate-limit.ts`). 터널 뒤에서는 `cf-connecting-ip`로 실제 IP를 본다.
- 비밀번호 scrypt 해시, 세션은 DB 토큰 해시 + `HttpOnly; SameSite=Lax; Secure` 쿠키.
- 보안 헤더: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`(마이크는 이 앱만).
- 대화 1건당 턴 상한(`LEO_MAX_TURNS`, 기본 60). 사용자별 일일 한도는 없다(운영자 결정).

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
$env:APP_URL = "https://tunnel"
npm run start -- -H 127.0.0.1 -p $leoPort
```

터미널 2 (새 터널, 위에서 선택한 포트에 맞춘다):

```powershell
cloudflared tunnel --url http://127.0.0.1:3201
```

- 새 출력의 `https://….trycloudflare.com`으로 접속한다. 주소가 바뀌므로 다시 로그인한다. 이전 주소는 이전 버전을 계속 제공한다.
- 새 서버를 다시 시작할 때는 빌드 때 사용한 **동일한 `NEXT_DIST_DIR`**를 설정한다. `APP_URL`의 HTTPS 값은 새 앱 프로세스에만 준다. `.env`에는 HTTPS 터널 주소를 쓰지 않는다.
- `LEO_ALLOW_SIGNUP=0`은 그대로 유지한다. 새 앱도 기존 `dev.db`를 사용하므로 계정과 기록은 공유한다. 시드·마이그레이션을 다시 실행할 필요가 없다.
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
$env:APP_URL = "https://tunnel"; npm run start:tunnel
```

터미널 2 (터널) — PowerShell:

```powershell
cloudflared tunnel --url http://127.0.0.1:3200
```

Git Bash라면 `APP_URL=https://tunnel npm run start:tunnel`.

터널 출력에서 `https://….trycloudflare.com` 주소를 찾아 접속한다. 끝낼 때는 두 터미널 모두 Ctrl+C. 두 프로세스는 Claude 세션과 무관한 일반 프로세스라 떠 있는 동안 토큰을 쓰지 않는다.

이미 운영 중인 앱과 터널이 있다면 위의 **배치 파일로 실행** 절차를 따른다. 실행 중인 서버의 빌드 폴더를 덮어쓰지 않는다.

## 한계와 다음 단계

- quick tunnel은 주소가 고정되지 않고, 접근 제어(Cloudflare Access)가 없다. 계속 쓸 거면 Cloudflare에 도메인을 등록해 **named tunnel + Access(이메일 허용 목록)**를 붙이거나, Railway/Fly.io 같은 호스팅으로 옮긴다.
- 사용량 페이지는 로그인한 모든 사용자에게 전체 사용량을 보여 준다(사용자 2명 전제).
