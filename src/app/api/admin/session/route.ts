import { ok } from "@/lib/api/response";
import { getUserAuthConfig } from "@/lib/user-auth/config";
import { getUserSession } from "@/lib/user-auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
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

    if (user && user.isActive && user.deletedAt === null) {
      return ok({
        authenticated: true,
        actorType: "USER",
      });
    }
  }

  return ok({
    authenticated: false,
    actorType: null,
  });
}
