import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";

const cdnDomain = process.env.QINIU_DOMAIN!;

export async function GET() {
  try {
    const result = await withCache(
      "cms-partners",
      {},
      async () => {
        const partners = await prisma.cmsPartner.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            imageRelativePath: true,
            imageFilename: true,
            websiteUrl: true,
          },
          orderBy: { createdAt: "asc" },
        });

        return partners.map((partner) => ({
          id: partner.id,
          image: `${cdnDomain}/${partner.imageRelativePath}`,
          websiteUrl: partner.websiteUrl,
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
