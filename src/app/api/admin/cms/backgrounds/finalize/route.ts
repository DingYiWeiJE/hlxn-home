import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { CMS_BACKGROUNDS_CACHE_TAG } from "@/lib/cms/backgrounds";
import { deleteFromQiniu } from "@/lib/cms/qiniu";
import { prisma } from "@/lib/prisma";
import { buildQiniuUrl, statQiniuObject } from "@/lib/qiniu/direct-upload";

export const runtime = "nodejs";

const MAX_BG_IMAGE_BYTES = Number(
  process.env.MAX_CMS_BG_IMAGE_UPLOAD_BYTES ?? 20 * 1024 * 1024,
);
const MAX_BG_VIDEO_BYTES = Number(
  process.env.MAX_CMS_BG_VIDEO_UPLOAD_BYTES ?? 300 * 1024 * 1024,
);

const bodySchema = z.object({
  location: z.enum([
    "HOMEPAGE",
    "ABOUT_US",
    "SOLUTIONS",
    "PRODUCTS",
    "APPLICATION_CASES",
    "NEWS",
    "CONTACT_US",
  ]),
  type: z.enum(["image", "video"]),
  key: z.string().trim().min(1, "缺少文件 key").max(500),
  filename: z.string().trim().min(1, "缺少文件名").max(255),
});

function formatMegabytes(bytes: number): string {
  const megabytes = bytes / 1024 / 1024;
  return Number.isInteger(megabytes)
    ? String(megabytes)
    : megabytes.toFixed(1);
}

export async function POST(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const rawBody = await request.json().catch(() => null);
    const fields = bodySchema.parse(rawBody);

    const expectedPrefix = `cms/backgrounds/${fields.type}/${fields.location}.`;
    if (!fields.key.startsWith(expectedPrefix)) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "文件 key 与位置/类型不匹配",
        400,
        { key: ["文件 key 与位置/类型不匹配"] },
      );
    }

    let stat;
    try {
      stat = await statQiniuObject(fields.key);
    } catch {
      throw new ApiError(
        "UPLOAD_FAILED",
        "文件未成功上传到七牛，请重试",
        400,
        { file: ["文件未成功上传到七牛，请重试"] },
      );
    }

    const maxBytes =
      fields.type === "image" ? MAX_BG_IMAGE_BYTES : MAX_BG_VIDEO_BYTES;
    if (stat.fsize > maxBytes) {
      const sizeLimit = formatMegabytes(maxBytes);
      throw new ApiError(
        "FILE_TOO_LARGE",
        `文件不能超过 ${sizeLimit} MB`,
        413,
        { file: [`文件不能超过 ${sizeLimit} MB`] },
      );
    }

    const realMime = stat.mimeType || "";
    const expectedMimePrefix = fields.type === "image" ? "image/" : "video/";
    if (realMime && !realMime.startsWith(expectedMimePrefix)) {
      throw new ApiError(
        "UNSUPPORTED_FILE_TYPE",
        fields.type === "image" ? "仅支持图片文件" : "仅支持视频文件",
        400,
        {
          file: [
            fields.type === "image" ? "仅支持图片文件" : "仅支持视频文件",
          ],
        },
      );
    }

    const mimeType =
      realMime || (fields.type === "image" ? "image/jpeg" : "video/mp4");

    const existing = await prisma.cmsBackgroundImage.findUnique({
      where: { location: fields.location },
    });

    if (existing && existing.relativePath !== fields.key) {
      try {
        await deleteFromQiniu(existing.relativePath);
      } catch (deleteError) {
        console.error("删除旧背景文件失败:", deleteError);
      }
    }

    if (existing) {
      await prisma.cmsBackgroundImage.delete({
        where: { id: existing.id },
      });
    }

    const background = await prisma.cmsBackgroundImage.create({
      data: {
        location: fields.location,
        type: fields.type,
        relativePath: fields.key,
        filename: fields.filename,
        mimeType,
        size: stat.fsize,
      },
    });

    revalidatePath("/api/cms/backgrounds");
    revalidateTag(CMS_BACKGROUNDS_CACHE_TAG, { expire: 0 });

    return ok(
      { ...background, url: buildQiniuUrl(background.relativePath) },
      { status: 201 },
    );
  } catch (error) {
    return fail(error);
  }
}
