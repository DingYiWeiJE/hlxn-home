import { ApiError } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

export const runtime = "nodejs";

/*
 * 该接口已废弃：现在改为浏览器直传七牛。
 * 请调用 POST /api/admin/assets/upload-token 获取上传凭证，
 * 上传完成后调用 POST /api/admin/assets/finalize 落库。
 */
export async function POST() {
  return fail(
    new ApiError(
      "UPLOAD_FAILED",
      "该接口已迁移为客户端直传，请刷新页面重试",
      410,
    ),
  );
}
