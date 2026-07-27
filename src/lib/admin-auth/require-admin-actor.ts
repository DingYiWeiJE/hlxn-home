import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth/require-admin";
import { getUserAuthConfig } from "@/lib/user-auth/config";
import { getUserSession } from "@/lib/user-auth/session";

export type AdminActor = {
  userId: string | null;
  legacyAdmin: boolean;
};

export async function requireAdminActor(): Promise<AdminActor> {
  try {
    const { sessionSecret } = getUserAuthConfig();
    const session = await getUserSession(sessionSecret);

    if (session) {
      const user = await prisma.user.findFirst({
        where: {
          id: session.sub,
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (user) {
        return {
          userId: user.id,
          legacyAdmin: false,
        };
      }
    }
  } catch {
    // 新用户鉴权不可用时，继续兼容旧版管理员鉴权
  }

  await requireAdmin();

  return {
    userId: null,
    legacyAdmin: true,
  };
}
