import type { Metadata } from "next";
import AdminNavigation from "@/components/admin/AdminNavigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminNavigation />
      {children}
    </div>
  );
}
