import { UserRole } from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import type { AdminActor } from "@/lib/admin-auth/require-admin-actor";
import { checkPermission } from "@/lib/user-auth/require-auth";

export function assertCanWriteStrategic(actor: AdminActor) {
  if (actor.legacyAdmin || actor.role === "LEGACY_ADMIN") {
    return;
  }

  if (!checkPermission(actor.role, UserRole.EDITOR)) {
    throw new ApiError("FORBIDDEN", "权限不足，无法维护战略布局网点", 403);
  }
}

export function assertCanDeleteStrategic(actor: AdminActor) {
  if (actor.legacyAdmin || actor.role === "LEGACY_ADMIN") {
    return;
  }

  if (!checkPermission(actor.role, UserRole.ADMIN)) {
    throw new ApiError("FORBIDDEN", "权限不足，无法删除战略布局网点", 403);
  }
}
