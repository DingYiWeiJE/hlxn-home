import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth/session";
import NewsForm from "@/components/admin/NewsForm";
import { emptyTiptapDocument } from "@/lib/news/tiptap";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminCreateNewsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">创建新闻</h1>
      <NewsForm mode="create" initialValue={{ content: emptyTiptapDocument }} />
    </main>
  );
}
