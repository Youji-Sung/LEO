# 이 PC에서 Cloudflare Tunnel로 외부 공개하기

테스트용. PC가 켜져 있고 터널 프로세스가 살아 있는 동안만 접속된다. 계정 없이 쓰는 "quick tunnel"이라 주소는 매번 바뀐다(`https://<임의>.trycloudflare.com`).

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

## 실행

터미널 1 (앱):

```bash
npm run build
LEO_ALLOW_SIGNUP=0 APP_URL=https://tunnel npm run start:tunnel
```

터미널 2 (터널):

```bash
cloudflared tunnel --url http://127.0.0.1:3200
```

출력에 나오는 `https://….trycloudflare.com` 주소로 접속한다. 끝낼 때는 두 터미널 모두 Ctrl+C.

## 한계와 다음 단계

- quick tunnel은 주소가 고정되지 않고, 접근 제어(Cloudflare Access)가 없다. 계속 쓸 거면 Cloudflare에 도메인을 등록해 **named tunnel + Access(이메일 허용 목록)**를 붙이거나, Railway/Fly.io 같은 호스팅으로 옮긴다.
- 사용량 페이지는 로그인한 모든 사용자에게 전체 사용량을 보여 준다(사용자 2명 전제).
