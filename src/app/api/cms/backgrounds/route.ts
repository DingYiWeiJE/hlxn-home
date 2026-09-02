import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await withCache(
      "cms-backgrounds",
      {},
      async () => {
        const backgrounds = await prisma.cmsBackgroundImage.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        });

        // 转换为前端需要的格式
        return backgrounds.reduce(
          (acc, bg) => {
            acc[bg.location] = {
              type: bg.type,
              relativePath: bg.relativePath,
              filename: bg.filename,
            };
            return acc;
          },
          {} as Record<string, any>
        );
      },
    );

    return ok(result, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
