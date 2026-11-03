import { requireUser } from "@/lib/auth/current-user";
import { SiteHeader } from "@/components/SiteHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <SiteHeader userName={user.name} />
      <main className="container">{children}</main>
    </>
  );
}
