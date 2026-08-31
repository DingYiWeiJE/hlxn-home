import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const types = await prisma.newsType.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        chName: true,
        enName: true,
      },
    });

    return ok({ types });
  } catch (error) {
    return fail(error);
  }
}
