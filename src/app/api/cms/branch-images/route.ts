import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const images = await prisma.cmsBranchImage.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        imageRelativePath: true,
        imageFilename: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const result = images.map((image) => ({
      id: image.id,
      image: image.imageRelativePath,
    }));

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
