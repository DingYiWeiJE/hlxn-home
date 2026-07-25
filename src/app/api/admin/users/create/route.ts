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

const createSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"]).default("ADMIN"),
});

export async function POST(request: Request) {
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
      throw new ApiError("FORBIDDEN", "权限不足，仅超级管理员可创建用户", 403);
    }

    const body = createSchema.parse(await request.json());

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: body.username },
    });

    if (existingUser) {
      throw new ApiError("BAD_REQUEST", "用户名已存在", 400);
    }

    // Check if email already exists
    if (body.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingEmail) {
        throw new ApiError("BAD_REQUEST", "邮箱已被使用", 400);
      }
    }

    const hashedPassword = await hashPassword(body.password);

    const newUser = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        password: hashedPassword,
        role: body.role as UserRole,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return ok(newUser);
  } catch (error) {
    return fail(error);
  }
}
