import type { Metadata } from "next";

import AdminNavigation from "@/components/admin/AdminNavigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminNavigation />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <AdminSidebar />

        <main className="min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}