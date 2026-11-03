import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata = { title: "로그인 — LEO" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="container" style={{ maxWidth: 420 }}>
      <h1>로그인</h1>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
      <p className="muted">
        계정이 없나요? <Link href="/signup">회원가입</Link>
      </p>
    </main>
  );
}
