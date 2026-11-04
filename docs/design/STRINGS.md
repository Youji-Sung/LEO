# UI 문자열 전수 인벤토리

0단계 산출물. `src/` 안의 사용자 노출 문구를 파일·줄과 함께 전수로 적는다. 개정안은 적지 않는다(2단계 `WRITING.md`에서 한다). 문구는 원문 그대로 복사했고, 템플릿 자리(`{n}`, `${...}`)도 그대로 둔다.

## 방법

1. `grep -rn -P "[가-힣]" src` 를 실행하고 `src/generated/` 와 주석 줄(`//` 로 시작하는 줄)을 뺐다 → **후보 368줄**(`path:line:content`).
   - 주의: 이 환경의 grep 은 UTF-8 로케일이 없어 바이트 단위로 매칭했고, 그 결과 `[가-힣]` 이 사실상 **모든 비ASCII 문자**에 걸렸다. 그래서 한글이 없고 `·` `—` `…` `→` `📞` `💬` `”’“‘` 만 있는 18줄도 후보에 들어 있다(`LC_ALL=C.UTF-8` 로 다시 세어 확인). 이 줄들도 아래에서 하나씩 분류했다.
2. 후보 368줄 전부를 원본 파일에서 읽어 화면·요소 역할을 확인하고, 줄마다 **사용자 노출 / 제외 / 모의 응답** 셋 중 하나로 분류했다. 한 줄에 문구가 여럿이면(삼항식, `micLabel` 맵 등) 문구마다 한 행으로 쪼갰고, 한 문구가 두 줄에 걸치면(JSX 줄바꿈) `줄-줄` 로 적고 한 행으로 합쳤다.
3. 같은 줄에 있는 비한글 문구(`LEO`, `Enter`, `ms`, 이모지, `→`, `…`)도 사용자 노출이면 포함했다. 추가로 `src/components` 와 `src/app` 의 `placeholder=`·`aria-label=`·`title=`·`alt=` 와 JSX 텍스트 노드를 grep 해 한글이 없는 사용자 노출 문구를 찾아 별도 표(2b)에 넣었다. `globals.css` 의 `content:` 문자열은 없음(확인).
4. 분류 결과와 합계는 스크립트로 검산했다(후보 집합 ⊇ 모든 행, 세 분류의 교집합 없음, 합 = 368).

판정 기준
- **사용자 노출**: 화면에 렌더링되는 텍스트, 플레이스홀더, `aria-label`, `<title>`/메타, `window.confirm` 문구, 그리고 API 가 `{error:{message}}` 로 돌려줘 클라이언트가 그대로 `role="alert"` 에 띄우는 서버 오류 메시지(zod 메시지 포함: `parseBody` 가 `필드: 메시지` 꼴로 전달). 음성으로만 나가는 문장(TTS 미리 듣기, 오프닝 라인)도 사용자에게 닿으므로 포함.
- **제외**: 모델에게 보내는 스키마 설명·프롬프트, 정규식, 콘솔 경고, 다른 문구로 치환되어 사용자에게 도달하지 않는 내부 예외.
- **모의 응답**: `mock-provider.ts` 의 문구. 모의 모드에서 화면에 보이지만 UI 크롬이 아니라 모델 출력을 대신하는 것이므로 따로 센다.

## 1. 사용자 노출 문구

후보 줄 기준 336행. `문구` 의 앞뒤 공백은 원문 그대로다(예: 기록 화면의 ` · 종료` 는 앞에 공백 한 칸이 있는 접미 문자열).

