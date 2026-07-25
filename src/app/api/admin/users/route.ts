import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getUserAuthConfig } from "@/lib/user-auth/config";
import { getUserSession } from "@/lib/user-auth/session";
import { checkPermission } from "@/lib/user-auth/require-auth";
import { ApiError } from "@/lib/api/errors";
import { UserRole } from "@prisma/client";

export const runtime = "nodejs";

const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["createdAt", "username", "email"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"]).optional(),
  includeDeleted: z.coerce.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { sessionSecret } = getUserAuthConfig();
    const session = await getUserSession(sessionSecret);

    if (!session) {
      throw new ApiError("UNAUTHORIZED", "请先登录", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new ApiError("UNAUTHORIZED", "用户不存在或已禁用", 401);
    }

    if (!checkPermission(user.role, UserRole.SUPER_ADMIN)) {
      throw new ApiError("FORBIDDEN", "权限不足，仅超级管理员可访问", 403);
    }

    const query = listSchema.parse(Object.fromEntries(request.nextUrl.searchParams));

    const where: Prisma.UserWhereInput = {
      ...(query.search ? {
        OR: [
          { username: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      } : {}),
      ...(query.role ? { role: query.role as UserRole } : {}),
      ...(query.includeDeleted ? {} : { deletedAt: null }),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sort]: query.order },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.pageSize);

    return ok({
      users,
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
