# UI 문구 개정표 (2단계)

`STRINGS.md`(0단계 인벤토리) 의 사용자 노출 347행(표 1 의 1~336행 + 표 2b 의 337~347행) 각각에 대한 원문 → 개정 → 이유. 개정 문구의 단일 출처는 `src/content/ko.ts` 이고, 규칙 번호는 `WRITING.md` 2절(예: 2.1 해요체, 2.2 버튼, 2.7 오류, 2.8 빈 상태, 2.12 금지 표현)과 3절 용어집을 가리킨다.

읽는 법
- `개정` 열: `유지` 는 원문 그대로(ko.ts 에 같은 문구가 있음), `삭제` 는 문구 자체가 없어진 것(이모지, 단독 `…`, 기술 정보 삽입값), 그 밖에는 ko.ts 의 새 문구 그대로. 한 원문이 두 문구로 갈라진 경우 ` / ` 로 나눠 적고 키도 둘 다 적었다.
- `ko.ts 키` 열: 템플릿은 함수 키로 적었다(예: `common.messagesCount(n)`). 구분자(` · `)와 데이터 값(제목·이름·날짜)만 있는 행은 키가 없어 `—` 로 적고 어디서 조합되는지 괄호에 적었다. `(대체)` 는 삭제된 문구 자리에 대신 들어가는 키다.
- 원문의 앞뒤 공백은 0단계 표 그대로다(예: ` · 종료`). 템플릿 자리(`{n}`, `${limit}`)는 원문대로 두고, 개정 열에는 ko.ts 함수의 자리 이름으로 적었다.
- 모의 응답(`src/services/claude/mock-provider.ts`, STRINGS.md 3절 22줄)은 UI 문구가 아니라 이 표에 넣지 않았다. 다만 2.11(칭찬·교정 균형)과 2.1 에 맞춰 모의 리포트의 summary·점수 comment·교정 explanation·structureFeedback·technicalClarity comment 를 해요체와 "이렇게 써요" 톤으로 함께 고쳤다(모의 모드 스크린샷의 일관성 목적).

## 1. 개정표 (347행)

