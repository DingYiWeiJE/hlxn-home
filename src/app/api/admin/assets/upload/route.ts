import {
  MediaAssetPurpose,
  MediaAssetType,
} from "@prisma/client";
import { z } from "zod";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import {
  fail,
  ok,
} from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { uploadFileToQiniu } from "@/lib/qiniu/direct-upload";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = Number(
  process.env.MAX_IMAGE_UPLOAD_BYTES ?? 10 * 1024 * 1024,
);
const MAX_PDF_BYTES = Number(
  process.env.MAX_PDF_UPLOAD_BYTES ?? 50 * 1024 * 1024,
);

const imagePurposeValues = [
  "GENERAL",
  "PRODUCT_COVER",
  "PRODUCT_INTRO_BACKGROUND",
  "PRODUCT_ADVANTAGE",
  "PRODUCT_APPLICATION",
  "SOLUTION_WORKING_PRINCIPLE_BACKGROUND",
  "SOLUTION_USAGE_SCENARIO",
  "SOLUTION_CUSTOMER_VALUE",
  "APPLICATION_CASE_IMAGE",
  "COMPANY_HISTORY_IMAGE",
  "NEWS_COVER",
  "NEWS_CONTENT",
  "STRATEGIC_LOCATION_IMAGE",
] as const;

const formSchema = z.object({
  type: z.enum(
    ["IMAGE", "PDF"],
    {
      message:
        "请选择正确的文件类型",
    },
  ),

  purpose: z
    .enum(imagePurposeValues)
    .default("GENERAL"),

  alt: z
    .string()
    .trim()
    .max(
      200,
      "图片替代文本不能超过 200 个字符",
    )
    .optional()
    .nullable(),
});

function formatMegabytes(bytes: number): string {
  const megabytes = bytes / 1024 / 1024;
  return Number.isInteger(megabytes)
    ? String(megabytes)
    : megabytes.toFixed(1);
}

export async function POST(
  request: Request,
) {
  try {
    const actor =
      await requireAdminActor();

    assertSameOriginRequest(
      request,
    );

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (
      !(file instanceof File)
    ) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请选择需要上传的文件",
        400,
        {
          file: [
            "请选择需要上传的文件",
          ],
        },
      );
    }

    const fields =
      formSchema.parse({
        type:
          formData.get("type"),

        purpose:
          formData.get(
            "purpose",
          ) ?? undefined,

        alt:
          formData.get("alt"),
      });

    if (fields.type === "IMAGE") {
      if (file.size <= 0) {
        throw new ApiError(
          "VALIDATION_ERROR",
          "请选择有效的图片文件",
          400,
          {
            file: ["请选择有效的图片文件"],
          },
        );
      }

      if (file.size > MAX_IMAGE_BYTES) {
        const sizeLimit = formatMegabytes(MAX_IMAGE_BYTES);
        throw new ApiError(
          "FILE_TOO_LARGE",
          `图片不能超过 ${sizeLimit} MB`,
          413,
          {
            file: [`图片不能超过 ${sizeLimit} MB`],
          },
        );
      }

      if (!file.type.startsWith("image/")) {
        throw new ApiError(
          "UNSUPPORTED_FILE_TYPE",
          "仅支持图片文件",
          400,
          {
            file: ["仅支持图片文件"],
          },
        );
      }

      const { key, url } = await uploadFileToQiniu(file, "");

      const image = await prisma.mediaAsset.create({
        data: {
          type: MediaAssetType.IMAGE,
          filename: file.name,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url,
          relativePath: `qiniu/${key}`,
          width: null,
          height: null,
          alt: fields.alt,
          purpose: fields.purpose as MediaAssetPurpose,
          createdById: actor.userId,
        },
      });

      return ok(image, {
        status: 201,
      });
    }

    /*
     * PDF 不属于图片用途分类，
     * 当前统一保持 GENERAL。
     */
    if (
      fields.purpose !==
      "GENERAL"
    ) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "PDF 文件不能设置图片用途",
        400,
        {
          purpose: [
            "PDF 文件不能设置图片用途",
          ],
        },
      );
    }

    if (file.size <= 0) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请选择有效的 PDF 文件",
        400,
        {
          file: ["请选择有效的 PDF 文件"],
        },
      );
    }

    if (file.size > MAX_PDF_BYTES) {
      const sizeLimit = formatMegabytes(MAX_PDF_BYTES);
      throw new ApiError(
        "FILE_TOO_LARGE",
        `PDF 文件不能超过 ${sizeLimit} MB`,
        413,
        {
          file: [`PDF 文件不能超过 ${sizeLimit} MB`],
        },
      );
    }

    if (file.type && file.type !== "application/pdf") {
      throw new ApiError(
        "UNSUPPORTED_FILE_TYPE",
        "仅支持 PDF 文件",
        400,
        {
          file: ["仅支持 PDF 文件"],
        },
      );
    }

    const { key, url } = await uploadFileToQiniu(file, "");

    const pdf = await prisma.mediaAsset.create({
      data: {
        type: MediaAssetType.PDF,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type || "application/pdf",
        size: file.size,
        url,
        relativePath: `qiniu/${key}`,
        width: null,
        height: null,
        alt: null,
        purpose: MediaAssetPurpose.GENERAL,
        createdById: actor.userId,
      },
    });

    return ok(pdf, {
      status: 201,
    });
  } catch (error) {
    return fail(error);
  }
}
