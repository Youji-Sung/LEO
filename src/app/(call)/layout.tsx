import { requireUser } from "@/lib/auth/current-user";

// 통화 중 화면 전용 레이아웃: 전역 헤더·메뉴·운영 배너 없이 통화에 집중한다(PRINCIPLES P1, AUDIT C9).
// Claude 연결이 없으면 첫 발화에서 오류 메시지로 알린다.
export default async function CallLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