| # | 화면/영역 | 원문 | 개정 | ko.ts 키 | 이유 |
|---|---|---|---|---|---|
| 1 | 로그인·회원가입 | `네트워크 오류가 발생했습니다. 다시 시도하세요.` | `서버에 연결하지 못했어요. 네트워크를 확인한 뒤 다시 시도하세요.` | `auth.networkError` | 2.12 금지(오류가 발생했습니다→서술), 2.7 무슨 일+할 일 |
| 2 | 로그인·회원가입 | `로그인` | 유지 | `auth.loginTitle` | 유지, 관용어(2.2) |
| 3 | 로그인·회원가입 | `회원가입` | 유지 | `auth.signupTitle` | 유지, 관용어(2.2) |
| 4 | 회원가입 | `이름` | 유지 | `auth.name` | 유지, 명사 레이블 규칙 부합(2.4) |
| 5 | 로그인·회원가입 | `이메일` | 유지 | `auth.email` | 유지, 명사 레이블 규칙 부합(2.4) |
| 6 | 로그인·회원가입 | `비밀번호` | 유지 | `auth.password` | 유지, 명사 레이블 규칙 부합(2.4) |
| 7 | 로그인 | `로그인` | 유지 | `auth.loginButton` | 유지, 관용어(2.2) |
| 8 | 회원가입 | `가입하기` | 유지 | `auth.signupButton` | 유지, 2.2 주 버튼 ~하기 부합 |
| 9 | 리포트 | `리포트를 생성하는 중입니다. 보통 30초에서 1분 정도 걸립니다…` | `리포트를 만드는 중 / 보통 1분 안에 끝나요.` | `report.making / report.makingHint` | 2.9 대상+~하는 중, 예상 시간 분리; 2.12 금지(생성→만들기); 2.4 말줄임표 제거 |
| 10 | 리포트 | `아직 리포트가 없습니다.` | `아직 리포트가 없어요.` | `report.missing` | 2.1 해요체, 2.8 빈 상태(다음 행동은 report.missingHint·report.make) |
| 11 | 리포트 | `다시 시도` | 유지 | `common.retry` | 유지, 2.2 보조 버튼 명사형 부합 |
| 12 | 리포트 | `리포트 생성` | `리포트 만들기` | `report.make` | 2.2 주 버튼 ~하기, 2.12 금지(생성→만들기) |
| 13 | 리포트 | `${label} ${score}점` | `${label} ${score}점, 10점 만점` | `report.scoreAria(label, score)` | 2.6 점수 표기 통일(만점 기준을 항상 읽어 줌), 15행과 한 키로 통합 |
| 14 | 리포트 | `{score}/10` | 유지 | `report.scoreOf(score)` | 유지, 2.6 점수 표기 부합 |
| 15 | 리포트 | `${label} ${score}점 (10점 만점)` | `${label} ${score}점, 10점 만점` | `report.scoreAria(label, score)` | 2.4 구두점(괄호→쉼표, 스크린리더 읽기) |
| 16 | 리포트 | `요약` | 유지 | `report.sections.summary` | 유지, 제목 3~4어절 부합(2.3) |
| 17 | 리포트 | `종합 점수` | `점수` | `report.sections.scores` | 2.3 잡초 뽑기("종합" 은 빼도 뜻이 같음) |
| 18 | 리포트 | `문법` | 유지 | `report.scoreLabels.grammar` | 유지, 명사 레이블 규칙 부합 |
| 19 | 리포트 | `어휘` | 유지 | `report.scoreLabels.vocabulary` | 유지, 명사 레이블 규칙 부합 |
| 20 | 리포트 | `유창성` | 유지 | `report.scoreLabels.fluency` | 유지, 명사 레이블 규칙 부합 |
| 21 | 리포트 | `과제 수행` | 유지 | `report.scoreLabels.task` | 유지, 명사 레이블 규칙 부합 |
| 22 | 리포트 | `기술 설명의 명확성` | 유지 | `report.scoreLabels.technicalClarity` | 유지, 명사 레이블 규칙 부합 |
| 23 | 리포트 | `문법 교정` | 유지 | `report.sections.grammar` | 유지, 용어집(교정) |
| 24 | 리포트 | `교정할 문장이 없습니다.` | `이번 대화에는 다듬을 문장이 없었어요.` | `report.grammarEmpty` | 2.8 할 일 없는 빈 상태는 완료로, 2.1 해요체 |
| 25 | 리포트 | `→` | 삭제 | (대체) `report.original · report.corrected` | 2.11 원문→고친 문장→이유 구조를 기호 대신 레이블("내가 한 말"/"이렇게 말해요")로 |
| 26 | 리포트 | `어휘 제안` | 유지 | `report.sections.vocabulary` | 유지, 용어집(제안) |
| 27 | 리포트 | `제안할 어휘가 없습니다.` | `이번 대화에는 바꿀 만한 어휘가 없었어요.` | `report.vocabularyEmpty` | 2.8 할 일 없는 빈 상태는 완료로, 2.1 해요체 |
| 28 | 리포트 | `→` | 삭제 | (대체) `report.original · report.corrected` | 2.11 원문→제안 구조를 기호 대신 레이블로 |
| 29 | 리포트 | `{v.meaning} · {v.example}` | `뜻 / 예문 (각각 레이블 + 별도 줄)` | `report.meaning / report.example` | 2.5 영어 예문은 한국어 문장과 섞지 않고 별도 줄, 2.4 가운뎃점은 메타 정보에만 |
| 30 | 리포트 | `더 나은 표현` | 유지 | `report.sections.better` | 유지, 제목 규칙 부합 |
| 31 | 리포트 | `다음 연습 과제` | 유지 | `report.sections.nextTasks` | 유지, 제목 규칙 부합 |
| 32 | 리포트 | `면접 피드백` | 유지 | `report.sections.interview` | 유지, 제목 규칙 부합 |
| 33 | 리포트 | `예상 추가 질문` | 유지 | `report.sections.followUps` | 유지, 제목 규칙 부합 |
| 34 | 전역 헤더 | `로그아웃` | 유지 | `nav.logout` | 유지, 관용어(2.2) |
| 35 | 채팅 목록 | `새 채팅` | 유지 | `chat.newChatForm` | 유지, 명사 레이블(aria) 부합 |
| 36 | 채팅 목록 | `테마` | 유지 | `themes.label` | 유지, 용어집(테마) |
| 37 | 채팅 목록 | `{t.label} — {t.description}` | `{이름} / {설명} (이름과 설명을 별도 요소로)` | `themes.names.* / themes.descriptions.*` | 2.3 한 문장에 정보 하나(설명은 보조 텍스트로 분리), 2.4 줄표 구분 제거 |
| 38 | 채팅 목록 | `교정 힌트 켜기` | `교정 힌트 (설명: 켜면 내 메시지마다 상대 답변 아래에 한 줄 교정이 붙어요.)` | `chat.hintsToggle / chat.hintsToggleDesc` | 용어집(교정 힌트) 명사 레이블로, 2.3 설명은 별도 문장 |
| 39 | 채팅 목록 | `새 채팅 시작` | `채팅 시작하기` | `chat.start` | 2.2 주 버튼 ~하기 |
| 40 | 채팅 | `${(e as Error).message} 화면을 새로고침해 대화 상태를 확인하세요.` | `연결이 끊겨 답변을 받지 못했어요. 화면을 새로고침하면 지금까지의 대화를 볼 수 있어요.` | `chat.networkError` | 2.7 오류 구조·기술 정보(예외 메시지 삽입) 제거 |
| 41 | 채팅 | `· {props.title}` | 유지 | — (구분자, 제목은 데이터) | 유지, 2.4 가운뎃점 메타 구분 부합 |
| 42 | 채팅 | `교정 힌트` | 유지 | `chat.hintsToggle` | 유지, 용어집(교정 힌트) |
| 43 | 채팅 | `리포트 생성 중…` | `리포트를 만드는 중` | `chat.makingReport` | 2.9 대상+~하는 중, 2.12 금지(생성→만들기), 2.4 말줄임표 제거 |
| 44 | 채팅 | `리포트 다시 생성` | `리포트 다시 만들기` | `chat.remakeReport` | 2.12 금지(생성→만들기); 2.10 확인 대화(chat.remakeConfirm*) 를 거침 |
| 45 | 채팅 | `리포트 생성` | `리포트 만들기` | `chat.makeReport` | 2.2 주 버튼 ~하기, 2.12 금지(생성→만들기) |
| 46 | 채팅 | `리포트 보기` | 유지 | `chat.viewReport` | 유지, 2.2 보조 버튼 명사형 부합 |
| 47 | 채팅 | `대화` | 유지 | `chat.logLabel` | 유지, 용어집(통화 중·채팅 실시간 영역은 "대화") |
| 48 | 채팅 | `영어로 첫 메시지를 보내 보세요. 예: "Hi! Can I tell you about my week?"` | `영어로 첫 메시지를 보내 보세요 / Hi! Can I tell you about my week?` | `chat.emptyTitle / chat.emptyExample` | 2.5 영어 문장은 따옴표 없이 별도 줄, 2.4 제목형 마침표 없음, 2.8 빈 상태 |
| 49 | 채팅 | `교정 힌트: {m.hint}` | 유지 | `chat.hintLabel` | 유지, 용어집(교정 힌트); 콜론·힌트 본문은 컴포넌트 |
| 50 | 채팅 | `…` | 삭제 | (대체) `chat.waiting` | 2.4 "…" 단독 표시 금지, 2.9 "답변을 기다리는 중" 으로 |
| 51 | 채팅 | `다시 시도` | `다시 보내기` | `common.retrySend` | 2.2 누르면 무슨 일이 생기는지 예측(실패한 메시지를 다시 보냄) |
| 52 | 채팅 | `종료된 대화입니다. 새 대화를 시작하세요.` | `끝난 대화예요. / 새 채팅 시작하기` | `chat.endedNotice / chat.endedAction` | 2.1 해요체, 2.8 상황 한 문장+다음 행동 버튼, 2.2 ~하기 |
| 53 | 채팅 | `메시지` | 유지 | `chat.inputLabel` | 유지, 명사 레이블 규칙 부합 |
| 54 | 채팅 | `영어로 입력 (Enter 전송, Shift+Enter 줄바꿈)` | `영어로 입력. Enter 로 보내고 Shift+Enter 로 줄을 바꿔요` | `chat.inputPlaceholder` | 2.4 괄호 대신 문장, 2.5 키 이름은 영어 그대로 |
| 55 | 채팅 | `보내기` | 유지 | `chat.send` | 유지, 2.2 목적어 자명한 주 버튼 부합 |
| 56 | 포트폴리오 | `PDF 파일을 선택하세요.` | `PDF 파일을 고르세요.` | `portfolio.fileRequired` | 2.3 쉬운 말(선택→고르다), 통화 설정 "골라야 해요" 와 동사 통일 |
| 57 | 포트폴리오 | `"${created.portfolio.title}" 등록 완료 (${created.portfolio.chars.toLocaleString()}자)` | `${title} 을(를) 추가했어요 (${chars}).` | `portfolio.added(title, chars)` | 2.12 금지(완료→문장, 등록→추가), 2.1 해요체, 2.6 글자 수는 common.chars |
| 58 | 포트폴리오 | `이 포트폴리오를 삭제할까요?` | `포트폴리오를 삭제할까요?` | `portfolio.deleteTitle` | 2.10 확인 대화(브라우저 confirm→Dialog, 본문·버튼 분리), 2.3 잡초("이") |
| 59 | 포트폴리오 | `포트폴리오 등록` | `포트폴리오 추가` | `portfolio.formLabel` | 2.12 금지(등록→추가), 용어집(추가) |
| 60 | 포트폴리오 | `입력 방식` | 유지 | `portfolio.modeLabel` | 유지, 명사 레이블 규칙 부합 |
| 61 | 포트폴리오 | `텍스트/마크다운 붙여넣기` | `텍스트나 마크다운 붙여넣기` | `portfolio.modeText` | 2.12 우리말 어순(슬래시→"나") |
| 62 | 포트폴리오 | `PDF 업로드` | `PDF 올리기` | `portfolio.modePdf` | 2.5 외래어 최소화, 오류 문구 "올릴 수 있어요" 와 동사 통일 |
| 63 | 포트폴리오 | `제목` | 유지 | `portfolio.title` | 유지, 명사 레이블 규칙 부합 |
| 64 | 포트폴리오 | `비우면 파일 이름을 씁니다` | `비우면 파일 이름을 써요` | `portfolio.titlePlaceholderPdf` | 2.1 해요체 |
| 65 | 포트폴리오 | `예: 2025 백엔드 포트폴리오` | 유지 | `portfolio.titlePlaceholderText` | 유지, 플레이스홀더 마침표 없음(2.4) 부합 |
| 66 | 포트폴리오 | `내용` | 유지 | `portfolio.content` | 유지, 명사 레이블 규칙 부합 |
| 67 | 포트폴리오 | `프로젝트 설명, 역할, 기술 스택, 성과를 영어 또는 한국어로…` | `프로젝트 설명, 역할, 기술 스택, 성과. 영어나 한국어로 써도 돼요` | `portfolio.contentPlaceholder` | 2.4 말줄임표는 진행 중에만, 2.1 해요체 |
| 68 | 포트폴리오 | `PDF 파일` | 유지 | `portfolio.file` | 유지, 명사 레이블 규칙 부합 |
| 69 | 포트폴리오 | `등록 중…` | `추가하는 중` | `portfolio.submitting` | 2.9 ~하는 중, 2.12 금지(등록→추가), 2.4 말줄임표 제거 |
| 70 | 포트폴리오 | `등록` | `포트폴리오 추가하기` | `portfolio.submit` | 2.2 주 버튼 목적어+~하기, 2.12 금지(등록→추가) |
| 71 | 포트폴리오 | `등록된 포트폴리오` | `추가한 포트폴리오` | `portfolio.listTitle` | 2.12 금지(등록→추가) |
| 72 | 포트폴리오 | `아직 없습니다.` | `아직 포트폴리오가 없어요. 아래에서 추가하면 포트폴리오 면접에서 쓸 수 있어요.` | `portfolio.empty` | 2.8 빈 상태+다음 행동, 2.1 해요체 (4단계에서 폼이 목록 아래로 가며 "위에서"→"아래에서") |
| 73 | 포트폴리오 | `${p.title} 삭제` | 유지 | `portfolio.deleteLabel(title)` | 유지, aria 레이블 규칙 부합 |
| 74 | 포트폴리오 | `삭제` | 유지 | `common.delete` | 유지, 2.2 보조 버튼 명사형 부합 |
| 75 | 포트폴리오 | `{formatDateTime(p.createdAt)} · {p.chars.toLocaleString()}자` | 유지 | `common.chars(n) (+ formatDateTime)` | 유지, 2.6 숫자 쉼표·단위 붙여쓰기, 2.4 가운뎃점 메타 구분 부합 |
| 76 | 포트폴리오 | `…` | 삭제 | — (미리보기 줄임은 CSS text-overflow) | 2.4 "…" 는 진행 중 상태에만 |
| 77 | 설정 | `저장했습니다.` | `설정을 저장했어요.` | `settings.saved` | 2.1 해요체, 2.12 결과를 문장으로 |
| 78 | 설정 | `설정` | 유지 | `settings.formLabel` | 유지, 명사 레이블(aria) 부합 |
| 79 | 설정 | `새 채팅에서 교정 힌트 기본 켜기` | `새 채팅에서 교정 힌트 켜 두기 (설명: 채팅마다 끄고 켤 수 있어요.)` | `settings.hintsDefault / settings.hintsDefaultHint` | 2.3 쉬운 말(기본 켜기→켜 두기), 설명은 별도 문장 |
| 80 | 설정 | `TTS 음성` | `상대 목소리` | `settings.voice` | 2.5 약어 금지(TTS), 용어집(상대 목소리) |
| 81 | 설정 | `브라우저 기본 (영어)` | 유지 | `settings.voiceDefault` | 유지, 옵션 레이블 규칙 부합 |
| 82 | 설정 | `미리 듣기` | 유지 | `settings.voicePreview` | 유지, 2.2 보조 버튼 명사형 부합 |
| 83 | 설정 | `이 브라우저에서 사용할 수 있는 음성 목록을 불러오지 못했습니다.` | `이 브라우저에서 쓸 수 있는 목소리 목록을 불러오지 못했어요. 기본 목소리로 재생해요.` | `settings.voiceEmpty` | 2.7 무슨 일+그래서 어떻게 되는지, 용어집(목소리), 2.1 해요체 |
| 84 | 설정 | `통화 기본 길이` | 유지 | `settings.defaultMinutes` | 유지, 명사 레이블 규칙 부합 |
| 85 | 설정 | `{m}분` | 유지 | `common.minutes(m)` | 유지, 2.6 단위 붙여쓰기 부합 |
| 86 | 설정 | `저장` | `저장하기` | `settings.save` | 2.2 주 버튼 ~하기 |
| 87 | 전역 헤더 | `홈` | 유지 | `nav.home` | 유지, 메뉴 명사 레이블 부합 |
| 88 | 전역 헤더 | `채팅` | 유지 | `nav.chat` | 유지, 용어집(채팅) |
| 89 | 전역 헤더 | `전화 영어` | 유지 | `nav.call` | 유지, 용어집(전화 영어) |
| 90 | 전역 헤더 | `기록` | 유지 | `nav.history` | 유지, 메뉴 명사 레이블 부합 |
| 91 | 전역 헤더 | `포트폴리오` | 유지 | `nav.portfolios` | 유지, 용어집(포트폴리오) |
| 92 | 전역 헤더 | `사용량` | 유지 | `nav.usage` | 유지, 용어집(사용량) |
| 93 | 전역 헤더 | `설정` | 유지 | `nav.settings` | 유지, 메뉴 명사 레이블 부합 |
| 94 | 전역 헤더 | `주 메뉴` | 유지 | `nav.menuLabel` | 유지, aria 레이블 규칙 부합 |
| 95 | 통화 중 | ` · {formatDuration(durationSec)} 통화` | 유지 | `callLive.totalDuration(duration) (헤더는 callLive.callOf)` | 유지, 2.6 m:ss·2.4 가운뎃점 메타 구분 부합 |
| 96 | 통화 중 | `남은 시간` | 유지 | `callLive.timerLabel` | 유지, aria 레이블 규칙 부합 |
| 97 | 통화 중 | `상대가 먼저 인사를 건넵니다. 영어로 자연스럽게 대답하세요. 통화가 끝나면 교정 리포트가 만들어집니다.` | `상대가 먼저 인사해요. 영어로 편하게 답하면 돼요. 통화가 끝나면 교정 리포트가 만들어져요.` | `callLive.idleBody` | 2.1 해요체, 2.3 짧게(제목 callLive.idleTitle 신규) |
| 98 | 통화 중 | `통화 시작` | `통화 시작하기` | `callLive.start` | 2.2 주 버튼 ~하기 |
| 99 | 통화 중 | `이 브라우저는 음성 인식을 지원하지 않아 텍스트로 대화합니다.` | `이 브라우저는 음성 인식을 지원하지 않아 글로 대화해요.` | `callLive.textModeNotice` | 2.1 해요체, 2.3 쉬운 말(텍스트→글) |
| 100 | 통화 중 | ` 음성 합성도 지원하지 않아 답변은 글로만 표시됩니다.` | `소리 재생도 지원하지 않아 상대 답변은 글로만 보여요.` | `callLive.noTtsNotice` | 2.1 해요체, 2.5 전문어(음성 합성→소리 재생), 용어집(상대) |
| 101 | 통화 중 | `상대가 말하는 중` | 유지 | `callLive.status.speaking` | 유지, 2.9 ~하는 중 부합 |
| 102 | 통화 중 | `상대가 생각하는 중…` | `상대가 생각하는 중` | `callLive.status.thinking` | 2.4 상태 문구는 "~하는 중" 으로 끝내고 말줄임표 제거 |
| 103 | 통화 중 | `음소거` | 유지 | `callLive.status.muted` | 유지, 상태 1줄 명사형 부합 |
| 104 | 통화 중 | `듣는 중` | 유지 | `callLive.status.listening` | 유지, 2.9 ~하는 중 부합 |
| 105 | 통화 중 | `입력 대기` | 유지 | `callLive.status.waitingInput` | 유지, 상태 1줄 명사형 부합 |
| 106 | 통화 중 | `통화를 마치고 리포트를 만드는 중입니다… (30초~1분)` | `리포트를 만드는 중 / 통화를 마쳤어요. 보통 1분 안에 끝나요.` | `callLive.status.ending / callLive.status.endingHint` | 2.9 상태 1줄+예상 시간 분리, 2.4 괄호·말줄임표 제거 |
| 107 | 통화 중 | `리포트로 이동합니다…` | `리포트로 이동해요` | `callLive.status.ended` | 2.1 해요체, 2.4 말줄임표 제거 |
| 108 | 통화 중 | `실시간 트랜스크립트` | `대화` | `callLive.logLabel` | 용어집(통화 중 실시간 영역은 "대화", 트랜스크립트 금지) |
| 109 | 통화 중 | `…` | 삭제 | (대체) `callLive.interimLabel` | 2.4 "…" 단독 표시 금지, 인식 중 말풍선은 "인식 중" 레이블 |
| 110 | 통화 중 | `말할 내용` | 유지 | `callLive.textInputLabel` | 유지, 레이블 규칙 부합 |
| 111 | 통화 중 | `영어로 입력하고 Enter` | 유지 | `callLive.textInputPlaceholder` | 유지, 2.5 키 이름 영어·플레이스홀더 마침표 없음 부합 |
| 112 | 통화 중 | `말하기` | 유지 | `callLive.say` | 유지, 2.2 목적어 자명한 버튼 부합 |
| 113 | 통화 중 | `음소거 해제` | 유지 | `callLive.unmute` | 유지, 2.2 전환 버튼 명사형 부합 |
| 114 | 통화 중 | `음소거` | 유지 | `callLive.mute` | 유지, 2.2 전환 버튼 명사형 부합 |
| 115 | 통화 중 | `10분 연장` | 유지 | `callLive.extend` | 유지, 용어집(10분 연장) |
| 116 | 통화 중 | `끊기` | 유지 | `callLive.hangup` | 유지, 용어집(끊기); aria 는 callLive.hangupLabel |
| 117 | 통화 중 | `턴 상한에 도달해 통화를 마칩니다.` | `대화 횟수 한도에 닿아 통화를 마쳐요.` | `callLive.turnCapEnd` | 용어집(턴 상한→대화 횟수 한도), 2.1 해요체 |
| 118 | 통화 설정 | `아직 확인하지 않았습니다.` | `아직 확인하지 않았어요. 통화 시작 전에 한 번 확인하면 첫 인사를 놓치지 않아요.` | `callSetup.micUnknown` | 2.1 해요체, 2.8 상황+다음 행동 이유 |
| 119 | 통화 설정 | `확인 중…` | `마이크를 확인하는 중` | `callSetup.micChecking` | 2.9 대상+~하는 중, 2.4 말줄임표 제거 |
| 120 | 통화 설정 | `마이크를 사용할 수 있습니다.` | `마이크를 쓸 수 있어요.` | `callSetup.micGranted` | 2.1 해요체 |
| 121 | 통화 설정 | `마이크 권한이 거부되었습니다. 브라우저 주소창의 권한 설정에서 허용하세요. 텍스트 입력으로도 통화할 수 있습니다.` | `마이크 권한이 꺼져 있어요. 주소창 왼쪽 자물쇠에서 마이크를 허용하거나, 글로 통화할 수도 있어요.` | `callSetup.micDenied` | 2.7 비난하지 않음(거부→꺼져 있어요)+구체적 할 일, 2.1 해요체 |
| 122 | 통화 설정 | `이 브라우저에서는 마이크를 쓸 수 없습니다. 텍스트 입력으로 통화합니다.` | `이 브라우저에서는 마이크를 쓸 수 없어요. 글로 통화해요.` | `callSetup.micUnavailable` | 2.1 해요체, 2.3 쉬운 말 |
| 123 | 통화 설정 | `통화 설정` | 유지 | `callSetup.formLabel` | 유지, aria 레이블 규칙 부합 |
| 124 | 통화 설정 | `테마` | 유지 | `themes.label` | 유지, 용어집(테마) |
| 125 | 통화 설정 | `{t.label} — {t.description}` | `{이름} / {설명} (이름과 설명을 별도 요소로)` | `themes.names.* / themes.descriptions.*` | 2.3 한 문장에 정보 하나, 2.4 줄표 구분 제거(37행과 같음) |
| 126 | 통화 설정 | `포트폴리오` | 유지 | `callSetup.portfolioLabel` | 유지, 용어집(포트폴리오) |
| 127 | 통화 설정 | `등록된 포트폴리오가 없습니다. 포트폴리오 관리에서 먼저 등록하세요.` | `아직 포트폴리오가 없어요. 먼저 추가해야 이 테마로 통화할 수 있어요.` | `callSetup.portfolioEmpty` | 2.8 빈 상태+다음 행동, 2.12 금지(등록→추가), 2.1 해요체 |
| 128 | 통화 설정 | `포트폴리오 관리` | `포트폴리오 추가하기` | `callSetup.portfolioAdd` | 2.8 다음 행동 버튼 1개, 2.2 ~하기 |
| 129 | 통화 설정 | `통화 시간` | 유지 | `callSetup.durationLegend` | 유지, 레이블 규칙 부합 |
| 130 | 통화 설정 | `테스트(20초)` | `테스트 20초` | `callSetup.durationTest` | 2.4 옵션에 괄호 없이, 2.6 숫자·단위 |
| 131 | 통화 설정 | `${m}분` | 유지 | `common.minutes(m)` | 유지, 2.6 단위 붙여쓰기 부합 |
| 132 | 통화 설정 | `마이크` | 유지 | `callSetup.micLegend` | 유지, 레이블 규칙 부합 |
| 133 | 통화 설정 | `마이크 권한 확인` | `마이크 확인하기` | `callSetup.micCheck` | 용어집(마이크 확인), 2.2 ~하기 |
| 134 | 통화 설정 | `이 브라우저는 음성 인식(Web Speech API)을 지원하지 않습니다. Chrome 을 권장하며, 텍스트 입력으로 통화를 진행할 수 있습니다.` | `이 브라우저는 음성 인식을 지원하지 않아요. Chrome 을 권하고, 지금은 글로 통화할 수 있어요.` | `callSetup.sttUnsupported` | 2.7 기술 정보 제거(Web Speech API), 2.1 해요체, 2.5 고유명사 Chrome 유지 |
| 135 | 통화 설정 | `다음` | 유지 | `callSetup.next` | 유지, 2.2 보조 버튼 명사형; 뒤에 오는 화면은 callSetup.nextHint 가 예고 |
| 136 | 배너 | `모의 모드(CLAUDE_MOCK=1)입니다. Claude API 를 호출하지 않고 가짜 응답을 보여 줍니다.` | `연습용 가짜 응답을 보여 주는 모의 모드예요. Claude 에 연결하지 않아요.` | `banner.mock` | 2.7 기술 정보(환경 변수) 제거, 2.5 약어 금지(API→Claude 연결), 2.1 해요체 |
| 137 | 배너 | `Claude API 키가 설정되지 않았습니다. 운영자가 .env 의 LEO_ANTHROPIC_API_KEY 를 채우고 서버를 다시 시작해야 채팅과 통화가 동작합니다.` | `Claude 연결이 설정되지 않았어요 / 채팅과 통화를 쓰려면 운영자가 Claude 연결을 설정해야 해요. / .env 의 LEO_ANTHROPIC_API_KEY 를 채우고 서버를 다시 시작하세요.` | `banner.noKeyTitle / banner.noKeyBody / banner.noKeyOperator` | 2.7 사용자 문구와 운영자 문구 분리, 변수명은 운영자 문구에만, 2.5 약어 금지(API) |
| 138 | 리포트·채팅·통화 중 | `리포트를 만들려면 사용자 발화가 최소 1개 필요합니다.` | `내가 한 말이 하나는 있어야 리포트를 만들 수 있어요.` | `errors.report.empty` | 2.1 해요체, 용어집(사용자→나), 2.3 쉬운 말(발화) |
| 139 | 리포트·채팅·통화 중 | `리포트 생성 실패: ${describeClaudeError(e)}` | `리포트를 만들지 못했어요. ${reason}` | `errors.report.provider(reason)` | 2.12 금지(실패→서술, 생성→만들기), 2.7 무슨 일+원인 |
| 140 | 리포트·채팅·통화 중 | `모델이 이 대화의 리포트 생성을 거부했습니다. 다시 시도하거나 새 대화를 시작하세요.` | `상대가 이 대화의 리포트는 만들지 않기로 했어요. 다시 시도하거나 새 대화를 시작하세요.` | `errors.report.refusal` | 용어집(모델→상대), 2.12 금지(생성·거부 판정어), 2.1 해요체 |
| 141 | 리포트·채팅·통화 중 | `리포트 형식이 올바르지 않아 저장하지 못했습니다 (${result.parseError}). 다시 시도하세요.` | `리포트 형식이 맞지 않아 저장하지 못했어요. 다시 시도하면 대부분 해결돼요.` | `errors.report.invalid` | 2.7 기술 정보 제거(parseError 삽입 제거, 로그에만), 2.12 금지(올바르지 않은) |
| 142 | API 오류(공통) | `대화를 찾을 수 없습니다.` | `대화를 찾을 수 없어요.` | `errors.conversation.notFound` | 2.1 해요체 |
| 143 | 사용량 | `오늘` | 유지 | `usage.periods.today` | 유지, 필터 레이블 규칙 부합 |
| 144 | 사용량 | `7일` | 유지 | `usage.periods["7d"]` | 유지, 2.6 숫자 표기 부합 |
| 145 | 사용량 | `30일` | 유지 | `usage.periods["30d"]` | 유지, 2.6 숫자 표기 부합 |
| 146 | 사용량 | `전체` | `전체 기간` | `usage.periods.all` | 2.2 라벨로 결과 예측(사용자 필터의 "전체" 와 구분) |
| 147 | 사용량 | `채팅` | 유지 | `usage.features.chat` | 유지, 용어집(채팅) |
| 148 | 사용량 | `전화 영어` | 유지 | `usage.features.call` | 유지, 용어집(전화 영어) |
| 149 | 사용량 | `리포트` | 유지 | `usage.features.report` | 유지, 용어집(리포트) |
| 150 | 사용량 | `포트폴리오` | 유지 | `usage.features.portfolio` | 유지, 용어집(포트폴리오) |
| 151 | 포트폴리오 | `포트폴리오 내용이 비어 있습니다.` | `포트폴리오 내용을 입력하세요.` | `errors.portfolio.emptyContent` | 2.7 할 수 있는 것(동사 지시) |
| 152 | 포트폴리오 | `포트폴리오는 ${PORTFOLIO_MAX_CHARS.toLocaleString()}자 이하여야 합니다.` | `포트폴리오는 ${max}자까지 넣을 수 있어요.` | `errors.portfolio.tooLong(max)` | 2.1 해요체, 2.7 무엇이 맞는지 |
| 153 | 포트폴리오 | `제목을 입력하세요.` | 유지 | `errors.portfolio.emptyTitle` | 유지, 2.1 지시형 "~하세요" 부합 |
| 154 | 포트폴리오 | `포트폴리오를 찾을 수 없습니다.` | `포트폴리오를 찾을 수 없어요.` | `errors.portfolio.notFound` | 2.1 해요체 |
| 155 | 포트폴리오 | `진행 중인 통화가 이 포트폴리오를 쓰고 있습니다. 통화를 끝낸 뒤 삭제하세요.` | `진행 중인 통화가 이 포트폴리오를 쓰고 있어요. 통화를 끝낸 뒤 삭제하세요.` | `errors.portfolio.inUse` | 2.1 해요체 |
| 156 | 리포트·채팅·통화 중 | `JSON 파싱 실패: ${(e as Error).message}` | 삭제 | — (로그에만) | 2.7 기술 용어(JSON) 금지, 내부 원인은 로그에만; errors.report.invalid 에 삽입 자리 없음 |
| 157 | 리포트·채팅·통화 중 | `` 스키마 검증 실패: ${first ? `${first.path.join(".")} ${first.message}` : "알 수 없음"} `` | 삭제 | — (로그에만) | 2.7 기술 용어(스키마) 금지, 내부 원인은 로그에만 |
| 158 | 리포트·채팅·통화 중 | `알 수 없음` | 삭제 | — (로그에만) | 2.7 157행의 삽입값, 사용자 문구에서 제거 |
| 159 | 테마(공통) | `자유 대화` | 유지 | `themes.names.free` | 유지, 2.5 테마 이름 한국어 부합 |
| 160 | 테마(공통) | `주제 제한 없이 편하게 영어로 수다` | `주제 없이 편하게 수다` | `themes.descriptions.free` | 2.3 잡초 뽑기(제한·영어로) |
| 161 | 테마(공통) | `면접` | 유지 | `themes.names.interview` | 유지, 2.5 테마 이름 한국어 부합 |
| 162 | 테마(공통) | `해외 테크 회사 1차 면접 (행동 질문 + 기술 질문)` | `해외 테크 회사 1차 면접. 경험 질문과 가벼운 기술 질문` | `themes.descriptions.interview` | 2.4 괄호·기호(+) 대신 문장, 2.3 쉬운 말(행동 질문→경험 질문) |
| 163 | 테마(공통) | `일상` | 유지 | `themes.names.daily` | 유지, 2.5 테마 이름 한국어 부합 |
| 164 | 테마(공통) | `해외 생활 일상 상황 (카페, 병원, 집 구하기 등)` | `카페·병원·집 구하기 같은 해외 생활 상황` | `themes.descriptions.daily` | 2.4 괄호 제거, 2.3 핵심을 앞에 |
| 165 | 테마(공통) | `업무 일상` | `업무` | `themes.names.work` | 2.5 테마 이름 목록("업무"), 2.3 짧게("일상" 테마와 겹치는 단어 제거) |
| 166 | 테마(공통) | `동료와의 스탠드업, 코드 리뷰, 1:1 대화` | `스탠드업, 코드 리뷰, 동료와의 1:1` | `themes.descriptions.work` | 2.3 잡초 뽑기("대화")·어순 |
| 167 | 테마(공통) | `비즈니스` | 유지 | `themes.names.business` | 유지, 2.5 테마 이름 한국어 부합 |
| 168 | 테마(공통) | `거래처·고객과의 미팅, 요구사항 협의` | `거래처와 요구사항·일정 협의` | `themes.descriptions.business` | 2.3 한 문장에 정보 하나, 2.4 가운뎃점 절제 |
| 169 | 테마(공통) | `포트폴리오 면접` | 유지 | `themes.names.portfolio` | 유지, 2.5 테마 이름 한국어 부합 |
| 170 | 테마(공통) | `등록한 포트폴리오를 바탕으로 깊이 파고드는 기술 면접` | `내 포트폴리오를 바탕으로 깊이 파고드는 기술 면접` | `themes.descriptions.portfolio` | 2.12 금지(등록), 용어집(나) |
| 171 | API 오류(공통) | `Claude API 키가 설정되지 않았습니다. 운영자가 LEO_ANTHROPIC_API_KEY 를 설정해야 합니다.` | `Claude 연결이 설정되지 않았어요. 운영자에게 알려 주세요.` | `errors.claude.noKey` | 2.7 운영자만 고칠 수 있는 문제→"운영자에게 알려 주세요", 변수명 제거, 2.5 약어 금지(API) |
| 172 | API 오류(공통) | `Claude API 키가 올바르지 않거나 권한이 없습니다. 운영자에게 알려 주세요.` | `Claude 연결 설정이 맞지 않아요. 운영자에게 알려 주세요.` | `errors.claude.badKey` | 2.5 약어 금지(API 키→Claude 연결), 2.12 금지(올바르지 않은), 2.1 해요체 |
| 173 | API 오류(공통) | `Claude API 사용량 한도에 걸렸습니다. 잠시 후 다시 시도하세요.` | `지금은 Claude 요청이 몰려 있어요. 잠시 후 다시 시도하세요.` | `errors.claude.rateLimit` | 2.5 약어 금지(API), 2.7 원인별 문장(한도), 2.1 해요체 |
| 174 | API 오류(공통) | `Claude API 응답이 너무 늦어 중단했습니다. 다시 시도하세요.` | `Claude 응답이 너무 늦어 멈췄어요. 다시 시도하세요.` | `errors.claude.timeout` | 2.5 약어 금지(API), 2.1 해요체 |
| 175 | API 오류(공통) | `Claude API 에 연결하지 못했습니다. 네트워크를 확인하고 다시 시도하세요.` | `Claude 에 연결하지 못했어요. 네트워크를 확인한 뒤 다시 시도하세요.` | `errors.claude.connection` | 2.5 약어 금지(API), 2.1 해요체 |
| 176 | API 오류(공통) | `Claude API 오류(${e.status ?? "?"})가 발생했습니다. 잠시 후 다시 시도하세요.` | `Claude 가 응답하지 못했어요. 잠시 후 다시 시도하세요.` | `errors.claude.api` | 2.7 상태 번호 제거, 2.12 금지(오류가 발생했습니다), 2.5 약어 금지(API) |
| 177 | API 오류(공통) | `네트워크 오류가 발생했습니다. 다시 시도하세요.` | `서버에 연결하지 못했어요. 네트워크를 확인한 뒤 다시 시도하세요.` | `errors.claude.network` | 2.12 금지(오류가 발생했습니다), 2.7 무슨 일+할 일 |
| 178 | API 오류(공통) | `응답을 받지 못했습니다. 다시 시도하세요.` | `답변을 받지 못했어요. 다시 시도하세요.` | `errors.claude.unknown` | 2.1 해요체, 2.3 쉬운 말(응답→답변) |
| 179 | 채팅·통화 중 | `대화 1건당 최대 ${limit}턴까지만 가능합니다. 리포트를 생성하거나 새 대화를 시작하세요.` | `이 대화는 ${limit}번까지 보낼 수 있어요. 리포트를 만들거나 새 대화를 시작하세요.` | `errors.conversation.turnCap(limit)` | 용어집(턴→번), 2.12 금지(생성→만들기), 2.1 해요체 |
| 180 | 통화 설정 | `포트폴리오를 찾을 수 없습니다.` | `포트폴리오를 찾을 수 없어요.` | `errors.portfolio.notFound` | 2.1 해요체(154행과 한 키) |
| 181 | 통화 설정 | `포트폴리오 면접 테마는 포트폴리오를 골라야 합니다.` | `포트폴리오 면접 테마는 포트폴리오를 골라야 해요.` | `errors.conversation.portfolioRequired` | 2.1 해요체 |
| 182 | API 오류(공통) | `대화를 찾을 수 없습니다.` | `대화를 찾을 수 없어요.` | `errors.conversation.notFound` | 2.1 해요체(142행과 한 키) |
| 183 | 채팅·통화 중 | `이미 종료된 대화입니다.` | `이미 끝난 대화예요.` | `errors.conversation.ended` | 2.1 해요체, 2.3 쉬운 말(종료→끝난) |
| 184 | 채팅·통화 중 | `메시지를 입력하세요.` | 유지 | `errors.conversation.emptyMessage` | 유지, 2.1 지시형 "~하세요" 부합 |
| 185 | 채팅·통화 중 | `메시지가 너무 깁니다 (4000자 이하).` | `메시지는 4,000자까지 보낼 수 있어요.` | `errors.conversation.tooLong` | 2.7 무엇이 맞는지, 2.4 괄호 제거, 2.6 천 단위 쉼표 |
| 186 | 채팅·통화 중 | `상대가 이 주제에는 답하지 않기로 했습니다. 다른 주제로 대화를 이어가 보세요.` | `상대가 이 주제에는 답하지 않기로 했어요. 다른 주제로 이어가 보세요.` | `errors.conversation.refusal` | 2.1 해요체, 2.3 잡초 뽑기 |
| 187 | 채팅·통화 중 | `서버 오류가 발생했습니다.` | `서버에 문제가 생겨 처리하지 못했어요. 잠시 후 다시 시도하세요.` | `errors.internal` | 2.12 금지(오류가 발생했습니다), 2.7 무슨 일+할 일 |
| 188 | 포트폴리오 | `PDF 파일을 선택하세요.` | `PDF 파일을 고르세요.` | `errors.portfolio.fileRequired` | 2.3 쉬운 말(선택→고르다), 56행과 같은 문구 |
| 189 | 포트폴리오 | `PDF 는 10MB 이하여야 합니다.` | `PDF 는 10MB 까지 올릴 수 있어요.` | `errors.portfolio.fileTooLarge` | 2.7 무엇이 맞는지, 2.1 해요체 |
| 190 | 포트폴리오 | `PDF 파일만 올릴 수 있습니다.` | `PDF 파일만 올릴 수 있어요.` | `errors.portfolio.notPdf` | 2.1 해요체 |
| 191 | 포트폴리오 | `PDF 에서 텍스트를 추출하지 못했습니다. 텍스트로 붙여넣어 주세요.` | `PDF 에서 글자를 읽지 못했어요. 내용을 텍스트로 붙여넣어 주세요.` | `errors.portfolio.extractFailed` | 2.3 쉬운 말(추출→읽다), 2.1 해요체·부탁형 "~해 주세요" |
| 192 | 포트폴리오 | `PDF 에 추출할 텍스트가 없습니다(스캔 이미지일 수 있음). 텍스트로 붙여넣어 주세요.` | `PDF 에 읽을 글자가 없어요. 스캔 이미지라면 내용을 텍스트로 붙여넣어 주세요.` | `errors.portfolio.noText` | 2.4 괄호 대신 문장, 2.1 해요체 |
| 193 | 회원가입 | `이메일 형식이 아닙니다.` | `이메일 형식으로 입력하세요.` | `errors.auth.emailFormat` | 2.7 무엇이 맞는지·할 일 |
| 194 | 회원가입 | `비밀번호는 8자 이상이어야 합니다.` | `비밀번호는 8자 이상이어야 해요.` | `errors.auth.passwordMin` | 2.1 해요체 |
| 195 | 회원가입 | `이름을 입력하세요.` | 유지 | `errors.auth.nameRequired` | 유지, 2.1 지시형 "~하세요" 부합 |
| 196 | 회원가입 | `이미 가입된 이메일입니다.` | `이미 가입한 이메일이에요. 로그인하세요.` | `errors.auth.emailTaken` | 2.1 해요체, 2.7 할 수 있는 것(로그인) |
| 197 | 회원가입 | `이미 가입된 이메일입니다.` | `이미 가입한 이메일이에요. 로그인하세요.` | `errors.auth.emailTaken` | 2.1 해요체, 2.7 할 수 있는 것(196행과 한 키) |
| 198 | 로그인 | `이메일 또는 비밀번호가 올바르지 않습니다.` | `이메일이나 비밀번호가 맞지 않아요.` | `errors.auth.badCredentials` | 2.12 금지(올바르지 않은), 2.1 해요체 |
| 199 | 통화 중 | `통화만 연장할 수 있습니다.` | `통화만 연장할 수 있어요.` | `errors.conversation.notACall` | 2.1 해요체 |
| 200 | 통화 중 | `이미 종료된 통화입니다.` | `이미 끝난 통화예요.` | `errors.conversation.callEnded` | 2.1 해요체, 2.3 쉬운 말(종료→끝난) |
| 201 | 통화 중 | `통화는 최대 ${MAX_CALL_MINUTES}분까지입니다.` | `통화는 최대 ${max}분까지예요.` | `errors.conversation.maxDuration(max)` | 2.1 해요체 |
| 202 | API 오류(공통) | `리포트가 아직 없습니다.` | `아직 리포트가 없어요.` | `errors.report.notFound` | 2.1 해요체, report.missing 과 문구 통일 |
| 203 | API 오류(공통) | `기간 값이 올바르지 않습니다.` | `기간 값이 맞지 않아요.` | `errors.usage.badPeriod` | 2.12 금지(올바르지 않은), 2.1 해요체 |
| 204 | 설정 | `10, 20, 30 중 하나` | `10, 20, 30 중 하나여야 해요` | `errors.settings.badMinutes` | 2.1 해요체(zod 필드 메시지라 "필드: 메시지" 꼴, 마침표 없음) |
| 205 | 회원가입 | `회원가입 — LEO` | 유지 | `common.pageTitle(auth.signupTitle)` | 유지, 메타 제목 형식 부합 |
| 206 | 회원가입 | `회원가입` | 유지 | `auth.signupTitle` | 유지, 관용어(2.2) |
| 207 | 회원가입 | `초대받은 사용자만 가입합니다.` | `초대받은 분만 가입할 수 있어요.` | `auth.signupIntro` | 2.1 해요체 |
| 208 | 회원가입 | `이미 계정이 있나요?` | 유지 | `auth.haveAccount` | 유지, 2.4 진짜 질문의 물음표 부합 |
| 209 | 회원가입 | `로그인` | 유지 | `auth.toLogin` | 유지, 관용어(2.2) |
| 210 | 로그인 | `로그인 — LEO` | 유지 | `common.pageTitle(auth.loginTitle)` | 유지, 메타 제목 형식 부합 |
| 211 | 로그인 | `로그인` | 유지 | `auth.loginTitle` | 유지, 관용어(2.2) |
| 212 | 로그인 | `계정이 없나요?` | 유지 | `auth.noAccount` | 유지, 2.4 진짜 질문의 물음표 부합 |
| 213 | 로그인 | `회원가입` | 유지 | `auth.toSignup` | 유지, 관용어(2.2) |
| 214 | 포트폴리오 | `포트폴리오 — LEO` | 유지 | `common.pageTitle(portfolio.pageTitle)` | 유지, 메타 제목 형식 부합 |
| 215 | 포트폴리오 | `포트폴리오` | 유지 | `portfolio.pageTitle` | 유지, 용어집(포트폴리오) |
| 216 | 포트폴리오 | `등록한 포트폴리오는 전화 영어의 "포트폴리오 면접" 테마에서 면접관이 질문의 근거로 씁니다. 여러 개를 등록하고 통화 시작 시 고를 수 있습니다.` | `포트폴리오 면접 테마에서 상대가 질문의 근거로 써요. 여러 개를 추가하고 통화를 시작할 때 고를 수 있어요.` | `portfolio.intro` | 용어집(면접관→상대), 2.12 금지(등록→추가), 2.1 해요체, 2.4 따옴표 제거 |
| 217 | 포트폴리오 | `전화 영어` | 삭제 | — (portfolio.intro 에 링크 문구 없음) | 2.3 본문 간결화; 통화로 가는 행동은 홈·통화 설정의 버튼이 맡음 |
| 218 | 리포트 | `리포트 — LEO` | 유지 | `common.pageTitle(report.pageTitle)` | 유지, 메타 제목 형식 부합 |
| 219 | 리포트 | `리포트` | 유지 | `report.pageTitle` | 유지, 용어집(리포트) |
| 220 | 리포트 | `트랜스크립트` | `대화 내용` | `report.transcript` | 용어집(트랜스크립트→대화 내용) |
| 221 | 리포트 | `채팅으로` | 유지 | `report.backToChat` | 유지, 2.2 보조 버튼 명사형 부합 |
| 222 | 리포트 | `통화 기록` | `기록으로` | `report.backToHistory` | 2.2 라벨로 목적지 예측(메뉴명 "기록"), "채팅으로" 와 대구 |
| 223 | 리포트 | `전화 영어` | 유지 | `common.callLabel` | 유지, 용어집(전화 영어) |
| 224 | 리포트 | `채팅` | 유지 | `common.chatLabel` | 유지, 용어집(채팅) |
| 225 | 리포트 | ` · 포트폴리오: ${conversation.portfolio.title}` | 유지 | `report.portfolioMeta(title)` | 유지, 2.4 가운뎃점 메타 구분 부합(구분자는 컴포넌트) |
| 226 | 리포트 | `저장된 리포트가 손상되었습니다.` | `저장된 리포트를 읽을 수 없어요. 다시 만들 수 있어요.` | `report.corrupted` | 2.7 무슨 일+할 수 있는 것, 2.1 해요체 |
| 227 | 트랜스크립트 | `트랜스크립트 — LEO` | `대화 내용 — LEO` | `common.pageTitle(transcript.pageTitle)` | 용어집(트랜스크립트→대화 내용) |
| 228 | 트랜스크립트 | `트랜스크립트` | `대화 내용` | `transcript.pageTitle` | 용어집(트랜스크립트→대화 내용) |
| 229 | 트랜스크립트 | `리포트 보기` | 유지 | `transcript.viewReport` | 유지, 2.2 보조 버튼 명사형 부합 |
| 230 | 트랜스크립트 | `리포트 생성` | `리포트 만들기` | `transcript.makeReport` | 2.12 금지(생성→만들기), 2.2 ~하기 |
| 231 | 트랜스크립트 | `채팅으로` | 유지 | `transcript.toChat` | 유지, 2.2 보조 버튼 명사형 부합 |
| 232 | 트랜스크립트 | `전화 영어` | 유지 | `common.callLabel` | 유지, 용어집(전화 영어) |
| 233 | 트랜스크립트 | `채팅` | 유지 | `common.chatLabel` | 유지, 용어집(채팅) |
| 234 | 트랜스크립트 | ` · ${formatDuration(conversation.durationSec)}` | 유지 | — (formatDuration, 구분자는 컴포넌트) | 유지, 2.6 m:ss·2.4 가운뎃점 부합 |
| 235 | 트랜스크립트 | `대화 트랜스크립트` | `대화 내용` | `transcript.logLabel` | 용어집(트랜스크립트→대화 내용) |
| 236 | 트랜스크립트 | `메시지가 없습니다.` | `아직 주고받은 말이 없어요.` | `transcript.empty` | 2.8 빈 상태 상황 문장, 2.1 해요체 |
| 237 | 트랜스크립트 | `교정 힌트: {m.hint}` | 유지 | `transcript.hintLabel` | 유지, 용어집(교정 힌트); 콜론·힌트 본문은 컴포넌트 |
| 238 | 기록 | `기록 — LEO` | 유지 | `common.pageTitle(history.pageTitle)` | 유지, 메타 제목 형식 부합 |
| 239 | 기록 | `기록` | 유지 | `history.pageTitle` | 유지, 메뉴명과 일치 |
| 240 | 기록 | `전체` | 유지 | `history.all` | 유지, 필터 레이블 규칙 부합 |
| 241 | 기록 | `전화 영어` | 유지 | `history.calls` | 유지, 용어집(전화 영어) |
| 242 | 기록 | `채팅` | 유지 | `history.chats` | 유지, 용어집(채팅) |
| 243 | 기록 | `기록이 없습니다.` | `아직 대화 기록이 없어요.` | `history.empty` | 2.8 빈 상태+다음 행동(history.startCall), 2.1 해요체; 필터 적용 시 history.emptyFiltered |
| 244 | 기록 | `📞 ` | 삭제 | — (SYSTEM 아이콘으로 대체) | 2.12 금지(이모지) |
| 245 | 기록 | `💬 ` | 삭제 | — (SYSTEM 아이콘으로 대체) | 2.12 금지(이모지) |
| 246 | 기록 | ` · ${c.title}` | 유지 | — (구분자, 제목은 데이터) | 유지, 2.4 가운뎃점 메타 구분 부합 |
| 247 | 기록 | `리포트` | 유지 | `history.report` | 유지, 2.2 보조 버튼 명사형 부합 |
| 248 | 기록 | `이어서 채팅` | 유지 | `history.continueChat` | 유지, 2.2 보조 버튼 명사형 부합 |
| 249 | 기록 | `리포트 생성` | `리포트 만들기` | `history.makeReport` | 2.12 금지(생성→만들기), 2.2 ~하기 |
| 250 | 기록 | `{formatDateTime(c.startedAt)} · 메시지 {c._count.messages}개` | 유지 | `common.messagesCount(n) (+ formatDateTime)` | 유지, 2.6 숫자·단위, 2.4 가운뎃점 부합(날짜는 formatDateTime 상대 표기) |
| 251 | 기록 | ` · ${formatDuration(c.durationSec)}` | 유지 | — (formatDuration, 구분자는 컴포넌트) | 유지, 2.6 m:ss 부합 |
| 252 | 기록 | ` · 종료` | 유지 | `common.ended` | 유지, 상태 명사형 부합 |
| 253 | 기록 | ` · 진행 중` | 유지 | `common.inProgress` | 유지, 상태 명사형 부합 |
| 254 | 사용량 | `사용량 — LEO` | 유지 | `common.pageTitle(usage.pageTitle)` | 유지, 메타 제목 형식 부합 |
| 255 | 사용량 | `사용량` | 유지 | `usage.pageTitle` | 유지, 용어집(사용량) |
| 256 | 사용량 | `기간` | 유지 | `usage.periodLabel` | 유지, aria 레이블 규칙 부합 |
| 257 | 사용량 | `사용자` | 유지 | `usage.userLabel` | 유지, aria 레이블 규칙 부합 |
| 258 | 사용량 | `전체` | `모든 사용자` | `usage.allUsers` | 2.2 라벨로 결과 예측(기간 필터의 "전체 기간" 과 구분) |
| 259 | 사용량 | `합계 · {USAGE_PERIOD_LABELS[period]}` | 유지 | `usage.totalsTitle + usage.periods.*` | 유지, 2.4 가운뎃점 메타 구분 부합(조합은 컴포넌트) |
| 260 | 사용량 | ` · ${selectedUser.name}` | 유지 | — (구분자, 이름은 데이터) | 유지, 2.4 가운뎃점 메타 구분 부합 |
| 261 | 사용량 | `{formatDateTime(summary.since)} 이후` | 유지 | `usage.since(date)` | 유지, 2.6 날짜 표기는 formatDateTime |
| 262 | 사용량 | `호출 수` | 유지 | `usage.calls` | 유지, 명사 레이블 규칙 부합 |
| 263 | 사용량 | `입력 토큰` | 유지 | `usage.inputTokens` | 유지, 2.12 토큰은 사용량 화면에서 허용 |
| 264 | 사용량 | `출력 토큰` | 유지 | `usage.outputTokens` | 유지, 2.12 토큰은 사용량 화면에서 허용 |
| 265 | 사용량 | `캐시 읽기 토큰` | `캐시 읽기` | `usage.cacheRead` | 2.3 잡초 뽑기("토큰" 반복 제거, 표 머리글과 통일) |
| 266 | 사용량 | `캐시 쓰기 토큰` | `캐시 쓰기` | `usage.cacheWrite` | 2.3 잡초 뽑기("토큰" 반복 제거, 표 머리글과 통일) |
| 267 | 사용량 | `추정 비용` | 유지 | `usage.cost` | 유지, 용어집(추정 비용) |
| 268 | 사용량 | `사용자별` | 유지 | `usage.byUser` | 유지, 제목 규칙 부합 |
| 269 | 사용량 | `사용자` | 유지 | `usage.columns.user` | 유지, 표 머리글 명사형 부합 |
| 270 | 사용량 | `호출` | 유지 | `usage.columns.calls` | 유지, 표 머리글 명사형 부합 |
| 271 | 사용량 | `입력` | 유지 | `usage.columns.input` | 유지, 표 머리글 명사형 부합 |
| 272 | 사용량 | `출력` | 유지 | `usage.columns.output` | 유지, 표 머리글 명사형 부합 |
| 273 | 사용량 | `캐시 읽기` | 유지 | `usage.columns.cacheRead` | 유지, 표 머리글 명사형 부합 |
| 274 | 사용량 | `캐시 쓰기` | 유지 | `usage.columns.cacheWrite` | 유지, 표 머리글 명사형 부합 |
| 275 | 사용량 | `비용` | 유지 | `usage.columns.cost` | 유지, 표 머리글 명사형 부합 |
| 276 | 사용량 | `기능별` | 유지 | `usage.byFeature` | 유지, 제목 규칙 부합 |
| 277 | 사용량 | `기능` | 유지 | `usage.columns.feature` | 유지, 표 머리글 명사형 부합 |
| 278 | 사용량 | `호출` | 유지 | `usage.columns.calls` | 유지, 표 머리글 명사형 부합 |
| 279 | 사용량 | `입력` | 유지 | `usage.columns.input` | 유지, 표 머리글 명사형 부합 |
| 280 | 사용량 | `출력` | 유지 | `usage.columns.output` | 유지, 표 머리글 명사형 부합 |
| 281 | 사용량 | `비용` | 유지 | `usage.columns.cost` | 유지, 표 머리글 명사형 부합 |
| 282 | 사용량 | `기록이 없습니다.` | `이 기간에는 기록이 없어요.` | `usage.empty` | 2.8 빈 상태 상황 구체화, 2.1 해요체 |
| 283 | 사용량 | `최근 호출 50건` | 유지 | `usage.recent` | 유지, 2.6 숫자·단위 부합 |
| 284 | 사용량 | `시각` | 유지 | `usage.columns.time` | 유지, 표 머리글 명사형 부합 |
| 285 | 사용량 | `사용자` | 유지 | `usage.columns.user` | 유지, 표 머리글 명사형 부합 |
| 286 | 사용량 | `기능` | 유지 | `usage.columns.feature` | 유지, 표 머리글 명사형 부합 |
| 287 | 사용량 | `모델` | 유지 | `usage.columns.model` | 유지, 표 머리글 명사형 부합 |
| 288 | 사용량 | `입력` | 유지 | `usage.columns.input` | 유지, 표 머리글 명사형 부합 |
| 289 | 사용량 | `출력` | 유지 | `usage.columns.output` | 유지, 표 머리글 명사형 부합 |
| 290 | 사용량 | `캐시 읽기` | 유지 | `usage.columns.cacheRead` | 유지, 표 머리글 명사형 부합 |
| 291 | 사용량 | `캐시 쓰기` | 유지 | `usage.columns.cacheWrite` | 유지, 표 머리글 명사형 부합 |
| 292 | 사용량 | `비용` | 유지 | `usage.columns.cost` | 유지, 표 머리글 명사형 부합 |
| 293 | 사용량 | `지연 ms` | `지연(ms)` | `usage.columns.latency` | 2.6 단위 표기(머리글의 단위는 괄호로 붙임) |
| 294 | 사용량 | `기록이 없습니다.` | `이 기간에는 기록이 없어요.` | `usage.empty` | 2.8 빈 상태 상황 구체화, 2.1 해요체(282행과 한 키) |
| 295 | 홈 | `안녕하세요, {user.name}님` | `안녕하세요, ${name} 님` | `home.greeting(name)` | 국립국어원 띄어쓰기(이름 뒤 "님" 은 의존 명사, F-1); 2.12 "님" 은 홈 인사 한 곳에서만 |
| 296 | 홈 | `개발자 해외 취업용 영어 회화 연습. 오늘은 무엇을 해 볼까요?` | `오늘은 어떤 연습을 할까요?` | `home.intro` | 2.3 한 문장에 정보 하나(제품 설명은 common.tagline·meta 로) |
| 297 | 홈 | `📞 전화 영어 시작` | `통화 시작하기` | `home.startCall` | 2.12 금지(이모지), 2.2 주 버튼 ~하기, 용어집(한 번의 통화는 "통화") |
| 298 | 홈 | `💬 채팅 시작` | `채팅 시작하기` | `home.startChat` | 2.12 금지(이모지), 2.2 주 버튼 ~하기 |
| 299 | 홈 | `최근 활동` | `최근 대화` | `home.recentTitle` | 용어집(채팅·통화를 아우르는 단위는 "대화") |
| 300 | 홈 | `아직 기록이 없습니다. 전화 영어나 채팅을 시작해 보세요.` | `아직 대화가 없어요. 통화나 채팅을 시작하면 여기에 쌓여요.` | `home.recentEmpty` | 2.8 빈 상태 상황+다음 행동, 2.1 해요체, 용어집(통화) |
| 301 | 홈 | `📞` | 삭제 | — (SYSTEM 아이콘으로 대체) | 2.12 금지(이모지) |
| 302 | 홈 | `💬` | 삭제 | — (SYSTEM 아이콘으로 대체) | 2.12 금지(이모지) |
| 303 | 홈 | ` · ${c.title}` | 유지 | — (구분자, 제목은 데이터) | 유지, 2.4 가운뎃점 메타 구분 부합 |
| 304 | 홈 | `{formatDateTime(c.updatedAt)} · 메시지 {c._count.messages}개` | 유지 | `common.messagesCount(n) (+ formatDateTime)` | 유지, 2.6 숫자·단위, 2.4 가운뎃점 부합 |
| 305 | 홈 | ` · 리포트 있음` | 유지 | `common.hasReport` | 유지, 상태 명사형 부합 |
| 306 | 채팅 | `채팅 — LEO` | 유지 | `common.pageTitle(chat.pageTitle)` | 유지, 메타 제목 형식 부합 |
| 307 | 채팅 목록 | `채팅 — LEO` | 유지 | `common.pageTitle(chat.pageTitle)` | 유지, 메타 제목 형식 부합 |
| 308 | 채팅 목록 | `채팅` | 유지 | `chat.pageTitle` | 유지, 용어집(채팅) |
| 309 | 채팅 목록 | `이전 대화` | `이전 채팅` | `chat.previousTitle` | 용어집(채팅 화면에서는 "채팅", "대화" 는 기록 전체) |
| 310 | 채팅 목록 | `아직 대화가 없습니다.` | `아직 채팅이 없어요. 위에서 테마를 고르고 시작하세요.` | `chat.previousEmpty` | 2.8 빈 상태+다음 행동, 2.1 해요체, 용어집(채팅) |
| 311 | 채팅 목록 | `(제목 없음)` | `제목 없음` | `chat.untitled` | 2.4 구두점(괄호 제거; 대체 제목은 흐리게 표시) |
| 312 | 채팅 목록 | `{THEMES[...].label} · 메시지 {c._count.messages}개 · {formatDateTime(c.updatedAt)}` | 유지 | `themes.names.* + common.messagesCount(n) (+ formatDateTime)` | 유지, 2.4 가운뎃점 3개 이내·2.6 부합 |
| 313 | 채팅 목록 | ` · 리포트 있음` | 유지 | `common.hasReport` | 유지, 상태 명사형 부합 |
| 314 | 채팅 목록 | ` · 종료` | 유지 | `common.ended` | 유지, 상태 명사형 부합 |
| 315 | 설정 | `설정 — LEO` | 유지 | `common.pageTitle(settings.pageTitle)` | 유지, 메타 제목 형식 부합 |
| 316 | 설정 | `설정` | 유지 | `settings.pageTitle` | 유지, 메뉴명과 일치 |
| 317 | 통화 중 | `통화 중 — LEO` | 유지 | `common.pageTitle(callLive.pageTitle)` | 유지, 메타 제목 형식 부합 |
| 318 | 통화 설정 | `전화 영어 — LEO` | 유지 | `common.pageTitle(callSetup.pageTitle)` | 유지, 메타 제목 형식 부합 |
| 319 | 통화 설정 | `전화 영어` | 유지 | `callSetup.pageTitle` | 유지, 용어집(전화 영어) |
| 320 | 통화 설정 | `테마를 고르고 마이크를 확인한 뒤 통화를 시작합니다. 상대의 말은 음성으로 읽어 주고, 내 말은 음성 인식으로 받아 적습니다.` | `테마를 고르고 마이크를 확인한 뒤 통화를 시작해요. 상대 말은 소리로 들리고, 내 말은 글로 적혀요.` | `callSetup.intro` | 2.1 해요체, 2.3 쉬운 말(음성 인식→글로 적혀요) |
| 321 | 메타데이터(전역) | `LEO — 영어 회화 연습` | 유지 | `meta.siteTitle` | 유지, 메타 제목 형식 부합 |
| 322 | 메타데이터(전역) | `개발자 해외 취업용 영어 회화 연습` | `개발자를 위한 영어 회화 연습. 10분 통화와 채팅, 끝나면 교정 리포트.` | `meta.siteDescription` | 2.3 핵심을 앞에·구체적으로(무엇을 하는지), 2.12 우리말 어순(취업용→위한) |
| 323 | 통화 중(음성) | `마이크 권한이 거부되었습니다.` | `마이크 권한이 꺼져 있어요. 글로 이어서 대화할 수 있어요.` | `errors.voice.permissionDenied` | 2.7 비난하지 않음(거부→꺼져 있어요)+할 수 있는 것 |
| 324 | 통화 중(음성) | `음성 인식 네트워크 오류입니다.` | `음성 인식 연결에 문제가 생겼어요. 잠시 후 자동으로 다시 들어요.` | `errors.voice.network` | 2.12 금지(오류), 2.7 무슨 일+다음에 생길 일 |
| 325 | 통화 중(음성) | `마이크를 찾을 수 없습니다.` | `마이크를 찾지 못했어요. 글로 이어서 대화할 수 있어요.` | `errors.voice.noMic` | 2.7 무슨 일+할 수 있는 것, 2.1 해요체 |
| 326 | 통화 중(음성) | `음성 인식 오류: ${error}` | `음성 인식에 문제가 생겼어요. 잠시 후 다시 들어요.` | `errors.voice.generic` | 2.12 금지(오류→서술), 2.7 기술 정보 제거(브라우저 오류 코드는 console 로) |
| 327 | 통화 중(음성) | `이 브라우저는 음성 인식을 지원하지 않습니다.` | `이 브라우저는 음성 인식을 지원하지 않아요.` | `errors.voice.unsupported` | 2.1 해요체 |
| 328 | 통화 중(음성) | `음성 인식 오류: ${e instanceof Error ? e.message : String(e)}` | `음성 인식에 문제가 생겼어요. 잠시 후 다시 들어요.` | `errors.voice.generic` | 2.12 금지(오류→서술), 326행과 한 키 |
| 329 | 채팅·통화 중 | `응답 본문이 비어 있습니다.` | `서버가 빈 응답을 보냈어요.` | `errors.emptyBody` | 2.7 기술 용어(본문) 제거, 2.1 해요체 |
| 330 | API 오류(공통) | `로그인이 필요합니다.` | `로그인이 필요해요.` | `errors.unauthorized` | 2.1 해요체 |
| 331 | API 오류(공통) | `요청 본문이 JSON 이 아닙니다.` | `요청 내용을 읽을 수 없어요.` | `errors.badJson` | 2.7 기술 용어(JSON) 금지, 2.1 해요체 |
| 332 | API 오류(공통) | `${first.path.join(".") \|\| "입력"}: ${first.message}` | 유지 | `errors.validationField(field, message)` | 유지, zod 필드 메시지 구조("필드: 메시지") 부합; 메시지 본문은 각 errors.* 가 해요체 |
| 333 | API 오류(공통) | `입력이 올바르지 않습니다.` | `입력을 다시 확인하세요.` | `errors.validation` | 2.12 금지(올바르지 않은), 2.7 할 일 |
| 334 | API 오류(공통) | `입력이 올바르지 않습니다.` | `입력을 다시 확인하세요.` | `errors.validation` | 2.12 금지(올바르지 않은), 333행과 한 키 |
| 335 | API 오류(공통) | `서버 오류가 발생했습니다.` | `서버에 문제가 생겨 처리하지 못했어요. 잠시 후 다시 시도하세요.` | `errors.internal` | 2.12 금지(오류가 발생했습니다), 187행과 한 키 |
| 336 | API 오류(공통) | `요청이 실패했습니다 (${res.status}).` | `요청을 처리하지 못했어요. 잠시 후 다시 시도하세요.` | `errors.requestFailed` | 2.12 금지(실패→서술), 2.7 상태 번호 제거(status 는 ApiError.status 로 보관) |
| 337 | 전역 헤더 | `LEO` | 유지 | `common.brand` | 유지, 브랜드명(2.5 고유명사) |
| 338 | 설정 | `Hi! This is how I sound. Let's practice some English together.` | 유지 | — (영어 음성 문장, ko.ts 밖) | 유지, 2.5 대화 내용(영어)은 영어 그대로 |
| 339 | 설정 | `{v.name} ({v.lang})` | 유지 | — (브라우저 음성 데이터) | 유지, 데이터 값 그대로 표시 |
| 340 | 사용량 | `{u.name} ({u.email})` | 유지 | — (사용자 데이터) | 유지, 데이터 값 그대로 표시 |
| 341 | 통화 중 | `Hello! Let's get started.` | 유지 | — (오프닝 대체값, prompts) | 유지, 2.5 대화 내용(영어)은 영어 그대로 |
| 342 | 통화 중 | `Hey! Good to hear from you. How's your day going so far?` | 유지 | — (오프닝 라인, prompts/themes.ts) | 유지, 2.5 대화 내용(영어)은 영어 그대로 |
| 343 | 통화 중 | `Hi, thanks for joining today. I'm the hiring manager for this role. To get started, could you tell me a little about yourself?` | 유지 | — (오프닝 라인, prompts/themes.ts) | 유지, 2.5 대화 내용(영어)은 영어 그대로 |
| 344 | 통화 중 | `Hi there! I'm your neighbor from next door. How are you settling in? Is there anything around here I can help you with?` | 유지 | — (오프닝 라인, prompts/themes.ts) | 유지, 2.5 대화 내용(영어)은 영어 그대로 |
| 345 | 통화 중 | `Morning! Ready for stand-up? What did you work on yesterday, and is anything blocking you?` | 유지 | — (오프닝 라인, prompts/themes.ts) | 유지, 2.5 대화 내용(영어)은 영어 그대로 |
| 346 | 통화 중 | `Hello, thanks for making time for this call. I wanted to go over the current requirements and the timeline. Shall we start with where things stand?` | 유지 | — (오프닝 라인, prompts/themes.ts) | 유지, 2.5 대화 내용(영어)은 영어 그대로 |
| 347 | 통화 중 | `Hi, thanks for coming in. I've read through your portfolio and I'd like to dig into your projects. Which project are you most proud of, and why?` | 유지 | — (오프닝 라인, prompts/themes.ts) | 유지, 2.5 대화 내용(영어)은 영어 그대로 |

