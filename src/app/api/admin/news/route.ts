import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth/require-admin";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { adminListNewsQuerySchema } from "@/lib/news/schemas";
import { newsListSelect } from "@/lib/news/queries";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const query = adminListNewsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const where: Prisma.NewsWhereInput = {
      locale: query.locale,
      ...(query.status ? { status: query.status } : {}),
      ...(query.featured === undefined ? {} : { isFeatured: query.featured }),
      ...(query.deleted === undefined ? {} : { deletedAt: query.deleted ? { not: null } : null }),
      ...(query.keyword
        ? {
            OR: [
              { title: { contains: query.keyword, mode: "insensitive" } },
              { summary: { contains: query.keyword, mode: "insensitive" } },
              { contentText: { contains: query.keyword, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.news.findMany({
        where,
        select: newsListSelect,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: [{ [query.sort]: query.order }],
      }),
      prisma.news.count({ where }),
    ]);
    const totalPages = Math.ceil(total / query.pageSize);

    return ok({
      items,
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
