import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { ok, fail } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { deleteFromQiniu } from "@/lib/cms/qiniu";
import { revalidatePath } from "next/cache";
import * as qiniu from "qiniu";

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

async function uploadFileToQiniu(
  file: File,
  key: string
): Promise<{ key: string; url: string }> {
  const token = getUploadToken();
  const buffer = Buffer.from(await file.arrayBuffer());

  const config = new qiniu.conf.Config();
  const formUploader = new qiniu.form_up.FormUploader(config);
  const putExtra = new qiniu.form_up.PutExtra();

  const uploadRes = await new Promise<any>((resolve, reject) => {
    formUploader.put(token, key, buffer, putExtra, (err, body) => {
      if (err) reject(err);
      resolve(body);
    });
  });

  const url = `${cdnDomain}/${uploadRes.key}`;
  return { key: uploadRes.key, url };
}

const partnerSchema = z.object({
  websiteUrl: z.string().url("请输入有效的网址").optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请选择合作伙伴图片",
        400
      );
    }

    const websiteUrl = formData.get("websiteUrl");

    const fields = partnerSchema.parse({
      websiteUrl: websiteUrl && websiteUrl !== "" ? websiteUrl : undefined,
    });

    // 检查图片大小 (3MB)
    if (file.size > 3 * 1024 * 1024) {
      throw new ApiError(
        "FILE_TOO_LARGE",
        "图片不能超过 3 MB",
        413
      );
    }

    // 检查图片类型
    if (!file.type.startsWith("image/")) {
      throw new ApiError(
        "UNSUPPORTED_FILE_TYPE",
        "仅支持图片文件",
        400
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const partnerId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const qiniuKey = `cms/partners/${partnerId}.${ext}`;

    // 上传到七牛云
    const { key } = await uploadFileToQiniu(file, qiniuKey);

    // 创建合作伙伴记录
    const partner = await prisma.cmsPartner.create({
      data: {
        imageRelativePath: key,
        imageFilename: file.name,
        imageMimeType: file.type,
        imageSize: file.size,
        websiteUrl: fields.websiteUrl || null,
      },
    });

    // 重置缓存
    revalidatePath("/api/cms/partners");

    return ok(partner, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function GET() {
  try {
    const partners = await prisma.cmsPartner.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return ok(partners);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get("id");

    if (!partnerId) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请指定合作伙伴 ID",
        400
      );
    }

    const formData = await request.formData();
    const websiteUrl = formData.get("websiteUrl");

    const fields = partnerSchema.parse({
      websiteUrl: websiteUrl && websiteUrl !== "" ? websiteUrl : undefined,
    });

    const partner = await prisma.cmsPartner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      throw new ApiError(
        "NOT_FOUND",
        "合作伙伴不存在",
        404
      );
    }

    // 检查是否有新图片要上传
    const file = formData.get("file");
    let imageRelativePath = partner.imageRelativePath;
    let imageFilename = partner.imageFilename;
    let imageMimeType = partner.imageMimeType;
    let imageSize = partner.imageSize;

    if (file instanceof File) {
      // 检查图片大小
      if (file.size > 3 * 1024 * 1024) {
        throw new ApiError(
          "FILE_TOO_LARGE",
          "图片不能超过 3 MB",
          413
        );
      }

      // 检查图片类型
      if (!file.type.startsWith("image/")) {
        throw new ApiError(
          "UNSUPPORTED_FILE_TYPE",
          "仅支持图片文件",
          400
        );
      }

      // 删除旧图片
      await deleteFromQiniu(partner.imageRelativePath);

      // 上传新图片
      const ext = file.name.split(".").pop() || "jpg";
      const newPartnerId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const qiniuKey = `cms/partners/${newPartnerId}.${ext}`;
      const { key } = await uploadFileToQiniu(file, qiniuKey);

      imageRelativePath = key;
      imageFilename = file.name;
      imageMimeType = file.type;
      imageSize = file.size;
    }

    // 更新合作伙伴
    const updated = await prisma.cmsPartner.update({
      where: { id: partnerId },
      data: {
        imageRelativePath,
        imageFilename,
        imageMimeType,
        imageSize,
        websiteUrl: fields.websiteUrl || null,
      },
    });

    // 重置缓存
    revalidatePath("/api/cms/partners");

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get("id");

    if (!partnerId) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请指定合作伙伴 ID",
        400
      );
    }

    const partner = await prisma.cmsPartner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      throw new ApiError(
        "NOT_FOUND",
        "合作伙伴不存在",
        404
      );
    }

    // 从七牛云删除
    await deleteFromQiniu(partner.imageRelativePath);

    // 从数据库删除
    await prisma.cmsPartner.delete({
      where: { id: partnerId },
    });

    // 重置缓存
    revalidatePath("/api/cms/partners");

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
