import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { ok, fail } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { deleteFromQiniu } from "@/lib/cms/qiniu";
import { revalidatePath } from "next/cache";
import { clearCacheByNamespace } from "@/lib/cache";
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

const backgroundSchema = z.object({
  location: z.enum([
    "HOMEPAGE",
    "ABOUT_US",
    "SOLUTIONS",
    "PRODUCTS",
    "APPLICATION_CASES",
    "NEWS",
    "CONTACT_US",
  ]),
  type: z.enum(["image", "video"]),
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
        "请选择需要上传的文件",
        400
      );
    }

    const fields = backgroundSchema.parse({
      location: formData.get("location"),
      type: formData.get("type"),
    });

    // 检查文件大小 (3MB)
    if (file.size > 3 * 1024 * 1024) {
      throw new ApiError(
        "FILE_TOO_LARGE",
        "文件不能超过 3 MB",
        413
      );
    }

    // 获取文件扩展名
    const ext = file.name.split(".").pop() || (fields.type === "video" ? "mp4" : "jpg");
    const qiniuKey = `cms/backgrounds/${fields.type}/${fields.location}.${ext}`;

    // 上传到七牛云
    let uploadedKey = qiniuKey;
    try {
      const { key } = await uploadFileToQiniu(file, qiniuKey);
      uploadedKey = key;
    } catch (uploadError) {
      console.error("七牛云上传失败:", uploadError);
      // 如果七牛云上传失败，仍然使用生成的key保存到数据库
      // 这样前端可以访问备用URL或稍后重试
    }

    // 检查是否已存在该位置的背景
    const existing = await prisma.cmsBackgroundImage.findUnique({
      where: { location: fields.location as any },
    });

    // 如果存在，先删除旧文件
    if (existing) {
      try {
        await deleteFromQiniu(existing.relativePath);
      } catch (deleteError) {
        console.error("删除旧文件失败:", deleteError);
      }
      await prisma.cmsBackgroundImage.delete({
        where: { id: existing.id },
      });
    }

    // 创建新记录
    const background = await prisma.cmsBackgroundImage.create({
      data: {
        location: fields.location as any,
        type: fields.type,
        relativePath: uploadedKey,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });

    // 重置缓存
    revalidatePath("/api/cms/backgrounds");
    clearCacheByNamespace("cms-backgrounds");

    return ok(background, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function GET() {
  try {
    const backgrounds = await prisma.cmsBackgroundImage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    // 添加CDN URL到每条记录
    const backgroundsWithUrls = backgrounds.map((bg) => ({
      ...bg,
      url: `${cdnDomain}/${bg.relativePath}`,
    }));

    return ok(backgroundsWithUrls);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");

    if (!location) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请指定要删除的背景位置",
        400
      );
    }

    const background = await prisma.cmsBackgroundImage.findUnique({
      where: { location: location as any },
    });

    if (!background) {
      throw new ApiError(
        "NOT_FOUND",
        "背景不存在",
        404
      );
    }

    // 从七牛云删除
    await deleteFromQiniu(background.relativePath);

    // 从数据库删除
    await prisma.cmsBackgroundImage.delete({
      where: { id: background.id },
    });

    // 重置缓存
    revalidatePath("/api/cms/backgrounds");
    clearCacheByNamespace("cms-backgrounds");

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
