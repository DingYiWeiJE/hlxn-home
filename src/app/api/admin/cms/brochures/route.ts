import { revalidatePath } from "next/cache";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { clearCacheByNamespace } from "@/lib/cache";
import { deleteFromQiniu } from "@/lib/cms/qiniu";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/*
 * POST 已废弃：改为浏览器直传七牛。
 * 请调用 POST /api/admin/cms/brochures/upload-token 获取上传凭证，
 * 上传完成后调用 POST /api/admin/cms/brochures/finalize 落库。
 */
export async function POST() {
  return fail(
    new ApiError(
      "UPLOAD_FAILED",
      "该接口已迁移为客户端直传，请刷新页面重试",
      410,
    ),
  );
}

export async function GET() {
  try {
    const brochures = await prisma.cmsBrochure.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return ok(brochures);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language");

    if (!language || !["zh", "en"].includes(language)) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请指定正确的语言",
        400,
      );
    }

    const brochure = await prisma.cmsBrochure.findUnique({
      where: { language: language as "zh" | "en" },
    });

    if (!brochure) {
      throw new ApiError("NOT_FOUND", "画册不存在", 404);
    }

    await deleteFromQiniu(brochure.relativePath);

    await prisma.cmsBrochure.delete({
      where: { id: brochure.id },
    });

    revalidatePath("/api/cms/company-info");
    clearCacheByNamespace("cms-company-info");

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
