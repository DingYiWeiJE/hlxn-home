import { CmsBackgroundLocation } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { CMS_BACKGROUNDS_CACHE_TAG } from "@/lib/cms/backgrounds";
import { deleteFromQiniu } from "@/lib/cms/qiniu";
import { prisma } from "@/lib/prisma";
import { buildQiniuUrl } from "@/lib/qiniu/direct-upload";

export const runtime = "nodejs";

/*
 * POST 已废弃：改为浏览器直传七牛。
 * 请调用 POST /api/admin/cms/backgrounds/upload-token 获取上传凭证，
 * 上传完成后调用 POST /api/admin/cms/backgrounds/finalize 落库。
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
    const backgrounds = await prisma.cmsBackgroundImage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    const backgroundsWithUrls = backgrounds.map((bg) => ({
      ...bg,
      url: buildQiniuUrl(bg.relativePath),
    }));

    return ok(backgroundsWithUrls);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");

    if (
      !location ||
      !(Object.values(CmsBackgroundLocation) as string[]).includes(location)
    ) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请指定要删除的背景位置",
        400,
      );
    }

    const background = await prisma.cmsBackgroundImage.findUnique({
      where: { location: location as CmsBackgroundLocation },
    });

    if (!background) {
      throw new ApiError("NOT_FOUND", "背景不存在", 404);
    }

    await deleteFromQiniu(background.relativePath);

    await prisma.cmsBackgroundImage.delete({
      where: { id: background.id },
    });

    revalidatePath("/api/cms/backgrounds");
    revalidateTag(CMS_BACKGROUNDS_CACHE_TAG, { expire: 0 });

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
