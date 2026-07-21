import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth/session";
import { prisma } from "@/lib/prisma";
import AdminNewsActions from "@/components/admin/AdminNewsActions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const items = await prisma.news.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      isFeatured: true,
      publishedAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">新闻管理</h1>
        <Link href="/admin/news/create" className="rounded-md bg-blue-600 px-4 py-2 text-white">
          创建新闻
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">标题</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">推荐</th>
              <th className="px-4 py-3">发布时间</th>
              <th className="px-4 py-3">更新时间</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{item.title}</td>
                <td className="px-4 py-3">{item.deletedAt ? "已删除" : item.status}</td>
                <td className="px-4 py-3">{item.isFeatured ? "是" : "否"}</td>
                <td className="px-4 py-3">{item.publishedAt?.toLocaleString() ?? "-"}</td>
                <td className="px-4 py-3">{item.updatedAt.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <AdminNewsActions id={item.id} deleted={Boolean(item.deletedAt)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
