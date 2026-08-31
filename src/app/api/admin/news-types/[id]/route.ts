import { NextRequest } from "next/server";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const updateNewsTypeSchema = z.object({
  chName: z.string().trim().min(1, "中文名不能为空").max(100).optional(),
  enName: z.string().trim().min(1, "英文名不能为空").max(100).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } = await params;
    const body = updateNewsTypeSchema.parse(await request.json());

    const existing = await prisma.newsType.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "新闻类型不存在");
    }

    if (existing.deletedAt) {
      throw new ApiError("NOT_FOUND", "新闻类型已删除");
    }

    const type = await prisma.newsType.update({
      where: { id },
      data: {
        ...(body.chName && { chName: body.chName }),
        ...(body.enName && { enName: body.enName }),
      },
      select: {
        id: true,
        chName: true,
        enName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok(type);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } = await params;

    const existing = await prisma.newsType.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "新闻类型不存在");
    }

    if (existing.deletedAt) {
      throw new ApiError("NOT_FOUND", "新闻类型已删除");
    }

    await prisma.newsType.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}
