import {
  MediaAssetPurpose,
} from "@prisma/client";
import { z } from "zod";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import {
  fail,
  ok,
} from "@/lib/api/response";
import {
  uploadImage,
  uploadPdf,
} from "@/lib/media/upload";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const imagePurposeValues = [
  "GENERAL",
  "PRODUCT_COVER",
  "PRODUCT_INTRO_BACKGROUND",
  "PRODUCT_ADVANTAGE",
  "PRODUCT_APPLICATION",
  "SOLUTION_WORKING_PRINCIPLE_BACKGROUND",
  "SOLUTION_USAGE_SCENARIO",
  "SOLUTION_CUSTOMER_VALUE",
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

    if (
      fields.type === "IMAGE"
    ) {
      const uploadedImage =
        await uploadImage(
          file,
        {
            scope:
              fields.purpose.startsWith("SOLUTION_")
                ? "solutions"
                : "products",
            alt: fields.alt,
            createdById:
              actor.userId,
          },
        );

      /*
       * uploadImage 负责保存文件和创建素材记录。
       * 这里再为素材设置明确的业务用途。
       */
      const image =
        await prisma.mediaAsset.update(
          {
            where: {
              id:
                uploadedImage.id,
            },

            data: {
              purpose:
                fields.purpose as MediaAssetPurpose,
            },
          },
        );

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

    const pdf =
      await uploadPdf(file, {
        scope: "products",
        createdById:
          actor.userId,
      });

    return ok(pdf, {
      status: 201,
    });
  } catch (error) {
    return fail(error);
  }
}
