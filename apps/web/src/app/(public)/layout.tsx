import { SiteHeader } from "@/components/common/site-header";
import { SiteFooter } from "@/components/common/site-footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
