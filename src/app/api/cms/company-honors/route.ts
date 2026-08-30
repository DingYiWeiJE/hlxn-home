import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const honors = await prisma.cmsCompanyHonor.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        imageRelativePath: true,
        imageFilename: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const result = honors.map((honor) => ({
      id: honor.id,
      image: honor.imageRelativePath,
    }));

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
