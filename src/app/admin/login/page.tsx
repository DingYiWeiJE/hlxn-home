import type { Metadata } from "next";
import { getAdminSession } from "@/lib/admin-auth/session";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/news");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <AdminLoginForm />
    </main>
  );
}