## 2. 신규 문구 (원문 행 없음, ko.ts 에만 있음)

72개. 0단계 인벤토리에 대응 원문이 없고 2단계에서 새로 들어간 문구. 근거는 `AUDIT.md`(빈 상태·다음 행동), `BRIEF.md`(다크 모드·모바일 내비게이션), `WRITING.md` 규칙(확인 대화·진행 상태·예상 시간) 중 하나다.

| ko.ts 키 | 문구 | 근거 |
|---|---|---|
| `common.tagline` | `개발자를 위한 영어 회화 연습` | 홈 intro 에서 분리한 제품 설명(2.3 한 문장에 정보 하나) |
| `common.close` | `닫기` | 2.2 일반 안내 대화의 닫기 버튼 |
| `common.cancel` | `취소` | 2.10 확인 대화 [삭제] [취소] |
| `common.loading` | `불러오는 중` | 2.9 로딩 문구 |
| `common.me` | `나` | 용어집 말풍선 화자 라벨 |
| `common.partner` | `상대` | 용어집 말풍선 화자 라벨 |
| `nav.openMenu` | `메뉴 열기` | BRIEF 모바일 내비게이션(햄버거 버튼 aria) |
| `nav.closeMenu` | `메뉴 닫기` | BRIEF 모바일 내비게이션(닫기 버튼 aria) |
| `nav.currentUser(name)` | `${name} 님으로 로그인` | 헤더에 현재 사용자 표시(국립국어원 띄어쓰기 "님") |
| `auth.loginIntro` | `영어로 말하는 연습, 끝나면 교정 리포트까지.` | 로그인 화면 소개 문장(AUDIT 첫 화면 맥락) |
| `auth.passwordHint` | `8자 이상` | 2.7 오류 전에 조건을 미리 알림(입력 보조 문구) |
| `auth.loginBusy` | `로그인하는 중` | 2.9 진행 상태 |
| `auth.signupBusy` | `가입하는 중` | 2.9 진행 상태 |
| `home.startCallDesc` | `10분 동안 상대와 영어로 통화하고 교정 리포트를 받아요.` | AUDIT 홈 주 행동 설명(버튼 아래 보조 문장) |
| `home.startChatDesc` | `틈틈이 영어로 메시지를 주고받아요.` | AUDIT 홈 주 행동 설명 |
| `home.seeAll` | `기록 전체 보기` | 홈 최근 대화 → 기록 화면 링크(2.2 보조 버튼 명사형) |
| `home.continueChat` | `이어서 채팅` | 홈 최근 대화 행의 행동(기록 화면과 통일) |
| `home.viewReport` | `리포트 보기` | 홈 최근 대화 행의 행동 |
| `home.viewTranscript` | `대화 내용 보기` | 홈 최근 대화 행의 행동(용어집 대화 내용) |
| `themes.legend` | `테마 고르기` | 테마 선택 그룹 legend(라디오 카드 전환) |
| `chat.hintsToggleDesc` | `켜면 내 메시지마다 상대 답변 아래에 한 줄 교정이 붙어요.` | 38행 스위치 설명 분리(2.3) |
| `chat.starting` | `채팅을 시작하는 중` | 2.9 진행 상태 |
| `chat.emptyExample` | `Hi! Can I tell you about my week?` | 48행에서 분리한 영어 예문(2.5 별도 줄) |
| `chat.waiting` | `답변을 기다리는 중` | 50행 "…" 대체(2.4, 2.9) |
| `chat.remakeConfirmTitle` | `리포트를 다시 만들까요?` | 2.10 확인 대화(덮어쓰기) |
| `chat.remakeConfirmBody` | `지금 리포트는 새 리포트로 바뀌어요. 보통 1분 안에 끝나요.` | 2.10 확인 대화 본문(결과+예상 시간) |
| `chat.remakeConfirmAction` | `다시 만들기` | 2.10 행동 이름 버튼 |
| `chat.endedAction` | `새 채팅 시작하기` | 52행 분리, 2.8 다음 행동 버튼 |
| `callSetup.portfolioAdd` | `포트폴리오 추가하기` | 128행 링크를 행동 버튼으로(2.8) |
| `callSetup.nextHint` | `다음 화면에서 통화를 시작해요.` | 2.2 "다음" 버튼 뒤에 무엇이 오는지 본문이 예고 |
| `callSetup.creating` | `통화를 준비하는 중` | 2.9 진행 상태 |
| `callLive.callOf(theme, minutes)` | `${theme} · ${minutes} 통화` | 통화 헤더 메타 줄 조합(2.4 가운뎃점) |
| `callLive.idleTitle` | `통화를 시작할 준비가 됐어요` | AUDIT 통화 대기 화면 제목(97행 본문과 분리) |
| `callLive.idleTips` | `상대가 말하는 중에 말을 시작하면 상대가 멈추고 들어요. / 끝나기 1분 전에 10분 연장 버튼이 나타나요.` | AUDIT 통화 전 안내(끼어들기·연장은 알 수 없던 기능) |
| `callLive.status.endingHint` | `통화를 마쳤어요. 보통 1분 안에 끝나요.` | 106행 분리, 2.9 예상 시간 |
| `callLive.status.oneMinuteLeft` | `1분 남았어요` | 2.6 타이머 1분 이하 경고 |
| `callLive.interimLabel` | `인식 중` | 109행 "…" 대체(2.4) |
| `callLive.hangupLabel` | `통화 끊기` | 끊기 버튼 aria(목적어 보강) |
| `report.backToHistory` | `기록으로` | 222행 개정 문구(새 키) |
| `report.toc` | `목차` | AUDIT 긴 리포트 섹션 이동 |
| `report.scoreBand(score)` | `좋아요 / 괜찮아요 / 연습이 필요해요` | 2.6 점수 해석 라벨(SYSTEM 정의 8~10/5~7/1~4) |
| `report.original` | `내가 한 말` | 25·28행 "→" 대체 레이블(2.11) |
| `report.corrected` | `이렇게 말해요` | 25·28행 "→" 대체 레이블(2.11 판정어 대신) |
| `report.why` | `이유` | 2.11 교정 구조(원문→고친 문장→이유) |
| `report.meaning` | `뜻` | 29행 분리 레이블 |
| `report.example` | `예문` | 29행 분리 레이블 |
| `report.nextAction` | `같은 테마로 다시 연습하기` | AUDIT 리포트 끝 다음 행동(2.8, 2.11 다음 행동으로 끝남) |
| `report.nextActionChat` | `채팅으로 연습하기` | AUDIT 리포트 끝 다음 행동(채팅 대화용) |
| `report.missingHint` | `대화 내용을 바탕으로 교정 리포트를 만들 수 있어요. 보통 1분 안에 끝나요.` | 2.8 빈 상태+다음 행동 설명, 2.9 예상 시간 |
| `report.makingHint` | `보통 1분 안에 끝나요.` | 9행 분리, 2.9 예상 시간 |
| `history.filterLabel` | `종류` | 기록 필터 그룹 aria 레이블 |
| `history.emptyFiltered` | `이 종류의 기록이 없어요.` | 2.8 필터 적용 시 빈 상태를 전체 빈 상태와 구분 |
| `history.startCall` | `통화 시작하기` | 2.8 기록 빈 상태의 다음 행동 버튼 |
| `history.noMessages` | `주고받은 말 없음` | 메시지 0개 대화의 메타 줄("메시지 0개" 대신) |
| `portfolio.deleteTitle` | `포트폴리오를 삭제할까요?` | 58행 개정 문구(Dialog 제목) |
| `portfolio.deleteBody(title)` | `${title} 을(를) 삭제하면 되돌릴 수 없어요.` | 2.10 확인 대화 본문(되돌릴 수 없음) |
| `portfolio.deleteAction` | `삭제` | 2.10 행동 이름 버튼 |
| `portfolio.deleted(title)` | `${title} 을(를) 삭제했어요.` | 2.12 결과를 문장으로(삭제 완료 상태) |
| `usage.intro` | `Claude 를 부른 기록이에요. 비용은 단가표로 계산한 추정값이에요.` | AUDIT 사용량 화면 설명(추정 비용의 뜻) |
| `settings.appearanceTitle` | `화면` | BRIEF 다크 모드 전환 섹션 제목 |
| `settings.theme` | `테마 모드` | BRIEF 다크 모드 전환 레이블 |
| `settings.themeOptions` | `시스템 설정 따르기 / 라이트 / 다크` | BRIEF 다크 모드 전환 옵션 |
| `settings.themeHint` | `시스템 설정을 따르면 기기의 다크 모드에 맞춰 바뀌어요.` | BRIEF 다크 모드 전환 설명 |
| `settings.chatTitle` | `채팅` | 설정 섹션 제목(항목 묶음) |
| `settings.hintsDefaultHint` | `채팅마다 끄고 켤 수 있어요.` | 79행 설명 분리(2.3) |
| `settings.callTitle` | `전화 영어` | 설정 섹션 제목(항목 묶음) |
| `settings.saving` | `저장하는 중` | 2.9 진행 상태 |
| `banner.noKeyBody` | `채팅과 통화를 쓰려면 운영자가 Claude 연결을 설정해야 해요.` | 137행 분리(사용자용 본문) |
| `banner.noKeyOperator` | `.env 의 LEO_ANTHROPIC_API_KEY 를 채우고 서버를 다시 시작하세요.` | 137행 분리(운영자용, 2.7 변수명은 운영자 문구에만) |
| `common.next` | `다음` | 공통 보조 버튼 키(callSetup.next 와 같은 문구, 다른 화면의 단계 버튼용) |
| `common.save` | `저장하기` | 공통 주 버튼 키(settings.save 와 같은 문구, 2.2 ~하기) |
| `errors.network` | `서버에 연결하지 못했어요. 네트워크를 확인한 뒤 다시 시도하세요.` | 클라이언트 fetch 공통 네트워크 오류(auth.networkError·errors.claude.network 와 같은 문구, 2.7 원인별 문장) |

