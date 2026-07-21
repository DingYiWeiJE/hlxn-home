import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api/response";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdmin } from "@/lib/admin-auth/require-admin";
import { listNewsQuerySchema, newsInputSchema } from "@/lib/news/schemas";
import { ensureUniqueSlug, slugifyTitle } from "@/lib/news/slug";
import { extractTextFromTiptapJson } from "@/lib/news/tiptap";
import { normalizeNewsListItem, newsListSelect } from "@/lib/news/queries";
import { revalidateNewsCache } from "@/lib/news/cache";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const query = listNewsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const now = new Date();
    const keywordWhere: Prisma.NewsWhereInput | undefined = query.keyword
      ? {
          OR: [
            { title: { contains: query.keyword, mode: "insensitive" } },
            { summary: { contains: query.keyword, mode: "insensitive" } },
            { contentText: { contains: query.keyword, mode: "insensitive" } },
          ],
        }
      : undefined;
    const where: Prisma.NewsWhereInput = {
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { lte: now },
      ...(query.featured === undefined ? {} : { isFeatured: query.featured }),
      ...(keywordWhere ?? {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.news.findMany({
        where,
        select: newsListSelect,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy:
          query.sort === "publishedAt" && query.order === "desc"
            ? [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }]
            : [{ [query.sort]: query.order }],
      }),
      prisma.news.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.pageSize);
    return ok({
      items: items.map(normalizeNewsListItem),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    assertSameOriginRequest(request);
    const input = newsInputSchema.parse(await request.json());
    const slug = await ensureUniqueSlug(input.slug ?? slugifyTitle(input.title));
    const publishedAt = input.status === "PUBLISHED" ? input.publishedAt ?? new Date() : input.publishedAt;
    const created = await prisma.news.create({
      data: {
        title: input.title,
        slug,
        summary: input.summary || null,
        coverImage: input.coverImage || null,
        coverImageAlt: input.coverImageAlt || null,
        content: input.content as Prisma.InputJsonValue,
        contentText: extractTextFromTiptapJson(input.content),
        authorName: input.authorName || null,
        status: input.status,
        isFeatured: input.isFeatured,
        publishedAt,
      },
    });

    revalidateNewsCache({ newSlug: created.slug });
    return ok(created, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