| # | 파일:줄 | 화면/영역 | 종류 | 문구 |
|---|---|---|---|---|
| 1 | `src/components/AuthForm.tsx:34` | 로그인·회원가입 | 오류 | `네트워크 오류가 발생했습니다. 다시 시도하세요.` |
| 2 | `src/components/AuthForm.tsx:41` | 로그인·회원가입 | aria | `로그인` |
| 3 | `src/components/AuthForm.tsx:41` | 로그인·회원가입 | aria | `회원가입` |
| 4 | `src/components/AuthForm.tsx:44` | 회원가입 | 레이블 | `이름` |
| 5 | `src/components/AuthForm.tsx:49` | 로그인·회원가입 | 레이블 | `이메일` |
| 6 | `src/components/AuthForm.tsx:53` | 로그인·회원가입 | 레이블 | `비밀번호` |
| 7 | `src/components/AuthForm.tsx:70` | 로그인 | 버튼 | `로그인` |
| 8 | `src/components/AuthForm.tsx:70` | 회원가입 | 버튼 | `가입하기` |
| 9 | `src/components/report/ReportRetry.tsx:29` | 리포트 | 상태·로딩 | `리포트를 생성하는 중입니다. 보통 30초에서 1분 정도 걸립니다…` |
| 10 | `src/components/report/ReportRetry.tsx:33` | 리포트 | 빈 상태 | `아직 리포트가 없습니다.` |
| 11 | `src/components/report/ReportRetry.tsx:37` | 리포트 | 버튼 | `다시 시도` |
| 12 | `src/components/report/ReportRetry.tsx:37` | 리포트 | 버튼 | `리포트 생성` |
| 13 | `src/components/report/ReportView.tsx:8` | 리포트 | aria | `${label} ${score}점` |
| 14 | `src/components/report/ReportView.tsx:8` | 리포트 | 본문 | `{score}/10` |
| 15 | `src/components/report/ReportView.tsx:10` | 리포트 | aria | `${label} ${score}점 (10점 만점)` |
| 16 | `src/components/report/ReportView.tsx:24` | 리포트 | 제목 | `요약` |
| 17 | `src/components/report/ReportView.tsx:29` | 리포트 | 제목 | `종합 점수` |
| 18 | `src/components/report/ReportView.tsx:31` | 리포트 | 레이블 | `문법` |
| 19 | `src/components/report/ReportView.tsx:32` | 리포트 | 레이블 | `어휘` |
| 20 | `src/components/report/ReportView.tsx:33` | 리포트 | 레이블 | `유창성` |
| 21 | `src/components/report/ReportView.tsx:34` | 리포트 | 레이블 | `과제 수행` |
| 22 | `src/components/report/ReportView.tsx:35` | 리포트 | 레이블 | `기술 설명의 명확성` |
| 23 | `src/components/report/ReportView.tsx:40` | 리포트 | 제목 | `문법 교정` |
| 24 | `src/components/report/ReportView.tsx:42` | 리포트 | 빈 상태 | `교정할 문장이 없습니다.` |
| 25 | `src/components/report/ReportView.tsx:50` | 리포트 | 본문(기호, aria-hidden) | `→` |
| 26 | `src/components/report/ReportView.tsx:64` | 리포트 | 제목 | `어휘 제안` |
| 27 | `src/components/report/ReportView.tsx:66` | 리포트 | 빈 상태 | `제안할 어휘가 없습니다.` |
| 28 | `src/components/report/ReportView.tsx:74` | 리포트 | 본문(기호, aria-hidden) | `→` |
| 29 | `src/components/report/ReportView.tsx:79` | 리포트 | 본문(구분자) | `{v.meaning} · {v.example}` |
| 30 | `src/components/report/ReportView.tsx:88` | 리포트 | 제목 | `더 나은 표현` |
| 31 | `src/components/report/ReportView.tsx:102` | 리포트 | 제목 | `다음 연습 과제` |
| 32 | `src/components/report/ReportView.tsx:112` | 리포트 | 제목 | `면접 피드백` |
| 33 | `src/components/report/ReportView.tsx:114` | 리포트 | 제목 | `예상 추가 질문` |
| 34 | `src/components/LogoutButton.tsx:14` | 전역 헤더 | 버튼 | `로그아웃` |
| 35 | `src/components/chat/NewChatForm.tsx:33` | 채팅 목록 | aria | `새 채팅` |
| 36 | `src/components/chat/NewChatForm.tsx:35` | 채팅 목록 | 레이블 | `테마` |
| 37 | `src/components/chat/NewChatForm.tsx:39` | 채팅 목록 | 옵션 | `{t.label} — {t.description}` |
| 38 | `src/components/chat/NewChatForm.tsx:46` | 채팅 목록 | 레이블 | `교정 힌트 켜기` |
| 39 | `src/components/chat/NewChatForm.tsx:55` | 채팅 목록 | 버튼 | `새 채팅 시작` |
| 40 | `src/components/chat/ChatView.tsx:66` | 채팅 | 오류 | `${(e as Error).message} 화면을 새로고침해 대화 상태를 확인하세요.` |
| 41 | `src/components/chat/ChatView.tsx:118` | 채팅 | 본문(구분자) | `· {props.title}` |
| 42 | `src/components/chat/ChatView.tsx:121` | 채팅 | 레이블 | `교정 힌트` |
| 43 | `src/components/chat/ChatView.tsx:129` | 채팅 | 상태·로딩 | `리포트 생성 중…` |
| 44 | `src/components/chat/ChatView.tsx:129` | 채팅 | 버튼 | `리포트 다시 생성` |
| 45 | `src/components/chat/ChatView.tsx:129` | 채팅 | 버튼 | `리포트 생성` |
| 46 | `src/components/chat/ChatView.tsx:133` | 채팅 | 링크 | `리포트 보기` |
| 47 | `src/components/chat/ChatView.tsx:138` | 채팅 | aria | `대화` |
| 48 | `src/components/chat/ChatView.tsx:141` | 채팅 | 빈 상태 | `영어로 첫 메시지를 보내 보세요. 예: "Hi! Can I tell you about my week?"` |
| 49 | `src/components/chat/ChatView.tsx:149` | 채팅 | 레이블 | `교정 힌트: {m.hint}` |
| 50 | `src/components/chat/ChatView.tsx:156` | 채팅 | 상태·로딩 | `…` |
| 51 | `src/components/chat/ChatView.tsx:167` | 채팅 | 버튼 | `다시 시도` |
| 52 | `src/components/chat/ChatView.tsx:174` | 채팅 | 상태·로딩 | `종료된 대화입니다. 새 대화를 시작하세요.` |
| 53 | `src/components/chat/ChatView.tsx:178` | 채팅 | 레이블(sr-only) | `메시지` |
| 54 | `src/components/chat/ChatView.tsx:191` | 채팅 | 플레이스홀더 | `영어로 입력 (Enter 전송, Shift+Enter 줄바꿈)` |
| 55 | `src/components/chat/ChatView.tsx:196` | 채팅 | 버튼 | `보내기` |
| 56 | `src/components/portfolio/PortfolioManager.tsx:29` | 포트폴리오 | 오류 | `PDF 파일을 선택하세요.` |
| 57 | `src/components/portfolio/PortfolioManager.tsx:43` | 포트폴리오 | 상태·로딩 | `"${created.portfolio.title}" 등록 완료 (${created.portfolio.chars.toLocaleString()}자)` |
| 58 | `src/components/portfolio/PortfolioManager.tsx:53` | 포트폴리오 | 확인 대화 | `이 포트폴리오를 삭제할까요?` |
| 59 | `src/components/portfolio/PortfolioManager.tsx:65` | 포트폴리오 | aria | `포트폴리오 등록` |
| 60 | `src/components/portfolio/PortfolioManager.tsx:66` | 포트폴리오 | aria | `입력 방식` |
| 61 | `src/components/portfolio/PortfolioManager.tsx:68` | 포트폴리오 | 옵션 | `텍스트/마크다운 붙여넣기` |
| 62 | `src/components/portfolio/PortfolioManager.tsx:71` | 포트폴리오 | 옵션 | `PDF 업로드` |
| 63 | `src/components/portfolio/PortfolioManager.tsx:75` | 포트폴리오 | 레이블 | `제목` |
| 64 | `src/components/portfolio/PortfolioManager.tsx:76` | 포트폴리오 | 플레이스홀더 | `비우면 파일 이름을 씁니다` |
| 65 | `src/components/portfolio/PortfolioManager.tsx:76` | 포트폴리오 | 플레이스홀더 | `예: 2025 백엔드 포트폴리오` |
| 66 | `src/components/portfolio/PortfolioManager.tsx:80` | 포트폴리오 | 레이블 | `내용` |
| 67 | `src/components/portfolio/PortfolioManager.tsx:81` | 포트폴리오 | 플레이스홀더 | `프로젝트 설명, 역할, 기술 스택, 성과를 영어 또는 한국어로…` |
| 68 | `src/components/portfolio/PortfolioManager.tsx:85` | 포트폴리오 | 레이블 | `PDF 파일` |
| 69 | `src/components/portfolio/PortfolioManager.tsx:97` | 포트폴리오 | 상태·로딩 | `등록 중…` |
| 70 | `src/components/portfolio/PortfolioManager.tsx:97` | 포트폴리오 | 버튼 | `등록` |
| 71 | `src/components/portfolio/PortfolioManager.tsx:102` | 포트폴리오 | 제목 | `등록된 포트폴리오` |
| 72 | `src/components/portfolio/PortfolioManager.tsx:104` | 포트폴리오 | 빈 상태 | `아직 없습니다.` |
| 73 | `src/components/portfolio/PortfolioManager.tsx:111` | 포트폴리오 | aria | `${p.title} 삭제` |
| 74 | `src/components/portfolio/PortfolioManager.tsx:112` | 포트폴리오 | 버튼 | `삭제` |
| 75 | `src/components/portfolio/PortfolioManager.tsx:116` | 포트폴리오 | 본문 | `{formatDateTime(p.createdAt)} · {p.chars.toLocaleString()}자` |
| 76 | `src/components/portfolio/PortfolioManager.tsx:118` | 포트폴리오 | 본문(말줄임) | `…` |
| 77 | `src/components/settings/SettingsForm.tsx:32` | 설정 | 상태·로딩 | `저장했습니다.` |
| 78 | `src/components/settings/SettingsForm.tsx:45` | 설정 | aria | `설정` |
| 79 | `src/components/settings/SettingsForm.tsx:48` | 설정 | 레이블 | `새 채팅에서 교정 힌트 기본 켜기` |
| 80 | `src/components/settings/SettingsForm.tsx:51` | 설정 | 레이블 | `TTS 음성` |
| 81 | `src/components/settings/SettingsForm.tsx:54` | 설정 | 옵션 | `브라우저 기본 (영어)` |
| 82 | `src/components/settings/SettingsForm.tsx:62` | 설정 | 버튼 | `미리 듣기` |
| 83 | `src/components/settings/SettingsForm.tsx:65` | 설정 | 오류 | `이 브라우저에서 사용할 수 있는 음성 목록을 불러오지 못했습니다.` |
| 84 | `src/components/settings/SettingsForm.tsx:68` | 설정 | 레이블 | `통화 기본 길이` |
| 85 | `src/components/settings/SettingsForm.tsx:72` | 설정 | 옵션 | `{m}분` |
| 86 | `src/components/settings/SettingsForm.tsx:85` | 설정 | 버튼 | `저장` |
| 87 | `src/components/SiteHeader.tsx:5` | 전역 헤더 | 링크 | `홈` |
| 88 | `src/components/SiteHeader.tsx:6` | 전역 헤더 | 링크 | `채팅` |
| 89 | `src/components/SiteHeader.tsx:7` | 전역 헤더 | 링크 | `전화 영어` |
| 90 | `src/components/SiteHeader.tsx:8` | 전역 헤더 | 링크 | `기록` |
| 91 | `src/components/SiteHeader.tsx:9` | 전역 헤더 | 링크 | `포트폴리오` |
| 92 | `src/components/SiteHeader.tsx:10` | 전역 헤더 | 링크 | `사용량` |
| 93 | `src/components/SiteHeader.tsx:11` | 전역 헤더 | 링크 | `설정` |
| 94 | `src/components/SiteHeader.tsx:21` | 전역 헤더 | aria | `주 메뉴` |
| 95 | `src/components/call/CallView.tsx:320` | 통화 중 | 본문 | ` · {formatDuration(durationSec)} 통화` |
| 96 | `src/components/call/CallView.tsx:326` | 통화 중 | aria | `남은 시간` |
| 97 | `src/components/call/CallView.tsx:336-337` | 통화 중 | 본문 | `상대가 먼저 인사를 건넵니다. 영어로 자연스럽게 대답하세요. 통화가 끝나면 교정 리포트가 만들어집니다.` |
| 98 | `src/components/call/CallView.tsx:346` | 통화 중 | 버튼 | `통화 시작` |
| 99 | `src/components/call/CallView.tsx:356` | 통화 중 | 상태·로딩 | `이 브라우저는 음성 인식을 지원하지 않아 텍스트로 대화합니다.` |
| 100 | `src/components/call/CallView.tsx:357` | 통화 중 | 상태·로딩 | ` 음성 합성도 지원하지 않아 답변은 글로만 표시됩니다.` |
| 101 | `src/components/call/CallView.tsx:365` | 통화 중 | 상태·로딩 | `상대가 말하는 중` |
| 102 | `src/components/call/CallView.tsx:367` | 통화 중 | 상태·로딩 | `상대가 생각하는 중…` |
| 103 | `src/components/call/CallView.tsx:369` | 통화 중 | 상태·로딩 | `음소거` |
| 104 | `src/components/call/CallView.tsx:371` | 통화 중 | 상태·로딩 | `듣는 중` |
| 105 | `src/components/call/CallView.tsx:372` | 통화 중 | 상태·로딩 | `입력 대기` |
| 106 | `src/components/call/CallView.tsx:382` | 통화 중 | 상태·로딩 | `통화를 마치고 리포트를 만드는 중입니다… (30초~1분)` |
| 107 | `src/components/call/CallView.tsx:384` | 통화 중 | 상태·로딩 | `리포트로 이동합니다…` |
| 108 | `src/components/call/CallView.tsx:390` | 통화 중 | aria | `실시간 트랜스크립트` |
| 109 | `src/components/call/CallView.tsx:399` | 통화 중 | 상태·로딩 | `…` |
| 110 | `src/components/call/CallView.tsx:418` | 통화 중 | 레이블(sr-only) | `말할 내용` |
| 111 | `src/components/call/CallView.tsx:425` | 통화 중 | 플레이스홀더 | `영어로 입력하고 Enter` |
| 112 | `src/components/call/CallView.tsx:434` | 통화 중 | 버튼 | `말하기` |
| 113 | `src/components/call/CallView.tsx:448` | 통화 중 | 버튼 | `음소거 해제` |
| 114 | `src/components/call/CallView.tsx:448` | 통화 중 | 버튼 | `음소거` |
| 115 | `src/components/call/CallView.tsx:453` | 통화 중 | 버튼 | `10분 연장` |
| 116 | `src/components/call/CallView.tsx:463` | 통화 중 | 버튼 | `끊기` |
| 117 | `src/components/call/CallView.tsx:466` | 통화 중 | 상태·로딩 | `턴 상한에 도달해 통화를 마칩니다.` |
| 118 | `src/components/call/CallSetupForm.tsx:89` | 통화 설정 | 상태·로딩 | `아직 확인하지 않았습니다.` |
| 119 | `src/components/call/CallSetupForm.tsx:90` | 통화 설정 | 상태·로딩 | `확인 중…` |
| 120 | `src/components/call/CallSetupForm.tsx:91` | 통화 설정 | 상태·로딩 | `마이크를 사용할 수 있습니다.` |
| 121 | `src/components/call/CallSetupForm.tsx:93` | 통화 설정 | 오류 | `마이크 권한이 거부되었습니다. 브라우저 주소창의 권한 설정에서 허용하세요. 텍스트 입력으로도 통화할 수 있습니다.` |
| 122 | `src/components/call/CallSetupForm.tsx:94` | 통화 설정 | 상태·로딩 | `이 브라우저에서는 마이크를 쓸 수 없습니다. 텍스트 입력으로 통화합니다.` |
| 123 | `src/components/call/CallSetupForm.tsx:98` | 통화 설정 | aria | `통화 설정` |
| 124 | `src/components/call/CallSetupForm.tsx:100` | 통화 설정 | 레이블 | `테마` |
| 125 | `src/components/call/CallSetupForm.tsx:104` | 통화 설정 | 옵션 | `{t.label} — {t.description}` |
| 126 | `src/components/call/CallSetupForm.tsx:111` | 통화 설정 | 레이블 | `포트폴리오` |
| 127 | `src/components/call/CallSetupForm.tsx:114-115` | 통화 설정 | 빈 상태 | `등록된 포트폴리오가 없습니다. 포트폴리오 관리에서 먼저 등록하세요.` |
| 128 | `src/components/call/CallSetupForm.tsx:114` | 통화 설정 | 링크 | `포트폴리오 관리` |
| 129 | `src/components/call/CallSetupForm.tsx:133` | 통화 설정 | 레이블(legend) | `통화 시간` |
| 130 | `src/components/call/CallSetupForm.tsx:144` | 통화 설정 | 옵션 | `테스트(20초)` |
| 131 | `src/components/call/CallSetupForm.tsx:144` | 통화 설정 | 옵션 | `${m}분` |
| 132 | `src/components/call/CallSetupForm.tsx:150` | 통화 설정 | 레이블 | `마이크` |
| 133 | `src/components/call/CallSetupForm.tsx:153` | 통화 설정 | 버튼 | `마이크 권한 확인` |
| 134 | `src/components/call/CallSetupForm.tsx:161-162` | 통화 설정 | 본문 | `이 브라우저는 음성 인식(Web Speech API)을 지원하지 않습니다. Chrome 을 권장하며, 텍스트 입력으로 통화를 진행할 수 있습니다.` |
| 135 | `src/components/call/CallSetupForm.tsx:177` | 통화 설정 | 버튼 | `다음` |
| 136 | `src/components/ConfigBanner.tsx:8` | 배너 | 상태·로딩 | `모의 모드(CLAUDE_MOCK=1)입니다. Claude API 를 호출하지 않고 가짜 응답을 보여 줍니다.` |
| 137 | `src/components/ConfigBanner.tsx:15` | 배너 | 오류 | `Claude API 키가 설정되지 않았습니다. 운영자가 .env 의 LEO_ANTHROPIC_API_KEY 를 채우고 서버를 다시 시작해야 채팅과 통화가 동작합니다.` |
| 138 | `src/services/report/index.ts:38` | 리포트·채팅·통화 중 | 서버 오류 메시지 | `리포트를 만들려면 사용자 발화가 최소 1개 필요합니다.` |
| 139 | `src/services/report/index.ts:52` | 리포트·채팅·통화 중 | 서버 오류 메시지 | `리포트 생성 실패: ${describeClaudeError(e)}` |
| 140 | `src/services/report/index.ts:56` | 리포트·채팅·통화 중 | 서버 오류 메시지 | `모델이 이 대화의 리포트 생성을 거부했습니다. 다시 시도하거나 새 대화를 시작하세요.` |
| 141 | `src/services/report/index.ts:59` | 리포트·채팅·통화 중 | 서버 오류 메시지 | `리포트 형식이 올바르지 않아 저장하지 못했습니다 (${result.parseError}). 다시 시도하세요.` |
| 142 | `src/services/report/index.ts:78` | API 오류(공통) | 서버 오류 메시지 | `대화를 찾을 수 없습니다.` |
| 143 | `src/services/usage/index.ts:8` | 사용량 | 링크(기간 필터) | `오늘` |
| 144 | `src/services/usage/index.ts:9` | 사용량 | 링크(기간 필터) | `7일` |
| 145 | `src/services/usage/index.ts:10` | 사용량 | 링크(기간 필터) | `30일` |
| 146 | `src/services/usage/index.ts:11` | 사용량 | 링크(기간 필터) | `전체` |
| 147 | `src/services/usage/index.ts:15` | 사용량 | 레이블(기능명) | `채팅` |
| 148 | `src/services/usage/index.ts:16` | 사용량 | 레이블(기능명) | `전화 영어` |
| 149 | `src/services/usage/index.ts:17` | 사용량 | 레이블(기능명) | `리포트` |
| 150 | `src/services/usage/index.ts:18` | 사용량 | 레이블(기능명) | `포트폴리오` |
| 151 | `src/services/portfolio/index.ts:20` | 포트폴리오 | 서버 오류 메시지 | `포트폴리오 내용이 비어 있습니다.` |
| 152 | `src/services/portfolio/index.ts:24` | 포트폴리오 | 서버 오류 메시지 | `포트폴리오는 ${PORTFOLIO_MAX_CHARS.toLocaleString()}자 이하여야 합니다.` |
| 153 | `src/services/portfolio/index.ts:33` | 포트폴리오 | 서버 오류 메시지 | `제목을 입력하세요.` |
| 154 | `src/services/portfolio/index.ts:49` | 포트폴리오 | 서버 오류 메시지 | `포트폴리오를 찾을 수 없습니다.` |
| 155 | `src/services/portfolio/index.ts:54` | 포트폴리오 | 서버 오류 메시지 | `진행 중인 통화가 이 포트폴리오를 쓰고 있습니다. 통화를 끝낸 뒤 삭제하세요.` |
| 156 | `src/services/claude/schemas/report.ts:91` | 리포트·채팅·통화 중 | 서버 오류 메시지(삽입) | `JSON 파싱 실패: ${(e as Error).message}` |
| 157 | `src/services/claude/schemas/report.ts:96` | 리포트·채팅·통화 중 | 서버 오류 메시지(삽입) | `` 스키마 검증 실패: ${first ? `${first.path.join(".")} ${first.message}` : "알 수 없음"} `` |
| 158 | `src/services/claude/schemas/report.ts:96` | 리포트·채팅·통화 중 | 서버 오류 메시지(삽입) | `알 수 없음` |
| 159 | `src/services/claude/prompts/themes.ts:9` | 테마(공통) | 테마 이름 | `자유 대화` |
| 160 | `src/services/claude/prompts/themes.ts:10` | 테마(공통) | 테마 설명 | `주제 제한 없이 편하게 영어로 수다` |
| 161 | `src/services/claude/prompts/themes.ts:18` | 테마(공통) | 테마 이름 | `면접` |
| 162 | `src/services/claude/prompts/themes.ts:19` | 테마(공통) | 테마 설명 | `해외 테크 회사 1차 면접 (행동 질문 + 기술 질문)` |
| 163 | `src/services/claude/prompts/themes.ts:27` | 테마(공통) | 테마 이름 | `일상` |
| 164 | `src/services/claude/prompts/themes.ts:28` | 테마(공통) | 테마 설명 | `해외 생활 일상 상황 (카페, 병원, 집 구하기 등)` |
| 165 | `src/services/claude/prompts/themes.ts:36` | 테마(공통) | 테마 이름 | `업무 일상` |
| 166 | `src/services/claude/prompts/themes.ts:37` | 테마(공통) | 테마 설명 | `동료와의 스탠드업, 코드 리뷰, 1:1 대화` |
| 167 | `src/services/claude/prompts/themes.ts:45` | 테마(공통) | 테마 이름 | `비즈니스` |
| 168 | `src/services/claude/prompts/themes.ts:46` | 테마(공통) | 테마 설명 | `거래처·고객과의 미팅, 요구사항 협의` |
| 169 | `src/services/claude/prompts/themes.ts:54` | 테마(공통) | 테마 이름 | `포트폴리오 면접` |
| 170 | `src/services/claude/prompts/themes.ts:55` | 테마(공통) | 테마 설명 | `등록한 포트폴리오를 바탕으로 깊이 파고드는 기술 면접` |
| 171 | `src/services/claude/errors.ts:9` | API 오류(공통) | 서버 오류 메시지 | `Claude API 키가 설정되지 않았습니다. 운영자가 LEO_ANTHROPIC_API_KEY 를 설정해야 합니다.` |
| 172 | `src/services/claude/errors.ts:12` | API 오류(공통) | 서버 오류 메시지 | `Claude API 키가 올바르지 않거나 권한이 없습니다. 운영자에게 알려 주세요.` |
| 173 | `src/services/claude/errors.ts:15` | API 오류(공통) | 서버 오류 메시지 | `Claude API 사용량 한도에 걸렸습니다. 잠시 후 다시 시도하세요.` |
| 174 | `src/services/claude/errors.ts:18` | API 오류(공통) | 서버 오류 메시지 | `Claude API 응답이 너무 늦어 중단했습니다. 다시 시도하세요.` |
| 175 | `src/services/claude/errors.ts:21` | API 오류(공통) | 서버 오류 메시지 | `Claude API 에 연결하지 못했습니다. 네트워크를 확인하고 다시 시도하세요.` |
| 176 | `src/services/claude/errors.ts:24` | API 오류(공통) | 서버 오류 메시지 | `Claude API 오류(${e.status ?? "?"})가 발생했습니다. 잠시 후 다시 시도하세요.` |
| 177 | `src/services/claude/errors.ts:28` | API 오류(공통) | 서버 오류 메시지 | `네트워크 오류가 발생했습니다. 다시 시도하세요.` |
| 178 | `src/services/claude/errors.ts:30` | API 오류(공통) | 서버 오류 메시지 | `응답을 받지 못했습니다. 다시 시도하세요.` |
| 179 | `src/services/claude/turn-cap.ts:13` | 채팅·통화 중 | 서버 오류 메시지 | `대화 1건당 최대 ${limit}턴까지만 가능합니다. 리포트를 생성하거나 새 대화를 시작하세요.` |
| 180 | `src/services/conversation/index.ts:28` | 통화 설정 | 서버 오류 메시지 | `포트폴리오를 찾을 수 없습니다.` |
| 181 | `src/services/conversation/index.ts:33` | 통화 설정 | 서버 오류 메시지 | `포트폴리오 면접 테마는 포트폴리오를 골라야 합니다.` |
| 182 | `src/services/conversation/index.ts:71` | API 오류(공통) | 서버 오류 메시지 | `대화를 찾을 수 없습니다.` |
| 183 | `src/services/conversation/index.ts:156` | 채팅·통화 중 | 서버 오류 메시지 | `이미 종료된 대화입니다.` |
| 184 | `src/services/conversation/index.ts:158` | 채팅·통화 중 | 서버 오류 메시지 | `메시지를 입력하세요.` |
| 185 | `src/services/conversation/index.ts:160` | 채팅·통화 중 | 서버 오류 메시지 | `메시지가 너무 깁니다 (4000자 이하).` |
| 186 | `src/services/conversation/index.ts:218` | 채팅·통화 중 | 서버 오류 메시지 | `상대가 이 주제에는 답하지 않기로 했습니다. 다른 주제로 대화를 이어가 보세요.` |
| 187 | `src/services/conversation/index.ts:276` | 채팅·통화 중 | 서버 오류 메시지 | `서버 오류가 발생했습니다.` |
| 188 | `src/app/api/portfolios/route.ts:26` | 포트폴리오 | 서버 오류 메시지 | `PDF 파일을 선택하세요.` |
| 189 | `src/app/api/portfolios/route.ts:27` | 포트폴리오 | 서버 오류 메시지 | `PDF 는 10MB 이하여야 합니다.` |
| 190 | `src/app/api/portfolios/route.ts:28` | 포트폴리오 | 서버 오류 메시지 | `PDF 파일만 올릴 수 있습니다.` |
| 191 | `src/app/api/portfolios/route.ts:33` | 포트폴리오 | 서버 오류 메시지 | `PDF 에서 텍스트를 추출하지 못했습니다. 텍스트로 붙여넣어 주세요.` |
| 192 | `src/app/api/portfolios/route.ts:35` | 포트폴리오 | 서버 오류 메시지 | `PDF 에 추출할 텍스트가 없습니다(스캔 이미지일 수 있음). 텍스트로 붙여넣어 주세요.` |
| 193 | `src/app/api/auth/signup/route.ts:10` | 회원가입 | 서버 오류 메시지(zod) | `이메일 형식이 아닙니다.` |
| 194 | `src/app/api/auth/signup/route.ts:11` | 회원가입 | 서버 오류 메시지(zod) | `비밀번호는 8자 이상이어야 합니다.` |
| 195 | `src/app/api/auth/signup/route.ts:12` | 회원가입 | 서버 오류 메시지(zod) | `이름을 입력하세요.` |
| 196 | `src/app/api/auth/signup/route.ts:19` | 회원가입 | 서버 오류 메시지 | `이미 가입된 이메일입니다.` |
| 197 | `src/app/api/auth/signup/route.ts:33` | 회원가입 | 서버 오류 메시지 | `이미 가입된 이메일입니다.` |
| 198 | `src/app/api/auth/login/route.ts:14` | 로그인 | 서버 오류 메시지 | `이메일 또는 비밀번호가 올바르지 않습니다.` |
| 199 | `src/app/api/conversations/[id]/extend/route.ts:13` | 통화 중 | 서버 오류 메시지 | `통화만 연장할 수 있습니다.` |
| 200 | `src/app/api/conversations/[id]/extend/route.ts:14` | 통화 중 | 서버 오류 메시지 | `이미 종료된 통화입니다.` |
| 201 | `src/app/api/conversations/[id]/extend/route.ts:16` | 통화 중 | 서버 오류 메시지 | `통화는 최대 ${MAX_CALL_MINUTES}분까지입니다.` |
| 202 | `src/app/api/conversations/[id]/report/route.ts:26` | API 오류(공통) | 서버 오류 메시지 | `리포트가 아직 없습니다.` |
| 203 | `src/app/api/usage/route.ts:18` | API 오류(공통) | 서버 오류 메시지 | `기간 값이 올바르지 않습니다.` |
| 204 | `src/app/api/settings/route.ts:15` | 설정 | 서버 오류 메시지(zod) | `10, 20, 30 중 하나` |
| 205 | `src/app/(auth)/signup/page.tsx:7` | 회원가입 | 메타 제목 | `회원가입 — LEO` |
| 206 | `src/app/(auth)/signup/page.tsx:13` | 회원가입 | 제목 | `회원가입` |
| 207 | `src/app/(auth)/signup/page.tsx:14` | 회원가입 | 본문 | `초대받은 사용자만 가입합니다.` |
| 208 | `src/app/(auth)/signup/page.tsx:19` | 회원가입 | 본문 | `이미 계정이 있나요?` |
| 209 | `src/app/(auth)/signup/page.tsx:19` | 회원가입 | 링크 | `로그인` |
| 210 | `src/app/(auth)/login/page.tsx:7` | 로그인 | 메타 제목 | `로그인 — LEO` |
| 211 | `src/app/(auth)/login/page.tsx:13` | 로그인 | 제목 | `로그인` |
| 212 | `src/app/(auth)/login/page.tsx:18` | 로그인 | 본문 | `계정이 없나요?` |
| 213 | `src/app/(auth)/login/page.tsx:18` | 로그인 | 링크 | `회원가입` |
| 214 | `src/app/(app)/portfolios/page.tsx:6` | 포트폴리오 | 메타 제목 | `포트폴리오 — LEO` |
| 215 | `src/app/(app)/portfolios/page.tsx:13` | 포트폴리오 | 제목 | `포트폴리오` |
| 216 | `src/app/(app)/portfolios/page.tsx:15` | 포트폴리오 | 본문 | `등록한 포트폴리오는 전화 영어의 "포트폴리오 면접" 테마에서 면접관이 질문의 근거로 씁니다. 여러 개를 등록하고 통화 시작 시 고를 수 있습니다.` |
| 217 | `src/app/(app)/portfolios/page.tsx:15` | 포트폴리오 | 링크 | `전화 영어` |
| 218 | `src/app/(app)/history/[id]/report/page.tsx:10` | 리포트 | 메타 제목 | `리포트 — LEO` |
| 219 | `src/app/(app)/history/[id]/report/page.tsx:28` | 리포트 | 제목 | `리포트` |
| 220 | `src/app/(app)/history/[id]/report/page.tsx:31` | 리포트 | 링크 | `트랜스크립트` |
| 221 | `src/app/(app)/history/[id]/report/page.tsx:34` | 리포트 | 링크 | `채팅으로` |
| 222 | `src/app/(app)/history/[id]/report/page.tsx:34` | 리포트 | 링크 | `통화 기록` |
| 223 | `src/app/(app)/history/[id]/report/page.tsx:39` | 리포트 | 본문(메타 줄) | `전화 영어` |
| 224 | `src/app/(app)/history/[id]/report/page.tsx:39` | 리포트 | 본문(메타 줄) | `채팅` |
| 225 | `src/app/(app)/history/[id]/report/page.tsx:40` | 리포트 | 본문(메타 줄) | ` · 포트폴리오: ${conversation.portfolio.title}` |
| 226 | `src/app/(app)/history/[id]/report/page.tsx:45` | 리포트 | 오류 | `저장된 리포트가 손상되었습니다.` |
| 227 | `src/app/(app)/history/[id]/page.tsx:8` | 트랜스크립트 | 메타 제목 | `트랜스크립트 — LEO` |
| 228 | `src/app/(app)/history/[id]/page.tsx:24` | 트랜스크립트 | 제목 | `트랜스크립트` |
| 229 | `src/app/(app)/history/[id]/page.tsx:28` | 트랜스크립트 | 링크 | `리포트 보기` |
| 230 | `src/app/(app)/history/[id]/page.tsx:32` | 트랜스크립트 | 링크 | `리포트 생성` |
| 231 | `src/app/(app)/history/[id]/page.tsx:37` | 트랜스크립트 | 링크 | `채팅으로` |
| 232 | `src/app/(app)/history/[id]/page.tsx:43` | 트랜스크립트 | 본문(메타 줄) | `전화 영어` |
| 233 | `src/app/(app)/history/[id]/page.tsx:43` | 트랜스크립트 | 본문(메타 줄) | `채팅` |
| 234 | `src/app/(app)/history/[id]/page.tsx:44` | 트랜스크립트 | 본문(메타 줄) | ` · ${formatDuration(conversation.durationSec)}` |
| 235 | `src/app/(app)/history/[id]/page.tsx:46` | 트랜스크립트 | aria | `대화 트랜스크립트` |
| 236 | `src/app/(app)/history/[id]/page.tsx:47` | 트랜스크립트 | 빈 상태 | `메시지가 없습니다.` |
| 237 | `src/app/(app)/history/[id]/page.tsx:51` | 트랜스크립트 | 레이블 | `교정 힌트: {m.hint}` |
| 238 | `src/app/(app)/history/page.tsx:7` | 기록 | 메타 제목 | `기록 — LEO` |
| 239 | `src/app/(app)/history/page.tsx:16` | 기록 | 제목 | `기록` |
| 240 | `src/app/(app)/history/page.tsx:19` | 기록 | 링크(필터) | `전체` |
| 241 | `src/app/(app)/history/page.tsx:22` | 기록 | 링크(필터) | `전화 영어` |
| 242 | `src/app/(app)/history/page.tsx:25` | 기록 | 링크(필터) | `채팅` |
| 243 | `src/app/(app)/history/page.tsx:29` | 기록 | 빈 상태 | `기록이 없습니다.` |
| 244 | `src/app/(app)/history/page.tsx:36` | 기록 | 본문(기호) | `📞 ` |
| 245 | `src/app/(app)/history/page.tsx:36` | 기록 | 본문(기호) | `💬 ` |
| 246 | `src/app/(app)/history/page.tsx:38` | 기록 | 본문(메타 줄) | ` · ${c.title}` |
| 247 | `src/app/(app)/history/page.tsx:43` | 기록 | 링크 | `리포트` |
| 248 | `src/app/(app)/history/page.tsx:47` | 기록 | 링크 | `이어서 채팅` |
| 249 | `src/app/(app)/history/page.tsx:51` | 기록 | 링크 | `리포트 생성` |
| 250 | `src/app/(app)/history/page.tsx:57` | 기록 | 본문(메타 줄) | `{formatDateTime(c.startedAt)} · 메시지 {c._count.messages}개` |
| 251 | `src/app/(app)/history/page.tsx:58` | 기록 | 본문(메타 줄) | ` · ${formatDuration(c.durationSec)}` |
| 252 | `src/app/(app)/history/page.tsx:59` | 기록 | 본문(메타 줄) | ` · 종료` |
| 253 | `src/app/(app)/history/page.tsx:59` | 기록 | 본문(메타 줄) | ` · 진행 중` |
| 254 | `src/app/(app)/usage/page.tsx:13` | 사용량 | 메타 제목 | `사용량 — LEO` |
| 255 | `src/app/(app)/usage/page.tsx:43` | 사용량 | 제목 | `사용량` |
| 256 | `src/app/(app)/usage/page.tsx:45` | 사용량 | aria | `기간` |
| 257 | `src/app/(app)/usage/page.tsx:58` | 사용량 | aria | `사용자` |
| 258 | `src/app/(app)/usage/page.tsx:60` | 사용량 | 링크(필터) | `전체` |
| 259 | `src/app/(app)/usage/page.tsx:76` | 사용량 | 제목 | `합계 · {USAGE_PERIOD_LABELS[period]}` |
| 260 | `src/app/(app)/usage/page.tsx:77` | 사용량 | 제목(접미) | ` · ${selectedUser.name}` |
| 261 | `src/app/(app)/usage/page.tsx:79` | 사용량 | 본문 | `{formatDateTime(summary.since)} 이후` |
| 262 | `src/app/(app)/usage/page.tsx:82` | 사용량 | 레이블 | `호출 수` |
| 263 | `src/app/(app)/usage/page.tsx:86` | 사용량 | 레이블 | `입력 토큰` |
| 264 | `src/app/(app)/usage/page.tsx:90` | 사용량 | 레이블 | `출력 토큰` |
| 265 | `src/app/(app)/usage/page.tsx:94` | 사용량 | 레이블 | `캐시 읽기 토큰` |
| 266 | `src/app/(app)/usage/page.tsx:98` | 사용량 | 레이블 | `캐시 쓰기 토큰` |
| 267 | `src/app/(app)/usage/page.tsx:102` | 사용량 | 레이블 | `추정 비용` |
| 268 | `src/app/(app)/usage/page.tsx:110` | 사용량 | 제목(caption) | `사용자별` |
| 269 | `src/app/(app)/usage/page.tsx:113` | 사용량 | 레이블(th) | `사용자` |
| 270 | `src/app/(app)/usage/page.tsx:114` | 사용량 | 레이블(th) | `호출` |
| 271 | `src/app/(app)/usage/page.tsx:115` | 사용량 | 레이블(th) | `입력` |
| 272 | `src/app/(app)/usage/page.tsx:116` | 사용량 | 레이블(th) | `출력` |
| 273 | `src/app/(app)/usage/page.tsx:117` | 사용량 | 레이블(th) | `캐시 읽기` |
| 274 | `src/app/(app)/usage/page.tsx:118` | 사용량 | 레이블(th) | `캐시 쓰기` |
| 275 | `src/app/(app)/usage/page.tsx:119` | 사용량 | 레이블(th) | `비용` |
| 276 | `src/app/(app)/usage/page.tsx:142` | 사용량 | 제목(caption) | `기능별` |
| 277 | `src/app/(app)/usage/page.tsx:145` | 사용량 | 레이블(th) | `기능` |
| 278 | `src/app/(app)/usage/page.tsx:146` | 사용량 | 레이블(th) | `호출` |
| 279 | `src/app/(app)/usage/page.tsx:147` | 사용량 | 레이블(th) | `입력` |
| 280 | `src/app/(app)/usage/page.tsx:148` | 사용량 | 레이블(th) | `출력` |
| 281 | `src/app/(app)/usage/page.tsx:149` | 사용량 | 레이블(th) | `비용` |
| 282 | `src/app/(app)/usage/page.tsx:156` | 사용량 | 빈 상태 | `기록이 없습니다.` |
| 283 | `src/app/(app)/usage/page.tsx:176` | 사용량 | 제목(caption) | `최근 호출 50건` |
| 284 | `src/app/(app)/usage/page.tsx:179` | 사용량 | 레이블(th) | `시각` |
| 285 | `src/app/(app)/usage/page.tsx:180` | 사용량 | 레이블(th) | `사용자` |
| 286 | `src/app/(app)/usage/page.tsx:181` | 사용량 | 레이블(th) | `기능` |
| 287 | `src/app/(app)/usage/page.tsx:182` | 사용량 | 레이블(th) | `모델` |
| 288 | `src/app/(app)/usage/page.tsx:183` | 사용량 | 레이블(th) | `입력` |
| 289 | `src/app/(app)/usage/page.tsx:184` | 사용량 | 레이블(th) | `출력` |
| 290 | `src/app/(app)/usage/page.tsx:185` | 사용량 | 레이블(th) | `캐시 읽기` |
| 291 | `src/app/(app)/usage/page.tsx:186` | 사용량 | 레이블(th) | `캐시 쓰기` |
| 292 | `src/app/(app)/usage/page.tsx:187` | 사용량 | 레이블(th) | `비용` |
| 293 | `src/app/(app)/usage/page.tsx:188` | 사용량 | 레이블(th) | `지연 ms` |
| 294 | `src/app/(app)/usage/page.tsx:195` | 사용량 | 빈 상태 | `기록이 없습니다.` |
| 295 | `src/app/(app)/page.tsx:17` | 홈 | 제목 | `안녕하세요, {user.name}님` |
| 296 | `src/app/(app)/page.tsx:18` | 홈 | 본문 | `개발자 해외 취업용 영어 회화 연습. 오늘은 무엇을 해 볼까요?` |
| 297 | `src/app/(app)/page.tsx:21` | 홈 | 링크(버튼형) | `📞 전화 영어 시작` |
| 298 | `src/app/(app)/page.tsx:24` | 홈 | 링크(버튼형) | `💬 채팅 시작` |
| 299 | `src/app/(app)/page.tsx:27` | 홈 | 제목 | `최근 활동` |
| 300 | `src/app/(app)/page.tsx:29` | 홈 | 빈 상태 | `아직 기록이 없습니다. 전화 영어나 채팅을 시작해 보세요.` |
| 301 | `src/app/(app)/page.tsx:35` | 홈 | 본문(기호) | `📞` |
| 302 | `src/app/(app)/page.tsx:35` | 홈 | 본문(기호) | `💬` |
| 303 | `src/app/(app)/page.tsx:36` | 홈 | 본문(메타 줄) | ` · ${c.title}` |
| 304 | `src/app/(app)/page.tsx:39` | 홈 | 본문(메타 줄) | `{formatDateTime(c.updatedAt)} · 메시지 {c._count.messages}개` |
| 305 | `src/app/(app)/page.tsx:39` | 홈 | 본문(메타 줄) | ` · 리포트 있음` |
| 306 | `src/app/(app)/chat/[id]/page.tsx:7` | 채팅 | 메타 제목 | `채팅 — LEO` |
| 307 | `src/app/(app)/chat/page.tsx:9` | 채팅 목록 | 메타 제목 | `채팅 — LEO` |
| 308 | `src/app/(app)/chat/page.tsx:23` | 채팅 목록 | 제목 | `채팅` |
| 309 | `src/app/(app)/chat/page.tsx:25` | 채팅 목록 | 제목 | `이전 대화` |
| 310 | `src/app/(app)/chat/page.tsx:27` | 채팅 목록 | 빈 상태 | `아직 대화가 없습니다.` |
| 311 | `src/app/(app)/chat/page.tsx:32` | 채팅 목록 | 링크(대체 제목) | `(제목 없음)` |
| 312 | `src/app/(app)/chat/page.tsx:34` | 채팅 목록 | 본문(메타 줄) | `{THEMES[...].label} · 메시지 {c._count.messages}개 · {formatDateTime(c.updatedAt)}` |
| 313 | `src/app/(app)/chat/page.tsx:35` | 채팅 목록 | 본문(메타 줄) | ` · 리포트 있음` |
| 314 | `src/app/(app)/chat/page.tsx:36` | 채팅 목록 | 본문(메타 줄) | ` · 종료` |
| 315 | `src/app/(app)/settings/page.tsx:6` | 설정 | 메타 제목 | `설정 — LEO` |
| 316 | `src/app/(app)/settings/page.tsx:13` | 설정 | 제목 | `설정` |
| 317 | `src/app/(app)/call/[id]/page.tsx:8` | 통화 중 | 메타 제목 | `통화 중 — LEO` |
| 318 | `src/app/(app)/call/page.tsx:7` | 통화 설정 | 메타 제목 | `전화 영어 — LEO` |
| 319 | `src/app/(app)/call/page.tsx:20` | 통화 설정 | 제목 | `전화 영어` |
| 320 | `src/app/(app)/call/page.tsx:21` | 통화 설정 | 본문 | `테마를 고르고 마이크를 확인한 뒤 통화를 시작합니다. 상대의 말은 음성으로 읽어 주고, 내 말은 음성 인식으로 받아 적습니다.` |
| 321 | `src/app/layout.tsx:6` | 메타데이터(전역) | 메타 제목 | `LEO — 영어 회화 연습` |
| 322 | `src/app/layout.tsx:7` | 메타데이터(전역) | 메타 설명 | `개발자 해외 취업용 영어 회화 연습` |
| 323 | `src/lib/voice/web-speech.ts:56` | 통화 중(음성) | 오류 | `마이크 권한이 거부되었습니다.` |
| 324 | `src/lib/voice/web-speech.ts:60` | 통화 중(음성) | 오류 | `음성 인식 네트워크 오류입니다.` |
| 325 | `src/lib/voice/web-speech.ts:62` | 통화 중(음성) | 오류 | `마이크를 찾을 수 없습니다.` |
| 326 | `src/lib/voice/web-speech.ts:64` | 통화 중(음성) | 오류 | `음성 인식 오류: ${error}` |
| 327 | `src/lib/voice/web-speech.ts:89` | 통화 중(음성) | 오류 | `이 브라우저는 음성 인식을 지원하지 않습니다.` |
| 328 | `src/lib/voice/web-speech.ts:135` | 통화 중(음성) | 오류 | `음성 인식 오류: ${e instanceof Error ? e.message : String(e)}` |
| 329 | `src/lib/ndjson-client.ts:18` | 채팅·통화 중 | 오류 | `응답 본문이 비어 있습니다.` |
| 330 | `src/lib/http.ts:26` | API 오류(공통) | 서버 오류 메시지 | `로그인이 필요합니다.` |
| 331 | `src/lib/http.ts:35` | API 오류(공통) | 서버 오류 메시지 | `요청 본문이 JSON 이 아닙니다.` |
| 332 | `src/lib/http.ts:40` | API 오류(공통) | 서버 오류 메시지(접두) | `${first.path.join(".") \|\| "입력"}: ${first.message}` |
| 333 | `src/lib/http.ts:40` | API 오류(공통) | 서버 오류 메시지 | `입력이 올바르지 않습니다.` |
| 334 | `src/lib/http.ts:54` | API 오류(공통) | 서버 오류 메시지 | `입력이 올바르지 않습니다.` |
| 335 | `src/lib/http.ts:56` | API 오류(공통) | 서버 오류 메시지 | `서버 오류가 발생했습니다.` |
| 336 | `src/lib/client-fetch.ts:21` | API 오류(공통) | 오류 | `요청이 실패했습니다 (${res.status}).` |

