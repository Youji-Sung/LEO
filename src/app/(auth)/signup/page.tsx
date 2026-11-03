import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "회원가입 — LEO" };

export default function SignupPage() {
  return (
    <main className="container" style={{ maxWidth: 420 }}>
      <h1>회원가입</h1>
      <p className="muted">초대받은 사용자만 가입합니다.</p>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
      <p className="muted">
        이미 계정이 있나요? <Link href="/login">로그인</Link>
      </p>
    </main>
  );
}
