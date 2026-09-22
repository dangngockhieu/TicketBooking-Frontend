import { AccountNav } from "@/components/common/account-nav";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <AccountNav />
      {children}
    </div>
  );
}
