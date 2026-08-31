import { NextRequest } from "next/server";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { clearCacheByNamespace } from "@/lib/cache";

export const runtime = "nodejs";

const createNewsTypeSchema = z.object({
  chName: z.string().trim().min(1, "中文名不能为空").max(100),
  enName: z.string().trim().min(1, "英文名不能为空").max(100),
});

export async function GET() {
  try {
    await requireAdminActor();

    const types = await prisma.newsType.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        chName: true,
        enName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok({ types });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const body = createNewsTypeSchema.parse(await request.json());

    const type = await prisma.newsType.create({
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

    clearCacheByNamespace("news-types");

    return ok(type, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
