import { Info, TriangleAlert } from "lucide-react";
import { banner } from "@/content/ko";
import { hasApiKey, isMockMode } from "@/services/claude";

// 서버 컴포넌트. 운영 상태 안내. 모의 모드는 조용히(status), 키 없음은 운영자가 고쳐야 하므로 alert.
export function ConfigBanner({ compact = false }: { compact?: boolean }) {
  if (isMockMode()) {
    return (
      <div className="banner banner-info" role="status">
        <Info size={16} aria-hidden="true" />
        <span>{banner.mock}</span>
      </div>
    );
  }
  if (!hasApiKey()) {
    return (
      <div className="banner banner-warn" role="alert">
        <TriangleAlert size={16} aria-hidden="true" />
        <span>
          <strong>{banner.noKeyTitle}</strong> {banner.noKeyBody}
          {compact ? null : (
            <>
              {" "}
              <code>{banner.noKeyOperator}</code>
            </>
          )}
        </span>
      </div>
    );
  }
  return null;
}
