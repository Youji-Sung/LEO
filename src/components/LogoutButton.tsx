"use client";

import { useRouter } from "next/navigation";
import { nav } from "@/content/ko";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button type="button" className="btn" onClick={logout} style={{ fontSize: 14 }}>
      {nav.logout}
    </button>
  );
}
