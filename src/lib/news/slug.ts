import { prisma } from "@/lib/prisma";

export function slugifyTitle(title: string) {
  const base = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return base || `news-${randomSlugSuffix()}`;
}

export function randomSlugSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export async function ensureUniqueSlug(slug: string, ignoreId?: string) {
  let candidate = slug;
  let index = 1;

  while (true) {
    const existing = await prisma.news.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === ignoreId) {
      return candidate;
    }

    index += 1;
    candidate = `${slug}-${index}`;
  }
}
