import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth/session";
import { prisma } from "@/lib/prisma";
import NewsForm from "@/components/admin/NewsForm";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditNewsPage({ params }: Props) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) redirect("/admin/news");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">编辑新闻</h1>
      <NewsForm
        mode="edit"
        id={id}
        initialValue={{
          title: news.title,
          slug: news.slug,
          summary: news.summary ?? "",
          coverImage: news.coverImage ?? "",
          coverImageAlt: news.coverImageAlt ?? "",
          authorName: news.authorName ?? "",
          status: news.status,
          isFeatured: news.isFeatured,
          publishedAt: news.publishedAt ? news.publishedAt.toISOString().slice(0, 16) : "",
          content: news.content as never,
        }}
      />
    </main>
  );
}
