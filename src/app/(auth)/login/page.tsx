import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { auth, common } from "@/content/ko";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata = { title: common.pageTitle(auth.loginTitle) };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="container" style={{ maxWidth: 420 }}>
      <h1>{auth.loginTitle}</h1>
      <p className="muted">{auth.loginIntro}</p>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
      <p className="muted">
        {auth.noAccount} <Link href="/signup">{auth.toSignup}</Link>
      </p>
    </main>
  );
}
