import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
  const staticPaths = ["/", "/zh", "/en", "/news", "/zh/about", "/zh/products", "/zh/solutions", "/zh/cases", "/zh/contact", "/en/about", "/en/products", "/en/solutions", "/en/cases", "/en/contact"];
  const news = await prisma.news.findMany({
    where: { status: "PUBLISHED", deletedAt: null, publishedAt: { lte: new Date() } },
    select: { slug: true, updatedAt: true },
  });

  return [
    ...staticPaths.map((path) => ({
      url: `${origin}${path}`,
      lastModified: new Date(),
    })),
    ...news.map((item) => ({
      url: `${origin}/news/${item.slug}`,
      lastModified: item.updatedAt,
    })),
  ];
}
