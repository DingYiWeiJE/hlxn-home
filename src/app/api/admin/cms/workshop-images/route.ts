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

const workshopImageSchema = z.object({
  title: z.string().optional().or(z.literal("")),
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
        "请选择生产车间图片",
        400
      );
    }

    const fields = workshopImageSchema.parse({
      title: formData.get("title"),
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
    const imageId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const qiniuKey = `cms/workshop/${imageId}.${ext}`;

    // 上传到七牛云
    const { key } = await uploadFileToQiniu(file, qiniuKey);

    // 创建生产车间图片记录
    const image = await prisma.cmsWorkshopImage.create({
      data: {
        imageRelativePath: key,
        imageFilename: file.name,
        imageMimeType: file.type,
        imageSize: file.size,
        title: fields.title || null,
      },
    });

    // 重置缓存
    revalidatePath("/api/cms/workshop-images");

    return ok(image, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function GET() {
  try {
    const images = await prisma.cmsWorkshopImage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return ok(images);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("id");

    if (!imageId) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请指定生产车间图片 ID",
        400
      );
    }

    const formData = await request.formData();
    const fields = workshopImageSchema.parse({
      title: formData.get("title"),
    });

    const existing = await prisma.cmsWorkshopImage.findUnique({
      where: { id: imageId },
    });

    if (!existing) {
      throw new ApiError(
        "NOT_FOUND",
        "生产车间图片不存在",
        404
      );
    }

    // 检查是否有新图片要上传
    const file = formData.get("file");
    let imageRelativePath = existing.imageRelativePath;
    let imageFilename = existing.imageFilename;
    let imageMimeType = existing.imageMimeType;
    let imageSize = existing.imageSize;

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
      await deleteFromQiniu(existing.imageRelativePath);

      // 上传新图片
      const ext = file.name.split(".").pop() || "jpg";
      const newImageId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const qiniuKey = `cms/workshop/${newImageId}.${ext}`;
      const { key } = await uploadFileToQiniu(file, qiniuKey);

      imageRelativePath = key;
      imageFilename = file.name;
      imageMimeType = file.type;
      imageSize = file.size;
    }

    // 更新生产车间图片
    const updated = await prisma.cmsWorkshopImage.update({
      where: { id: imageId },
      data: {
        imageRelativePath,
        imageFilename,
        imageMimeType,
        imageSize,
        title: fields.title || null,
      },
    });

    // 重置缓存
    revalidatePath("/api/cms/workshop-images");

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
    const imageId = searchParams.get("id");

    if (!imageId) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请指定生产车间图片 ID",
        400
      );
    }

    const image = await prisma.cmsWorkshopImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new ApiError(
        "NOT_FOUND",
        "生产车间图片不存在",
        404
      );
    }

    // 从七牛云删除
    await deleteFromQiniu(image.imageRelativePath);

    // 从数据库删除
    await prisma.cmsWorkshopImage.delete({
      where: { id: imageId },
    });

    // 重置缓存
    revalidatePath("/api/cms/workshop-images");

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