## 3. 집계

| 구분 | 수 |
|---|---|
| 유지 | 183 |
| 개정 | 151 |
| 삭제 | 13 |
| 합 | 347 |
| 신규 문구 | 72 |

검산: 1~347 행 번호가 빠짐·중복 없이 한 번씩 있다(스크립트로 확인). 유지 183 + 개정 151 + 삭제 13 = 347. 신규 72.

판단이 갈릴 수 있었던 행
- 13·15행: 두 aria 문구를 `report.scoreAria` 한 키로 합쳤다. 13행은 만점 기준이 추가되어 개정으로 셌다.
- 25·28행 `→`, 50·109행 `…`, 244·245·301·302행 이모지, 76행 미리보기 `…`, 156~158행 스키마 삽입값, 217행 본문 링크: 문구가 없어지므로 삭제로 셌고 대체 키나 대체 수단을 키 열에 적었다.
- 311행 `(제목 없음)`: 괄호만 사라지고 `chat.untitled` 로 남아 개정으로 셌다.
- 326·328·336행: 처음 안에는 브라우저 오류 코드·HTTP 상태 번호를 괄호에 남겼으나 2.7 "기술 정보·상태 번호 금지" 에 맞춰 뺐다. 코드는 console 로그와 `ApiError.status` 에만 남는다(DECISIONS 2단계).
- 41·246·260·303행 등 구분자+데이터 행: 문구가 아니라 조합이라 키 없이 유지로 셌다.
- 49·237행(`교정 힌트: {m.hint}`), 252·253·305·313·314행(` · 종료` 등 접미 문자열): 핵심 단어는 그대로라 유지로 셌고, 앞의 ` · ` 와 뒤의 `: {hint}` 는 ko.ts 값이 아니라 컴포넌트가 조합한다.
