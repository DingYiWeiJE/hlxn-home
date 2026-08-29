import { NextRequest } from "next/server";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createCategorySchema = z.object({
  chName: z.string().trim().min(1, "中文名不能为空").max(100),
  enName: z.string().trim().min(1, "英文名不能为空").max(100),
});

const updateCategorySchema = createCategorySchema.partial();

export async function GET() {
  try {
    await requireAdminActor();

    const categories = await prisma.solutionCategory.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        chName: true,
        enName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok({ categories });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminActor();
    assertSameOriginRequest(request);

    const body = createCategorySchema.parse(await request.json());

    const category = await prisma.solutionCategory.create({
      data: {
        chName: body.chName,
        enName: body.enName,
      },
      select: {
        id: true,
        chName: true,
        enName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok(category, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