### 2b. 후보 줄 밖에서 찾은 비한글 사용자 노출 문구

11행. 한글이 없어 후보 grep 에 걸리지 않았지만 화면에 표시되거나 음성으로 재생된다. 오프닝 라인은 통화 화면 상태 줄(`data-testid="opening-line"`)에 표시되고 TTS 로 읽힌다. 대화 내용(영어)이라 2단계 개정 대상인지는 WRITING 의 영어 혼용 규칙에서 정한다.

| # | 파일:줄 | 화면/영역 | 종류 | 문구 |
|---|---|---|---|---|
| 337 | `src/components/SiteHeader.tsx:19` | 전역 헤더 | 링크(브랜드) | `LEO` |
| 338 | `src/components/settings/SettingsForm.tsx:41` | 설정 | 음성(TTS 미리 듣기 문장) | `Hi! This is how I sound. Let's practice some English together.` |
| 339 | `src/components/settings/SettingsForm.tsx:57` | 설정 | 옵션 | `{v.name} ({v.lang})` |
| 340 | `src/app/(app)/usage/page.tsx:126` | 사용량 | 본문(th) | `{u.name} ({u.email})` |
| 341 | `src/app/(app)/call/[id]/page.tsx:27` | 통화 중 | 오프닝 라인(대체값, 표시·음성) | `Hello! Let's get started.` |
| 342 | `src/services/claude/prompts/themes.ts:14` | 통화 중 | 오프닝 라인(표시·음성) | `Hey! Good to hear from you. How's your day going so far?` |
| 343 | `src/services/claude/prompts/themes.ts:23` | 통화 중 | 오프닝 라인(표시·음성) | `Hi, thanks for joining today. I'm the hiring manager for this role. To get started, could you tell me a little about yourself?` |
| 344 | `src/services/claude/prompts/themes.ts:32` | 통화 중 | 오프닝 라인(표시·음성) | `Hi there! I'm your neighbor from next door. How are you settling in? Is there anything around here I can help you with?` |
| 345 | `src/services/claude/prompts/themes.ts:41` | 통화 중 | 오프닝 라인(표시·음성) | `Morning! Ready for stand-up? What did you work on yesterday, and is anything blocking you?` |
| 346 | `src/services/claude/prompts/themes.ts:50` | 통화 중 | 오프닝 라인(표시·음성) | `Hello, thanks for making time for this call. I wanted to go over the current requirements and the timeline. Shall we start with where things stand?` |
| 347 | `src/services/claude/prompts/themes.ts:59` | 통화 중 | 오프닝 라인(표시·음성) | `Hi, thanks for coming in. I've read through your portfolio and I'd like to dig into your projects. Which project are you most proud of, and why?` |

