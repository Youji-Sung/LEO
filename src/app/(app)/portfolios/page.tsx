import { requireUser } from "@/lib/auth/current-user";
import { PortfolioManager } from "@/components/portfolio/PortfolioManager";
import { common, portfolio } from "@/content/ko";
import { listPortfolios } from "@/services/portfolio";

export const metadata = { title: common.pageTitle(portfolio.pageTitle) };

export default async function PortfoliosPage() {
  const user = await requireUser();
  const list = await listPortfolios(user.id);
  return (
    <>
      <h1>{portfolio.pageTitle}</h1>
      <p className="muted">{portfolio.intro}</p>
      <PortfolioManager
        initial={list.map((p) => ({ id: p.id, title: p.title, createdAt: p.createdAt.toISOString(), chars: p.content.length, preview: p.content.slice(0, 200) }))}
      />
    </>
  );
}
