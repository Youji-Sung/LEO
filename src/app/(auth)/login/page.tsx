import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { auth, common } from "@/content/ko";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSignupAllowed } from "@/lib/auth/signup-gate";

export const metadata = { title: common.pageTitle(auth.loginTitle) };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="container container-narrow stack-lg">
      <div className="stack-sm">
        <p className="t-display">{common.brand}</p>
        <p className="muted">{common.tagline}</p>
      </div>
      <div className="stack-sm">
        <h1>{auth.loginTitle}</h1>
        <p className="muted">{auth.loginIntro}</p>
      </div>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
      {isSignupAllowed() ? (
        <p className="muted">
          {auth.noAccount} <Link href="/signup">{auth.toSignup}</Link>
        </p>
      ) : null}
    </main>
  );
}
