import { Prisma } from "@prisma/client";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  assertCanDeleteStrategic,
  assertCanWriteStrategic,
} from "@/lib/strategic/permissions";
import { updateStrategicLocationSchema } from "@/lib/strategic/schemas";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function serializeItem<T extends { longitude: Prisma.Decimal; latitude: Prisma.Decimal }>(
  item: T,
) {
  return {
    ...item,
    longitude: Number(item.longitude),
    latitude: Number(item.latitude),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminActor();

    const { id } = await context.params;
    const item = await prisma.strategicLocation.findFirst({
      where: { id, deletedAt: null },
    });

    if (!item) {
      throw new ApiError("NOT_FOUND", "战略布局网点不存在", 404);
    }

    return ok(serializeItem(item));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireAdminActor();
    assertCanWriteStrategic(actor);
    assertSameOriginRequest(request);

    const { id } = await context.params;
    const input = updateStrategicLocationSchema.parse(await request.json());

    const existing = await prisma.strategicLocation.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, code: true },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "战略布局网点不存在", 404);
    }

    if (existing.code !== input.code) {
      const duplicated = await prisma.strategicLocation.findUnique({
        where: { code: input.code },
        select: { id: true },
      });

      if (duplicated) {
        throw new ApiError("VALIDATION_ERROR", "网点编码已存在", 409, {
          code: ["网点编码已存在"],
        });
      }
    }

    const item = await prisma.strategicLocation.update({
      where: { id },
      data: {
        ...input,
        longitude: new Prisma.Decimal(input.longitude),
        latitude: new Prisma.Decimal(input.latitude),
        updatedById: actor.userId,
      },
    });

    return ok(serializeItem(item));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireAdminActor();
    assertCanDeleteStrategic(actor);
    assertSameOriginRequest(request);

    const { id } = await context.params;

    const existing = await prisma.strategicLocation.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "战略布局网点不存在", 404);
    }

    await prisma.strategicLocation.update({
      where: { id },
      data: {
        enabled: false,
        deletedAt: new Date(),
        updatedById: actor.userId,
      },
    });

    return ok({ id, deleted: true });
  } catch (error) {
    return fail(error);
  }
}
