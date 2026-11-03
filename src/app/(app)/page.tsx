import { requireUser } from "@/lib/auth/current-user";

export default async function HomePage() {
  const user = await requireUser();
  return (
    <>
      <h1>LEO</h1>
      <p className="muted">{user.name}님, 개발자 해외 취업용 영어 회화 연습에 오신 것을 환영합니다.</p>
    </>
  );
}
