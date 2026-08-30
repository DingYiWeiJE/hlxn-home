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

export async function POST(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请选择公司荣誉图片",
        400
      );
    }

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
    const honorId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const qiniuKey = `cms/company-honor/${honorId}.${ext}`;

    // 上传到七牛云
    const { key } = await uploadFileToQiniu(file, qiniuKey);

    // 创建公司荣誉记录
    const honor = await prisma.cmsCompanyHonor.create({
      data: {
        imageRelativePath: key,
        imageFilename: file.name,
        imageMimeType: file.type,
        imageSize: file.size,
      },
    });

    // 重置缓存
    revalidatePath("/api/cms/company-honors");

    return ok(honor, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function GET() {
  try {
    const honors = await prisma.cmsCompanyHonor.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    // 添加CDN URL到每条记录
    const honorsWithUrls = honors.map((honor) => ({
      ...honor,
      url: honor.imageRelativePath ? `${cdnDomain}/${honor.imageRelativePath}` : null,
    }));

    return ok(honorsWithUrls);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { searchParams } = new URL(request.url);
    const honorId = searchParams.get("id");

    if (!honorId) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请指定公司荣誉 ID",
        400
      );
    }

    const honor = await prisma.cmsCompanyHonor.findUnique({
      where: { id: honorId },
    });

    if (!honor) {
      throw new ApiError(
        "NOT_FOUND",
        "公司荣誉不存在",
        404
      );
    }

    // 从七牛云删除
    await deleteFromQiniu(honor.imageRelativePath);

    // 从数据库删除
    await prisma.cmsCompanyHonor.delete({
      where: { id: honorId },
    });

    // 重置缓存
    revalidatePath("/api/cms/company-honors");

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
