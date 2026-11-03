import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/chat", label: "채팅" },
  { href: "/call", label: "전화 영어" },
  { href: "/history", label: "기록" },
  { href: "/portfolios", label: "포트폴리오" },
  { href: "/usage", label: "사용량" },
  { href: "/settings", label: "설정" },
];

export function SiteHeader({ userName }: { userName: string }) {
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand">
          LEO
        </Link>
        <nav aria-label="주 메뉴">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <span className="muted" style={{ marginLeft: "auto", fontSize: 14 }}>
          {userName}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
