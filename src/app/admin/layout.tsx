import type { Metadata } from "next";
import AdminNavigation from "@/components/admin/AdminNavigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <AdminNavigation />

      {/* Main Content with Sidebar (Desktop Only) */}
      <div className="flex flex-1">
        {/* Sidebar - Desktop only */}
        <div className="hidden md:flex md:w-64">
          <AdminSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
