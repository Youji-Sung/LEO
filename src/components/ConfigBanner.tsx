import { banner } from "@/content/ko";
import { hasApiKey, isMockMode } from "@/services/claude";

// 서버 컴포넌트. API 키가 없고 모의 모드도 아니면 모든 화면 위에 안내를 띄운다.
export function ConfigBanner() {
  if (isMockMode()) {
    return (
      <div className="banner banner-info" role="status">
        {banner.mock}
      </div>
    );
  }
  if (!hasApiKey()) {
    return (
      <div className="banner banner-warn" role="alert">
        <strong>{banner.noKeyTitle}</strong> {banner.noKeyBody} <code>{banner.noKeyOperator}</code>
      </div>
    );
  }
  return null;
}
