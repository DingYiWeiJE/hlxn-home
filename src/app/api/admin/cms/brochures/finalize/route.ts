import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { clearCacheByNamespace } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { statQiniuObject } from "@/lib/qiniu/direct-upload";

export const runtime = "nodejs";

const MAX_BROCHURE_BYTES = Number(
  process.env.MAX_CMS_PDF_UPLOAD_BYTES ?? 100 * 1024 * 1024,
);

const bodySchema = z.object({
  language: z.enum(["zh", "en"], { message: "请选择正确的语言" }),
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

    const expectedKey = `cms/brochures/${fields.language}.pdf`;
    if (fields.key !== expectedKey) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "文件 key 与语言不匹配",
        400,
        { key: ["文件 key 与语言不匹配"] },
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

    if (stat.fsize > MAX_BROCHURE_BYTES) {
      const sizeLimit = formatMegabytes(MAX_BROCHURE_BYTES);
      throw new ApiError(
        "FILE_TOO_LARGE",
        `PDF 文件不能超过 ${sizeLimit} MB`,
        413,
        { file: [`PDF 文件不能超过 ${sizeLimit} MB`] },
      );
    }

    const realMime = stat.mimeType || "application/pdf";
    if (realMime !== "application/pdf") {
      throw new ApiError(
        "UNSUPPORTED_FILE_TYPE",
        "仅支持 PDF 文件",
        400,
        { file: ["仅支持 PDF 文件"] },
      );
    }

    const brochure = await prisma.cmsBrochure.upsert({
      where: { language: fields.language },
      update: {
        relativePath: fields.key,
        filename: fields.filename,
        mimeType: realMime,
        size: stat.fsize,
        deletedAt: null,
      },
      create: {
        language: fields.language,
        relativePath: fields.key,
        filename: fields.filename,
        mimeType: realMime,
        size: stat.fsize,
      },
    });

    revalidatePath("/api/cms/company-info");
    clearCacheByNamespace("cms-company-info");

    return ok(brochure, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
