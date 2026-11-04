import { requireUser } from "@/lib/auth/current-user";
import { ConfigBanner } from "@/components/ConfigBanner";

// 통화 중 화면 전용 레이아웃: 전역 헤더·메뉴 없이 통화에 집중한다(PRINCIPLES P1, AUDIT C9).
export default async function CallLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <>
      <header>
        <ConfigBanner compact />
      </header>
      {children}
    </>
  );
}
