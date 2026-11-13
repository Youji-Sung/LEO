"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/Button";
import { banner, common, nav } from "@/content/ko";
import { Badge } from "@/components/ui/Badge";

const NAV = [
  { href: "/", label: nav.home },
  { href: "/chat", label: nav.chat },
  { href: "/call", label: nav.call },
  { href: "/history", label: nav.history },
  { href: "/learn", label: "표현 익히기" },
  { href: "/portfolios", label: nav.portfolios },
  { href: "/usage", label: nav.usage },
  { href: "/settings", label: nav.settings },
];

function isCurrent(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// 데스크톱은 가로 메뉴, 768px 미만은 메뉴 버튼으로 여닫는 세로 메뉴(SYSTEM.md 5절). 경로가 바뀌면 닫힌다.
export function SiteHeader({
  userName,
  mockMode = false,
}: {
  userName: string;
  mockMode?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      headerRef.current?.querySelector<HTMLButtonElement>(".menu-toggle")?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);
  return (
    <header ref={headerRef} className="site-header" data-open={open ? "true" : "false"}>
      <div className="container">
        <Link href="/" className="brand">
          {common.brand}
        </Link>
        {mockMode ? (
          <span className="site-mode" title={banner.mock}>
            <Badge tone="caution">{banner.mockChip}</Badge>
          </span>
        ) : null}
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
          <span className="user-name" aria-label={nav.currentUserLabel}>
            {nav.currentUser(userName)}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
