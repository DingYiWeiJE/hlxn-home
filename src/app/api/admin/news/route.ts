import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { adminListNewsQuerySchema } from "@/lib/news/schemas";
import { newsListSelect } from "@/lib/news/queries";
import { requireAdmin } from "@/lib/admin-auth/require-admin";
import { getUserAuthConfig } from "@/lib/user-auth/config";
import { getUserSession } from "@/lib/user-auth/session";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

async function checkAuth() {
  try {
    // Try new user auth first
    const { sessionSecret } = getUserAuthConfig();
    const session = await getUserSession(sessionSecret);
    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.sub },
      });
      if (user && user.isActive && !user.deletedAt) {
        return user;
      }
    }
  } catch {
    // Fall back to admin auth
  }

  // Fallback to legacy admin auth
  const adminSession = await requireAdmin();
  if (adminSession) {
    return true;
  }
}

export async function GET(request: NextRequest) {
  try {
    await checkAuth();
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
