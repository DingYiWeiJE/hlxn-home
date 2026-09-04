import { MediaAssetPurpose } from "@prisma/client";
import { z } from "zod";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import {
  QINIU_UPLOAD_URL,
  buildQiniuKey,
  getScopedUploadToken,
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
  return filename.slice(dotIndex + 1);
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdminActor();
    assertSameOriginRequest(request);

    const rawBody = await request.json().catch(() => null);
    const fields = bodySchema.parse(rawBody);

    let fsizeLimit: number;
    let mimeLimit: string;
    let defaultExt: string;

    if (fields.type === "IMAGE") {
      fsizeLimit = MAX_IMAGE_BYTES;

      if (fields.size > MAX_IMAGE_BYTES) {
        const sizeLimit = formatMegabytes(MAX_IMAGE_BYTES);
        throw new ApiError(
          "FILE_TOO_LARGE",
          `图片不能超过 ${sizeLimit} MB`,
          413,
          { file: [`图片不能超过 ${sizeLimit} MB`] },
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
      defaultExt = "bin";
    } else {
      fsizeLimit = MAX_PDF_BYTES;

      if (fields.purpose !== MediaAssetPurpose.GENERAL) {
        throw new ApiError(
          "VALIDATION_ERROR",
          "PDF 文件不能设置图片用途",
          400,
          { purpose: ["PDF 文件不能设置图片用途"] },
        );
      }

      if (fields.size > MAX_PDF_BYTES) {
        const sizeLimit = formatMegabytes(MAX_PDF_BYTES);
        throw new ApiError(
          "FILE_TOO_LARGE",
          `PDF 文件不能超过 ${sizeLimit} MB`,
          413,
          { file: [`PDF 文件不能超过 ${sizeLimit} MB`] },
        );
      }

      if (fields.mimeType !== "application/pdf") {
        throw new ApiError(
          "UNSUPPORTED_FILE_TYPE",
          "仅支持 PDF 文件",
          400,
          { file: ["仅支持 PDF 文件"] },
        );
      }

      mimeLimit = "application/pdf";
      defaultExt = "pdf";
    }

    const key = buildQiniuKey("", extractExt(fields.filename, defaultExt));

    const token = getScopedUploadToken({
      key,
      fsizeLimit,
      mimeLimit,
      insertOnly: 1,
      expiresSeconds: 3600,
    });

    return ok(
      {
        token,
        key,
        uploadUrl: QINIU_UPLOAD_URL,
        actorId: actor.userId,
      },
      { status: 201 },
    );
  } catch (error) {
    return fail(error);
  }
}
