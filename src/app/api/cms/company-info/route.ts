import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "zh";

    // 获取公司地址
    const address = await prisma.cmsCompanyAddress.findUnique({
      where: { language: lang },
      select: {
        address: true,
      },
    });

    // 获取联系方式
    const contactMethods = await prisma.cmsContactMethod.findMany({
      where: {
        language: lang,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        value: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // 获取企业画册
    const brochure = await prisma.cmsBrochure.findUnique({
      where: { language: lang as any },
      select: {
        relativePath: true,
        filename: true,
      },
    });

    const result = {
      language: lang,
      address: address?.address || null,
      contactMethods: contactMethods,
      brochure: brochure
        ? {
            relativePath: brochure.relativePath,
            filename: brochure.filename,
          }
        : null,
    };

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
