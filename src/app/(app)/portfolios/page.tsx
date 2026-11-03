import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { PortfolioManager } from "@/components/portfolio/PortfolioManager";
import { listPortfolios } from "@/services/portfolio";

export const metadata = { title: "포트폴리오 — LEO" };

export default async function PortfoliosPage() {
  const user = await requireUser();
  const list = await listPortfolios(user.id);
  return (
    <>
      <h1>포트폴리오</h1>
      <p className="muted">
        등록한 포트폴리오는 <Link href="/call">전화 영어</Link>의 &quot;포트폴리오 면접&quot; 테마에서 면접관이 질문의 근거로 씁니다. 여러 개를 등록하고 통화 시작 시 고를 수 있습니다.
      </p>
      <PortfolioManager
        initial={list.map((p) => ({ id: p.id, title: p.title, createdAt: p.createdAt.toISOString(), chars: p.content.length, preview: p.content.slice(0, 200) }))}
      />
    </>
  );
}
