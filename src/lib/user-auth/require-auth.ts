import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "./session";
import { getUserAuthConfig } from "./config";
import { UserRole } from "@prisma/client";

export async function requireUserAuth(requiredRole?: UserRole) {
  const { sessionSecret } = getUserAuthConfig();
  const session = await getUserSession(sessionSecret);

  if (!session) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
  });

  if (!user || !user.isActive || user.deletedAt) {
    redirect("/admin/login");
  }

  // Check role permission if required
  if (requiredRole) {
    const hasPermission = checkPermission(user.role, requiredRole);
    if (!hasPermission) {
      throw new Error("权限不足");
    }
  }

  return user;
}

export function checkPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    SUPER_ADMIN: 100,
    ADMIN: 50,
    EDITOR: 20,
    VIEWER: 10,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions: Record<UserRole, string[]> = {
    SUPER_ADMIN: ["*"],
    ADMIN: [
      "news:create",
      "news:read",
      "news:update",
      "news:delete",
      "news:publish",
      "media:upload",
      "users:read",
    ],
    EDITOR: [
      "news:read",
      "news:update",
      "media:upload",
    ],
    VIEWER: [
      "news:read",
      "media:read",
    ],
  };

  const permissions = rolePermissions[userRole];
  return permissions.includes("*") || permissions.includes(permission);
}
