import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const backgrounds = await prisma.cmsBackgroundImage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    // 转换为前端需要的格式
    const result = backgrounds.reduce(
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

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