동적 형식(문자열 아님, 참고): `formatDuration` → `m:ss`, `formatDateTime` → `YYYY-MM-DD HH:mm`, `formatUsd` → `$0.0000`, `formatTokens` → `en-US` 천 단위 구분(`src/lib/format.ts`). 2단계에서 숫자·시간 표기 규칙을 정할 때 같이 본다.

## 2. 제외한 줄

30줄.

| # | 파일:줄 | 내용 | 제외 이유 |
|---|---|---|---|
| 1 | `src/services/claude/schemas/report.ts:5` | `1에서 10 사이의 정수` | zod `.describe()` — 구조화 출력 스키마 설명. Claude API 로 보내는 JSON 스키마에 들어가며 UI 에 표시되지 않음 |
| 2 | `src/services/claude/schemas/report.ts:6` | `한 줄 코멘트 (한국어)` | zod `.describe()` — 위와 같음 |
| 3 | `src/services/claude/schemas/report.ts:10` | `무엇에 대해 이야기했는지 3~5문장 (한국어)` | zod `.describe()` — 위와 같음 |
| 4 | `src/services/claude/schemas/report.ts:14` | `응답 길이와 주저 표현 기준` | zod `.describe()` — 위와 같음 |
| 5 | `src/services/claude/schemas/report.ts:15` | `테마 목표 달성도` | zod `.describe()` — 위와 같음 |
| 6 | `src/services/claude/schemas/report.ts:20` | `사용자 발화 원문 (영어)` | zod `.describe()` — 위와 같음 |
| 7 | `src/services/claude/schemas/report.ts:21` | `교정문 (영어)` | zod `.describe()` — 위와 같음 |
| 8 | `src/services/claude/schemas/report.ts:22` | `왜 틀렸는지 (한국어)` | zod `.describe()` — 위와 같음 |
| 9 | `src/services/claude/schemas/report.ts:25` | `중요도 순, 최대 10개` | zod `.describe()` — 위와 같음 |
| 10 | `src/services/claude/schemas/report.ts:29` | `사용자가 쓴 단순한 표현 (영어)` | zod `.describe()` — 위와 같음 |
| 11 | `src/services/claude/schemas/report.ts:30` | `더 자연스러운 표현 (영어)` | zod `.describe()` — 위와 같음 |
| 12 | `src/services/claude/schemas/report.ts:31` | `의미 (한국어)` | zod `.describe()` — 위와 같음 |
| 13 | `src/services/claude/schemas/report.ts:32` | `예문 (영어)` | zod `.describe()` — 위와 같음 |
| 14 | `src/services/claude/schemas/report.ts:35` | `최대 10개` | zod `.describe()` — 위와 같음 |
| 15 | `src/services/claude/schemas/report.ts:39` | `사용자 발화 (영어)` | zod `.describe()` — 위와 같음 |
| 16 | `src/services/claude/schemas/report.ts:40` | `원어민이라면 이렇게 (영어)` | zod `.describe()` — 위와 같음 |
| 17 | `src/services/claude/schemas/report.ts:43` | `정확히 3개` | zod `.describe()` — 위와 같음 |
| 18 | `src/services/claude/schemas/report.ts:44` | `구체적인 행동 지침 (한국어) / 정확히 3개` | zod `.describe()` — 위와 같음 |
| 19 | `src/services/claude/schemas/report.ts:47` | `답변 구조(STAR 등) 피드백 (한국어)` | zod `.describe()` — 위와 같음 |
| 20 | `src/services/claude/schemas/report.ts:48` | `예상 추가 질문 (영어) / 정확히 3개` | zod `.describe()` — 위와 같음 |
| 21 | `src/services/claude/schemas/report.ts:51` | `면접류 테마가 아니면 null` | zod `.describe()` — 위와 같음 |
| 22 | `src/services/claude/schemas/report.ts:52` | `포트폴리오 면접 테마에서만, 기술 설명의 명확성. 아니면 null` | zod `.describe()` — 위와 같음 |
| 23 | `src/services/claude/hint-splitter.ts:38` | `/^(없음\|none)\.?$/i` | 정규식 — 모델이 보낸 힌트 "없음" 을 걸러내는 판정값. 표시되지 않음 |
| 24 | `src/services/claude/prompts/themes.ts:78` | `write "${HINT_MARKER} 없음"` | 시스템 프롬프트(HINT_RULES) — 모델에게 보내는 지시문. 표시되지 않음 |
| 25 | `src/services/claude/anthropic-provider.ts:35` | `LEO_ANTHROPIC_API_KEY 가 설정되지 않았습니다.` | 내부 예외(ClaudeConfigError) 메시지. `classifyClaudeError` 가 errors.ts:9 문구로 치환하므로 사용자에게 이 문장은 도달하지 않음 |
| 26 | `src/services/claude/anthropic-provider.ts:142` | `모델이 요청을 거부했습니다.` | refusal 시 parseError 값. `generateAndSaveReport` 가 parseError 보다 먼저 stopReason=refusal 을 보고 report/index.ts:56 문구를 던지므로 표시되지 않음 |
| 27 | `src/lib/auth/session.ts:10` | `AUTH_SECRET 이 설정되지 않았습니다. scripts/bootstrap.sh 를 실행하세요.` | 서버 기동 설정 오류(개발자용). 500 핸들러가 "서버 오류가 발생했습니다." 로 바꿔 내보냄 |
| 28 | `src/lib/voice/fake.ts:38` | `[fake-voice] say() 호출됐지만 듣는 중이 아닙니다:` | `console.warn` — E2E 용 가짜 음성 어댑터의 콘솔 경고 |
| 29 | `src/lib/voice/sentence-splitter.ts:21` | `/[.!?]+["'”’)\]]*/y` | 정규식 — 문장 종결 판정. 한글 없음(굽은 따옴표 ”’ 가 바이트 매칭에 걸림) |
| 30 | `src/lib/voice/sentence-splitter.ts:71` | `/^["'“‘(\[]+/` | 정규식 — 여는 따옴표 제거. 한글 없음(굽은 따옴표 “‘ 가 바이트 매칭에 걸림) |

