import { NextRequest } from "next/server";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ok, fail } from "@/lib/api/response";
import { clearCacheByNamespace, clearAllCache } from "@/lib/cache/helpers";

/**
 * 清除缓存管理接口 - 仅限管理员
 * POST /api/admin/cache/clear?namespace=news  清除特定命名空间缓存
 * POST /api/admin/cache/clear  清除所有缓存
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminActor();

    const namespace = request.nextUrl.searchParams.get("namespace");

    if (namespace) {
      const count = clearCacheByNamespace(namespace);
      return ok({
        message: `清除 ${namespace} 命名空间缓存成功`,
        count,
      });
    } else {
      clearAllCache();
      return ok({
        message: "清除所有缓存成功",
      });
    }
  } catch (error) {
    return fail(error);
  }
}
