import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
