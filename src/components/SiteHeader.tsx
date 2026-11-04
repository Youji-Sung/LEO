"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/Button";
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

function isCurrent(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// 데스크톱은 가로 메뉴, 768px 미만은 메뉴 버튼으로 여닫는 세로 메뉴(SYSTEM.md 5절). 경로가 바뀌면 닫힌다.
export function SiteHeader({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header" data-open={open ? "true" : "false"}>
      <div className="container">
        <Link href="/" className="brand">
          {common.brand}
        </Link>
        <Button
          variant="ghost"
          iconOnly
          className="menu-toggle"
          aria-label={open ? nav.closeMenu : nav.openMenu}
          aria-expanded={open}
          aria-controls="site-nav"
          icon={open ? <X size={22} /> : <Menu size={22} />}
          onClick={() => setOpen((v) => !v)}
        />
        <nav id="site-nav" className="site-nav" aria-label={nav.menuLabel}>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isCurrent(n.href, pathname) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="site-user">
          <span className="user-name">{nav.currentUser(userName)}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
