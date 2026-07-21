import { ApiError } from "@/lib/api/errors";
import { getAdminSession } from "./session";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new ApiError("UNAUTHORIZED", "请先登录", 401);
  }
  return session;
}
