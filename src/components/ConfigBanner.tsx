import { hasApiKey, isMockMode } from "@/services/claude";

// 서버 컴포넌트. API 키가 없고 모의 모드도 아니면 모든 화면 위에 안내를 띄운다.
export function ConfigBanner() {
  if (isMockMode()) {
    return (
      <div className="banner banner-info" role="status">
        모의 모드(CLAUDE_MOCK=1)입니다. Claude API 를 호출하지 않고 가짜 응답을 보여 줍니다.
      </div>
    );
  }
  if (!hasApiKey()) {
    return (
      <div className="banner banner-warn" role="alert">
        Claude API 키가 설정되지 않았습니다. 운영자가 <code>.env</code> 의 <code>LEO_ANTHROPIC_API_KEY</code> 를 채우고 서버를 다시 시작해야 채팅과 통화가 동작합니다.
      </div>
    );
  }
  return null;
}
