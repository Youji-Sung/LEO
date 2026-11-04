import { requireUser } from "@/lib/auth/current-user";
import { SiteHeader } from "@/components/SiteHeader";
import { ConfigBanner } from "@/components/ConfigBanner";
import { ToastProvider } from "@/components/ui/Toast";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <ToastProvider>
      <SiteHeader userName={user.name} />
      <ConfigBanner />
      <main className="container page-enter">{children}</main>
    </ToastProvider>
  );
}
