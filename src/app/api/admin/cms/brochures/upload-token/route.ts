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

const MAX_BROCHURE_BYTES = Number(
  process.env.MAX_CMS_PDF_UPLOAD_BYTES ?? 100 * 1024 * 1024,
);

const bodySchema = z.object({
  language: z.enum(["zh", "en"], { message: "请选择正确的语言" }),
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

export async function POST(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const rawBody = await request.json().catch(() => null);
    const fields = bodySchema.parse(rawBody);

    if (fields.size > MAX_BROCHURE_BYTES) {
      const sizeLimit = formatMegabytes(MAX_BROCHURE_BYTES);
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

    const key = `cms/brochures/${fields.language}.pdf`;

    const token = getScopedUploadToken({
      key,
      fsizeLimit: MAX_BROCHURE_BYTES,
      mimeLimit: "application/pdf",
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
