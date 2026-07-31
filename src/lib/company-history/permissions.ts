import { UserRole } from "@prisma/client";
import type { AdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { checkPermission } from "@/lib/user-auth/require-auth";

export function assertCanWriteCompanyHistory(actor: AdminActor) {
  if (!checkPermission(actor.role, UserRole.EDITOR)) {
    throw new ApiError("FORBIDDEN", "Insufficient permission to manage company history", 403);
  }
}

export function assertCanDeleteCompanyHistory(actor: AdminActor) {
  if (!checkPermission(actor.role, UserRole.ADMIN)) {
    throw new ApiError("FORBIDDEN", "Insufficient permission to delete company history", 403);
  }
}
