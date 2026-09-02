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

const brochureSchema = z.object({
  language: z.enum(["zh", "en"]),
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

    const fields = brochureSchema.parse({
      language: formData.get("language"),
    });

    // 检查是否是 PDF
    if (file.type !== "application/pdf") {
      throw new ApiError(
        "UNSUPPORTED_FILE_TYPE",
        "仅支持 PDF 文件",
        400
      );
    }

    // 检查文件大小 (3MB)
    if (file.size > 3 * 1024 * 1024) {
      throw new ApiError(
        "FILE_TOO_LARGE",
        "文件不能超过 3 MB",
        413
      );
    }

    const qiniuKey = `cms/brochures/${fields.language}.pdf`;

    // 上传到七牛云
    const { key } = await uploadFileToQiniu(file, qiniuKey);

    // 检查是否已存在该语言的画册
    const existing = await prisma.cmsBrochure.findUnique({
      where: { language: fields.language as any },
    });

    // 如果存在，先删除旧文件
    if (existing) {
      await deleteFromQiniu(existing.relativePath);
      await prisma.cmsBrochure.delete({
        where: { id: existing.id },
      });
    }

    // 创建新记录
    const brochure = await prisma.cmsBrochure.create({
      data: {
        language: fields.language as any,
        relativePath: key,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });

    // 重置缓存
    revalidatePath("/api/cms/company-info");
    clearCacheByNamespace("cms-company-info");

    return ok(brochure, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function GET() {
  try {
    const brochures = await prisma.cmsBrochure.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return ok(brochures);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language");

    if (!language || !["zh", "en"].includes(language)) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请指定正确的语言",
        400
      );
    }

    const brochure = await prisma.cmsBrochure.findUnique({
      where: { language: language as any },
    });

    if (!brochure) {
      throw new ApiError(
        "NOT_FOUND",
        "画册不存在",
        404
      );
    }

    // 从七牛云删除
    await deleteFromQiniu(brochure.relativePath);

    // 从数据库删除
    await prisma.cmsBrochure.delete({
      where: { id: brochure.id },
    });

    // 重置缓存
    revalidatePath("/api/cms/company-info");
    clearCacheByNamespace("cms-company-info");

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
