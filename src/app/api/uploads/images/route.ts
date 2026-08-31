import { MediaAssetType } from "@prisma/client";
import { z } from "zod";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { uploadFileToQiniu } from "@/lib/qiniu/direct-upload";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = Number(
  process.env.MAX_IMAGE_UPLOAD_BYTES ?? 10 * 1024 * 1024,
);

const formSchema = z.object({
  alt: z.string().trim().max(200).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const actor = await requireAdminActor();
    assertSameOriginRequest(request);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请选择图片文件",
        400,
        { file: ["请选择图片文件"] },
      );
    }

    if (file.size <= 0) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请选择有效的图片文件",
        400,
        { file: ["请选择有效的图片文件"] },
      );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      const sizeLimit = (MAX_IMAGE_BYTES / 1024 / 1024).toFixed(0);
      throw new ApiError(
        "FILE_TOO_LARGE",
        `图片不能超过 ${sizeLimit} MB`,
        413,
        { file: [`图片不能超过 ${sizeLimit} MB`] },
      );
    }

    if (!file.type.startsWith("image/")) {
      throw new ApiError(
        "UNSUPPORTED_FILE_TYPE",
        "仅支持图片文件",
        400,
        { file: ["仅支持图片文件"] },
      );
    }

    const fields = formSchema.parse({
      alt: formData.get("alt"),
    });

    const { key, url } = await uploadFileToQiniu(file, "news");

    const image = await prisma.mediaAsset.create({
      data: {
        type: MediaAssetType.IMAGE,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        relativePath: key,
        width: null,
        height: null,
        alt: fields.alt?.trim() || null,
        createdById: actor.userId,
      },
    });

    return ok({ ...image, url }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
