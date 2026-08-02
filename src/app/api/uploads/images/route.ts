import { z } from "zod";
import { NextResponse } from "next/server";
import qiniu from "qiniu";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";

export const runtime = "nodejs";

const accessKey = process.env.QINIU_ACCESS_KEY!;
const secretKey = process.env.QINIU_SECRET_KEY!;
const bucket = process.env.QINIU_BUCKET!;
const cdnDomain = process.env.QINIU_DOMAIN!;

const formSchema = z.object({
  alt: z.string().trim().max(200).optional().nullable(),
});

function getUploadToken() {
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  const options = { scope: bucket };
  const putPolicy = new qiniu.rs.PutPolicy(options);
  return putPolicy.uploadToken(mac);
}

export async function POST(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError("VALIDATION_ERROR", "请选择图片文件", 400, { file: ["请选择图片文件"] });
    }

    const fields = formSchema.parse({ alt: formData.get("alt") });

    // 生成上传凭证
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

    // 拼接完整访问地址
    const url = `${cdnDomain}/${uploadRes.key}`;

    const image = {
      id: uploadRes.key,
      url,
      alt: fields.alt || file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    };

    return ok(image, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