## 3. 모의 응답(모델 출력 대체)

22줄. `CLAUDE_MOCK=1` 에서만 쓰인다. 리포트 화면·채팅 힌트에 실제로 보이지만 Claude 출력을 흉내 내는 데이터이므로 UI 문구로 세지 않는다. 2단계에서 리포트 문체(프롬프트의 "리포트 문체 지시")를 손볼 때 모의 응답의 톤도 같은 규칙으로 맞추면 after 스크린샷이 일관된다. 한글이 없는 모의 영어 답변(`REPLIES`, `betterExpressions.native`, `followUpQuestions`, mock-provider.ts:23-26·63-65·76-78)은 후보 밖이며 같은 성격이다.

| # | 파일:줄 | 내용 | 비고 |
|---|---|---|---|
| 1 | `src/services/claude/mock-provider.ts:30` | `"I go to school yesterday" → "I went to school yesterday" (과거 시제는 went)` | 모의 교정 힌트(채팅 말풍선의 "교정 힌트:" 뒤에 표시) |
| 2 | `src/services/claude/mock-provider.ts:31` | `"very much people" → "a lot of people" (people 은 가산명사라 much 대신 many/a lot of)` | 모의 교정 힌트 |
| 3 | `src/services/claude/mock-provider.ts:32` | `"I am agree" → "I agree" (agree 는 동사라 be 동사 불필요)` | 모의 교정 힌트 |
| 4 | `src/services/claude/mock-provider.ts:46` | `${theme.label} 테마로 ${userLines.length}번 발화했습니다. 주로 자기소개와 … 여지가 있습니다.` | 모의 리포트 summary |
| 5 | `src/services/claude/mock-provider.ts:48` | `시제 일치와 관사 오류가 반복됩니다.` | 모의 리포트 scores.grammar.comment |
| 6 | `src/services/claude/mock-provider.ts:49` | `기본 어휘 위주라 표현이 단조롭습니다.` | 모의 리포트 scores.vocabulary.comment |
| 7 | `src/services/claude/mock-provider.ts:50` | `응답이 짧지만 주저 표현은 적습니다.` | 모의 리포트 scores.fluency.comment |
| 8 | `src/services/claude/mock-provider.ts:51` | `질문에는 답했으나 구체적인 사례가 부족합니다.` | 모의 리포트 scores.task.comment |
| 9 | `src/services/claude/mock-provider.ts:54` | `과거의 일이므로 동사를 과거형(went)으로 씁니다.` | 모의 리포트 grammarCorrections[0].explanation |
| 10 | `src/services/claude/mock-provider.ts:55` | `people 은 복수 가산명사라 were 와 a lot of/many 를 씁니다.` | 모의 리포트 grammarCorrections[1].explanation |
| 11 | `src/services/claude/mock-provider.ts:56` | `agree 는 동사이므로 be 동사(am)를 붙이지 않습니다.` | 모의 리포트 grammarCorrections[2].explanation |
| 12 | `src/services/claude/mock-provider.ts:59` | `아주 좋은` | 모의 리포트 vocabularySuggestions[0].meaning |
| 13 | `src/services/claude/mock-provider.ts:60` | `빠르게 결정하다` | 모의 리포트 vocabularySuggestions[1].meaning |
| 14 | `src/services/claude/mock-provider.ts:68` | `어제 한 일을 과거 시제로 5문장 말해 보기` | 모의 리포트 nextTasks[0] |
| 15 | `src/services/claude/mock-provider.ts:69` | `자기소개를 STAR 구조로 1분 안에 말하는 연습` | 모의 리포트 nextTasks[1] |
| 16 | `src/services/claude/mock-provider.ts:70` | `오늘 배운 표현 3개를 다음 대화에서 한 번씩 쓰기` | 모의 리포트 nextTasks[2] |
| 17 | `src/services/claude/mock-provider.ts:74` | `답변이 상황 설명에 머물러 결과(R)가 빠졌습니다. 상황→과제→행동→결과 순서로 30초 안에 정리해 보세요.` | 모의 리포트 interview.structureFeedback |
| 18 | `src/services/claude/mock-provider.ts:82` | `아키텍처 선택의 이유를 더 명확히 설명하면 좋습니다.` | 모의 리포트 technicalClarity.comment |
| 19 | `src/services/claude/mock-provider.ts:93` | `모의 API 오류` | 테스트 트리거용 예외. `describeClaudeError` 가 "응답을 받지 못했습니다…" 로 치환하므로 이 문장은 표시되지 않음 |
| 20 | `src/services/claude/mock-provider.ts:116` | `모의 API 오류` | 위와 같음(리포트 경로) |
| 21 | `src/services/claude/mock-provider.ts:118` | `모델이 요청을 거부했습니다.` | 모의 refusal 의 parseError. anthropic-provider.ts:142 와 같은 이유로 표시되지 않음 |
| 22 | `src/services/claude/mock-provider.ts:121` | `스키마가 깨진 리포트` | 깨진 JSON 테스트 데이터. 파싱 실패 후 버려지며 표시되지 않음 |

