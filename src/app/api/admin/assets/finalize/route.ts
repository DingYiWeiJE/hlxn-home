import {
  MediaAssetPurpose,
  MediaAssetType,
} from "@prisma/client";
import { z } from "zod";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  buildQiniuUrl,
  statQiniuObject,
} from "@/lib/qiniu/direct-upload";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = Number(
  process.env.MAX_IMAGE_UPLOAD_BYTES ?? 10 * 1024 * 1024,
);
const MAX_PDF_BYTES = Number(
  process.env.MAX_PDF_UPLOAD_BYTES ?? 50 * 1024 * 1024,
);

const purposeValues = Object.values(MediaAssetPurpose) as [
  MediaAssetPurpose,
  ...MediaAssetPurpose[],
];

const bodySchema = z.object({
  type: z.enum(["IMAGE", "PDF"], {
    message: "请选择正确的文件类型",
  }),
  purpose: z.enum(purposeValues).default(MediaAssetPurpose.GENERAL),
  key: z.string().trim().min(1, "缺少文件 key").max(500),
  filename: z.string().trim().min(1, "缺少文件名").max(255),
  originalName: z.string().trim().max(255).optional().nullable(),
  alt: z
    .string()
    .trim()
    .max(200, "图片替代文本不能超过 200 个字符")
    .optional()
    .nullable(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
});

function formatMegabytes(bytes: number): string {
  const megabytes = bytes / 1024 / 1024;
  return Number.isInteger(megabytes)
    ? String(megabytes)
    : megabytes.toFixed(1);
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdminActor();
    assertSameOriginRequest(request);

    const rawBody = await request.json().catch(() => null);
    const fields = bodySchema.parse(rawBody);

    let stat;
    try {
      stat = await statQiniuObject(fields.key);
    } catch (err) {
      throw new ApiError(
        "UPLOAD_FAILED",
        "文件未成功上传到七牛，请重试",
        400,
        { file: ["文件未成功上传到七牛，请重试"] },
      );
    }

    const realSize = stat.fsize;
    const realMime = stat.mimeType || fields.filename;

    if (fields.type === "IMAGE") {
      if (realSize > MAX_IMAGE_BYTES) {
        const sizeLimit = formatMegabytes(MAX_IMAGE_BYTES);
        throw new ApiError(
          "FILE_TOO_LARGE",
          `图片不能超过 ${sizeLimit} MB`,
          413,
          { file: [`图片不能超过 ${sizeLimit} MB`] },
        );
      }
      if (!realMime.startsWith("image/")) {
        throw new ApiError(
          "UNSUPPORTED_FILE_TYPE",
          "仅支持图片文件",
          400,
          { file: ["仅支持图片文件"] },
        );
      }
    } else {
      if (fields.purpose !== MediaAssetPurpose.GENERAL) {
        throw new ApiError(
          "VALIDATION_ERROR",
          "PDF 文件不能设置图片用途",
          400,
          { purpose: ["PDF 文件不能设置图片用途"] },
        );
      }
      if (realSize > MAX_PDF_BYTES) {
        const sizeLimit = formatMegabytes(MAX_PDF_BYTES);
        throw new ApiError(
          "FILE_TOO_LARGE",
          `PDF 文件不能超过 ${sizeLimit} MB`,
          413,
          { file: [`PDF 文件不能超过 ${sizeLimit} MB`] },
        );
      }
      if (realMime && realMime !== "application/pdf") {
        throw new ApiError(
          "UNSUPPORTED_FILE_TYPE",
          "仅支持 PDF 文件",
          400,
          { file: ["仅支持 PDF 文件"] },
        );
      }
    }

    const mimeType = realMime ||
      (fields.type === "IMAGE" ? "application/octet-stream" : "application/pdf");

    const asset = await prisma.mediaAsset.create({
      data: {
        type:
          fields.type === "IMAGE"
            ? MediaAssetType.IMAGE
            : MediaAssetType.PDF,
        filename: fields.filename,
        originalName: fields.originalName ?? fields.filename,
        mimeType,
        size: realSize,
        relativePath: fields.key,
        checksum: stat.hash || null,
        width: fields.type === "IMAGE" ? fields.width ?? null : null,
        height: fields.type === "IMAGE" ? fields.height ?? null : null,
        alt: fields.type === "IMAGE" ? fields.alt ?? null : null,
        purpose: fields.purpose,
        createdById: actor.userId,
      },
    });

    return ok(
      { ...asset, url: buildQiniuUrl(asset.relativePath) },
      { status: 201 },
    );
  } catch (error) {
    return fail(error);
  }
}
