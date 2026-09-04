import { z } from "zod";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import {
  QINIU_UPLOAD_URL,
  getScopedUploadToken,
} from "@/lib/qiniu/direct-upload";

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
  filename: z.string().trim().min(1, "缺少文件名").max(255),
  mimeType: z.string().trim().min(1, "缺少文件类型").max(200),
  size: z
    .number({ message: "缺少文件大小" })
    .int()
    .positive("文件大小必须大于 0"),
});

function formatMegabytes(bytes: number): string {
  const megabytes = bytes / 1024 / 1024;
  return Number.isInteger(megabytes)
    ? String(megabytes)
    : megabytes.toFixed(1);
}

function extractExt(filename: string, fallback: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === filename.length - 1) {
    return fallback;
  }
  return filename.slice(dotIndex + 1).toLowerCase();
}

export async function POST(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const rawBody = await request.json().catch(() => null);
    const fields = bodySchema.parse(rawBody);

    let fsizeLimit: number;
    let mimeLimit: string;
    let defaultExt: string;

    if (fields.type === "image") {
      fsizeLimit = MAX_BG_IMAGE_BYTES;
      if (fields.size > MAX_BG_IMAGE_BYTES) {
        const sizeLimit = formatMegabytes(MAX_BG_IMAGE_BYTES);
        throw new ApiError(
          "FILE_TOO_LARGE",
          `背景图片不能超过 ${sizeLimit} MB`,
          413,
          { file: [`背景图片不能超过 ${sizeLimit} MB`] },
        );
      }
      if (!fields.mimeType.startsWith("image/")) {
        throw new ApiError(
          "UNSUPPORTED_FILE_TYPE",
          "仅支持图片文件",
          400,
          { file: ["仅支持图片文件"] },
        );
      }
      mimeLimit = "image/*";
      defaultExt = "jpg";
    } else {
      fsizeLimit = MAX_BG_VIDEO_BYTES;
      if (fields.size > MAX_BG_VIDEO_BYTES) {
        const sizeLimit = formatMegabytes(MAX_BG_VIDEO_BYTES);
        throw new ApiError(
          "FILE_TOO_LARGE",
          `背景视频不能超过 ${sizeLimit} MB`,
          413,
          { file: [`背景视频不能超过 ${sizeLimit} MB`] },
        );
      }
      if (!fields.mimeType.startsWith("video/")) {
        throw new ApiError(
          "UNSUPPORTED_FILE_TYPE",
          "仅支持视频文件",
          400,
          { file: ["仅支持视频文件"] },
        );
      }
      mimeLimit = "video/*";
      defaultExt = "mp4";
    }

    const ext = extractExt(fields.filename, defaultExt);
    const key = `cms/backgrounds/${fields.type}/${fields.location}.${ext}`;

    const token = getScopedUploadToken({
      key,
      fsizeLimit,
      mimeLimit,
      insertOnly: 0,
      expiresSeconds: 3600,
    });

    return ok(
      { token, key, uploadUrl: QINIU_UPLOAD_URL },
      { status: 201 },
    );
  } catch (error) {
    return fail(error);
  }
}
