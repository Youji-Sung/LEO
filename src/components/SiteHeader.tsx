import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { common, nav } from "@/content/ko";

const NAV = [
  { href: "/", label: nav.home },
  { href: "/chat", label: nav.chat },
  { href: "/call", label: nav.call },
  { href: "/history", label: nav.history },
  { href: "/portfolios", label: nav.portfolios },
  { href: "/usage", label: nav.usage },
  { href: "/settings", label: nav.settings },
];

export function SiteHeader({ userName }: { userName: string }) {
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand">
          {common.brand}
        </Link>
        <nav aria-label={nav.menuLabel}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <span className="muted user-name">
          {userName}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
