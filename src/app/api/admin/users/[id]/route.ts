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

const updateSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"]).optional(),
  isActive: z.boolean().optional(),
});

async function requireSuperAdmin() {
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

  return user;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new ApiError("NOT_FOUND", "用户不存在", 404);
    }

    return ok(user);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError("NOT_FOUND", "用户不存在", 404);
    }

    const body = updateSchema.parse(await request.json());

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
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
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError("NOT_FOUND", "用户不存在", 404);
    }

    // Prevent deleting the last super admin
    if (user.role === UserRole.SUPER_ADMIN && !user.deletedAt) {
      const activeSuperAdmins = await prisma.user.count({
        where: {
          role: UserRole.SUPER_ADMIN,
          isActive: true,
          deletedAt: null,
        },
      });

      if (activeSuperAdmins <= 1) {
        throw new ApiError("BAD_REQUEST", "不能删除最后一个超级管理员", 400);
      }
    }

    const deleted = await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
      },
    });

    return ok(deleted);
  } catch (error) {
    return fail(error);
  }
}
