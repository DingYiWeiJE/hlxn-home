import { ok } from "@/lib/api/response";
import { getAdminSession } from "@/lib/admin-auth/session";
import { getUserAuthConfig } from "@/lib/user-auth/config";
import { getUserSession } from "@/lib/user-auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  /*
   * 优先检查新版用户登录系统。
   */
  try {
    const { sessionSecret } = getUserAuthConfig();
    const session = await getUserSession(sessionSecret);

    if (session) {
      const user = await prisma.user.findUnique({
        where: {
          id: session.sub,
        },
        select: {
          id: true,
          isActive: true,
          deletedAt: true,
        },
      });

      if (
        user &&
        user.isActive &&
        user.deletedAt === null
      ) {
        return ok({
          authenticated: true,
          actorType: "USER",
        });
      }
    }
  } catch {
    /*
     * 新版用户会话读取失败时，
     * 继续检查旧版管理员会话。
     */
  }

  /*
   * 兼容旧版管理员登录系统。
   */
  const adminSession = await getAdminSession();

  if (adminSession) {
    return ok({
      authenticated: true,
      actorType: "ADMIN",
    });
  }

  return ok({
    authenticated: false,
    actorType: null,
  });
}