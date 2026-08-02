import {
  MediaAssetPurpose,
} from "@prisma/client";
import { z } from "zod";
import qiniu from "qiniu";
import sharp from "sharp";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import {
  fail,
  ok,
} from "@/lib/api/response";
import {
  uploadPdf,
} from "@/lib/media/upload";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const accessKey = process.env.QINIU_ACCESS_KEY!;
const secretKey = process.env.QINIU_SECRET_KEY!;
const bucket = process.env.QINIU_BUCKET!;
const cdnDomain = process.env.QINIU_DOMAIN!;

function getUploadToken() {
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  const options = { scope: bucket };
  const putPolicy = new qiniu.rs.PutPolicy(options);
  return putPolicy.uploadToken(mac);
}

async function uploadImageToQiniu(
  file: File,
): Promise<{ key: string; url: string }> {
  const token = getUploadToken();

  // 生成唯一的文件名 (时间戳 + 随机数)
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${timestamp}-${random}.${ext}`;

  // 读取文件二进制数据
  const buffer = Buffer.from(await file.arrayBuffer());

  // 配置七牛上传
  const config = new qiniu.conf.Config();
  const formUploader = new qiniu.form_up.FormUploader(config);
  const putExtra = new qiniu.form_up.PutExtra();

  // 上传到七牛
  const uploadRes = await new Promise<any>((resolve, reject) => {
    formUploader.put(token, fileName, buffer, putExtra, (err, body) => {
      if (err) reject(err);
      resolve(body);
    });
  });

  const url = `${cdnDomain}/${uploadRes.key}`;
  return { key: uploadRes.key, url };
}

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
      // 上传到七牛
      const { key, url } = await uploadImageToQiniu(file);

      // 获取图片宽高信息
      let width: number | null = null;
      let height: number | null = null;
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const metadata = await sharp(buffer).metadata();
        width = metadata.width || null;
        height = metadata.height || null;
      } catch (err) {
        console.error("Failed to get image metadata:", err);
      }

      // 保存到数据库记录
      const image =
        await prisma.mediaAsset.create({
          data: {
            filename: file.name,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            url: url,
            relativePath: `qiniu/${key}`,
            width: width,
            height: height,
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
