import { TriangleAlert } from "lucide-react";
import { banner } from "@/content/ko";
import { hasApiKey, isMockMode } from "@/services/claude";

// 운영자 안내 문장에서 파일·변수 이름만 code 로 감싼다(문장 전체를 고정폭으로 두면 한글 자간이 벌어진다).
const CODE_WORDS = [".env", "LEO_ANTHROPIC_API_KEY"];
function OperatorHint() {
  const parts = banner.noKeyOperator.split(new RegExp(`(${CODE_WORDS.join("|")})`));
  return (
    <>
      {parts.map((part, i) =>
        CODE_WORDS.includes(part) ? <code key={i}>{part}</code> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

// 서버 컴포넌트. Claude 연결이 없을 때만 상단 배너(alert). 모의 모드는 헤더의 작은 칩으로만 표시한다(P5).
export function ConfigBanner() {
  if (isMockMode() || hasApiKey()) return null;
  return (
    <div className="banner banner-warn" role="alert">
      <TriangleAlert size={16} aria-hidden="true" />
      <span>
        <strong>{banner.noKeyTitle}</strong> {banner.noKeyBody} <OperatorHint />
      </span>
    </div>
  );
}