## 합계

| 항목 | 수 |
|---|---|
| 후보 줄(총) | 368 |
| 사용자 노출로 분류한 줄 (N) | 316 |
| 제외한 줄 (K) | 30 |
| 모의 응답 줄 | 22 |
| 검산 N + K + 모의 | 316 + 30 + 22 = 368 |
| 사용자 노출 문구 행(표 1, 후보 줄에서) | 336 |
| 그중 서로 다른 문구 | 270 |
| 후보 밖 비한글 문구 행(표 2b) | 11 |
| 사용자 노출 문구 행 합계 | 347 |
| 서로 다른 문구 합계 (M) | 281 |

전수 확인: 후보 368줄 중 368줄을 원본에서 읽고 분류했다(368/368). 행 수가 줄 수보다 많은 것은 한 줄에 문구가 여럿인 경우(삼항식·맵·접미 문자열)를 쪼갰기 때문이고, 적은 쪽은 두 줄짜리 문장을 합친 경우다.

화면/영역별 행 수(표 1 + 2b): 사용량 50, 포트폴리오 35, 리포트 34, 통화 중 34, 통화 설정 23, API 오류(공통) 19, 채팅 17, 기록 16, 설정 15, 채팅 목록 13, 회원가입 12, 테마(공통) 12, 트랜스크립트 11, 홈 11, 전역 헤더 10, 리포트·채팅·통화 중 7, 채팅·통화 중 7, 로그인 6, 통화 중(음성) 6, 로그인·회원가입 5, 배너 2, 메타데이터(전역) 2.

