import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    const { id } = await params;

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new ApiError("NOT_FOUND", "提交不存在", 404);
    }

    const restored = await prisma.contactSubmission.update({
      where: { id },
      data: { deletedAt: null },
    });

    return ok(restored);
  } catch (error) {
    return fail(error);
  }
}
