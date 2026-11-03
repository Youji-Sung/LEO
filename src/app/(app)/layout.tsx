import { requireUser } from "@/lib/auth/current-user";
import { SiteHeader } from "@/components/SiteHeader";
import { ConfigBanner } from "@/components/ConfigBanner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <SiteHeader userName={user.name} />
      <ConfigBanner />
      <main className="container">{children}</main>
    </>
  );
}