## 분류에서 애매했던 점

- `src/services/claude/schemas/report.ts:91,96` 의 `JSON 파싱 실패: …`/`스키마 검증 실패: …` 는 그 자체로 표시되지는 않지만 `report/index.ts:59` 문구의 `(${result.parseError})` 자리에 그대로 삽입되어 사용자가 본다(모의 `MOCK_INVALID_REPORT` 시나리오로 확인 가능). 사용자 노출로 넣고 종류를 "서버 오류 메시지(삽입)" 로 표시했다.
- `api/conversations/[id]/report/route.ts:26`(GET 404) 와 `api/usage/route.ts:18` 은 현재 UI 가 호출하지 않는 API 경로의 오류다. API 응답 문구라 사용자 노출(API 오류(공통))로 세었다.
- `services/report/index.ts:78`·`services/conversation/index.ts:71` 의 `대화를 찾을 수 없습니다.` 는 페이지에서는 `notFound()` 로 바뀌고 API 에서만 그대로 나간다.
- 테마 `label` 은 채팅 목록·통화 설정의 옵션, 채팅 툴바, 통화 헤더, 기록·홈 목록, 리포트·트랜스크립트 메타 줄에 두루 쓰여 화면을 "테마(공통)" 으로 적었다. `usage/index.ts` 의 기능명 `채팅`/`전화 영어`/`리포트`/`포트폴리오` 와 헤더 메뉴·기록 필터의 같은 단어는 각각 별도 행(같은 문구가 여러 곳에 흩어져 있음 — 2단계에서 한 곳으로 모을 후보).
- 같은 문구가 클라이언트와 서버 양쪽에 있는 것: `PDF 파일을 선택하세요.`(PortfolioManager:29 / api/portfolios:26), `네트워크 오류가 발생했습니다. 다시 시도하세요.`(AuthForm:34 / errors.ts:28), `포트폴리오를 찾을 수 없습니다.`(portfolio/index:49 / conversation/index:28), `서버 오류가 발생했습니다.`(conversation/index:276 / http.ts:56), `입력이 올바르지 않습니다.`(http.ts:40,54), `이미 가입된 이메일입니다.`(signup:19,33), `기록이 없습니다.`(history:29 / usage:156,195).
- 오프닝 라인(2b)은 UI 크롬이 아니라 대화의 첫 문장이지만 코드에 고정된 문자열이고 화면에 그대로 찍히므로 인벤토리에는 넣었다.
