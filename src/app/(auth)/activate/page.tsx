import { ActivateForm } from "@/components/ActivateForm";
export const metadata = { title: "계정 활성화 · LEO", robots: { index: false, follow: false } };
export default function ActivatePage() {
  return <main className="container container-narrow stack-lg"><h1>초대받은 계정 시작하기</h1><p>본인만 사용할 비밀번호를 설정해 주세요. 초대 링크는 24시간 동안 한 번 사용할 수 있습니다.</p><ActivateForm /></main>;
}
