import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await withCache(
      "cms-branch-images",
      {},
      async () => {
        const images = await prisma.cmsBranchImage.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            imageRelativePath: true,
            imageFilename: true,
          },
          orderBy: { createdAt: "desc" },
        });

        return images.map((image) => ({
          id: image.id,
          image: image.imageRelativePath,
        }));
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
