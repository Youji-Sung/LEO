"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { nav } from "@/content/ko";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }
  return (
    <Button variant="ghost" onClick={logout} loading={busy}>
      {nav.logout}
    </Button>
  );
}
