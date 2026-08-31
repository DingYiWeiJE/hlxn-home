import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await withCache(
      "news-types",
      {},
      async () => {
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

        return { types };
      },
    );

    return ok(data, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
