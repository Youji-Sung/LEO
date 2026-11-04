import { TriangleAlert } from "lucide-react";
import { banner } from "@/content/ko";
import { hasApiKey, isMockMode } from "@/services/claude";

// 서버 컴포넌트. Claude 연결이 없을 때만 상단 배너(alert). 모의 모드는 헤더의 작은 칩으로만 표시한다(P5).
export function ConfigBanner() {
  if (isMockMode() || hasApiKey()) return null;
  return (
    <div className="banner banner-warn" role="alert">
      <TriangleAlert size={16} aria-hidden="true" />
      <span>
        <strong>{banner.noKeyTitle}</strong> {banner.noKeyBody} <code>{banner.noKeyOperator}</code>
      </span>
    </div>
  );
}
