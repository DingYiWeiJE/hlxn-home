import { UserRole } from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import type { AdminActor } from "@/lib/admin-auth/require-admin-actor";
import { checkPermission } from "@/lib/user-auth/require-auth";

export function assertCanWriteStrategic(actor: AdminActor) {
  if (!checkPermission(actor.role, UserRole.EDITOR)) {
    throw new ApiError("FORBIDDEN", "Insufficient permission to manage strategic locations", 403);
  }
}

export function assertCanDeleteStrategic(actor: AdminActor) {
  if (!checkPermission(actor.role, UserRole.ADMIN)) {
    throw new ApiError("FORBIDDEN", "Insufficient permission to delete strategic locations", 403);
  }
}
