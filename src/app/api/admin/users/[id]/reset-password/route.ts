import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getUserAuthConfig } from "@/lib/user-auth/config";
import { getUserSession } from "@/lib/user-auth/session";
import { checkPermission } from "@/lib/user-auth/require-auth";
import { ApiError } from "@/lib/api/errors";
import { UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/user-auth/password";

export const runtime = "nodejs";

const resetSchema = z.object({
  newPassword: z.string().min(8),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sessionSecret } = getUserAuthConfig();
    const session = await getUserSession(sessionSecret);

    if (!session) {
      throw new ApiError("UNAUTHORIZED", "请先登录", 401);
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.sub },
    });

    if (!currentUser || !currentUser.isActive || currentUser.deletedAt) {
      throw new ApiError("UNAUTHORIZED", "用户不存在或已禁用", 401);
    }

    if (!checkPermission(currentUser.role, UserRole.SUPER_ADMIN)) {
      throw new ApiError("FORBIDDEN", "权限不足，仅超级管理员可重置密码", 403);
    }

    const { id } = await params;
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new ApiError("NOT_FOUND", "用户不存在", 404);
    }

    const body = resetSchema.parse(await request.json());
    const hashedPassword = await hashPassword(body.newPassword);

    const updated = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return ok({ ...updated, message: "密码重置成功" });
  } catch (error) {
    return fail(error);
  }
}
