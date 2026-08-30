import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const cdnDomain = process.env.QINIU_DOMAIN!;

export async function GET() {
  try {
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

    const result = partners.map((partner) => ({
      id: partner.id,
      image: `${cdnDomain}/${partner.imageRelativePath}`,
      websiteUrl: partner.websiteUrl,
    }));

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
