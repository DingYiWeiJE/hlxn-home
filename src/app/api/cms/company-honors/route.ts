import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await withCache(
      "cms-company-honors",
      {},
      async () => {
        const honors = await prisma.cmsCompanyHonor.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            imageRelativePath: true,
            imageFilename: true,
          },
          orderBy: { createdAt: "desc" },
        });

        return honors.map((honor) => ({
          id: honor.id,
          image: honor.imageRelativePath,
        }));
      },
    );

    return ok(result, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
