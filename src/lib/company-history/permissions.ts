import { UserRole } from "@prisma/client";
import type { AdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { checkPermission } from "@/lib/user-auth/require-auth";

export function assertCanWriteCompanyHistory(actor: AdminActor) {
  if (actor.legacyAdmin || actor.role === "LEGACY_ADMIN") {
    return;
  }

  if (!checkPermission(actor.role, UserRole.EDITOR)) {
    throw new ApiError("FORBIDDEN", "权限不足，无法维护公司发展历程", 403);
  }
}

export function assertCanDeleteCompanyHistory(actor: AdminActor) {
  if (actor.legacyAdmin || actor.role === "LEGACY_ADMIN") {
    return;
  }

  if (!checkPermission(actor.role, UserRole.ADMIN)) {
    throw new ApiError("FORBIDDEN", "权限不足，无法删除公司发展历程", 403);
  }
}
