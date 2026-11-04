import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { auth, common } from "@/content/ko";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata = { title: common.pageTitle(auth.signupTitle) };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="container container-narrow stack-lg">
      <div className="stack-sm">
        <p className="t-display">{common.brand}</p>
        <p className="muted">{common.tagline}</p>
      </div>
      <div className="stack-sm">
        <h1>{auth.signupTitle}</h1>
        <p className="muted">{auth.signupIntro}</p>
      </div>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
      <p className="muted">
        {auth.haveAccount} <Link href="/login">{auth.toLogin}</Link>
      </p>
    </main>
  );
}
