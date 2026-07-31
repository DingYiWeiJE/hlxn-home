import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { getUserAuthConfig } from "@/lib/user-auth/config";
import { getUserSession } from "@/lib/user-auth/session";
import type { UserRole } from "@prisma/client";

export type AdminActor = {
  userId: string;
  role: UserRole;
  legacyAdmin: false;
};

export async function requireAdminActor(): Promise<AdminActor> {
  const { sessionSecret } = getUserAuthConfig();
  const session = await getUserSession(sessionSecret);

  if (!session) {
    throw new ApiError("UNAUTHORIZED", "请先登录", 401);
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.sub,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError("UNAUTHORIZED", "请先登录", 401);
  }

  return {
    userId: user.id,
    role: user.role,
    legacyAdmin: false,
  };
}
