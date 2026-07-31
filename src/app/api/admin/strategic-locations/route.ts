import {
  Prisma,
  StrategicLocationStatus,
} from "@prisma/client";
import { NextRequest } from "next/server";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { assertCanWriteStrategic } from "@/lib/strategic/permissions";
import {
  adminStrategicLocationListQuerySchema,
  createStrategicLocationSchema,
} from "@/lib/strategic/schemas";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor();

    const query = adminStrategicLocationListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const where: Prisma.StrategicLocationWhereInput = {
      deletedAt: null,
      ...(query.status
        ? { status: query.status as StrategicLocationStatus }
        : {}),
      ...(query.enabled === undefined ? {} : { enabled: query.enabled }),
      ...(query.countryCode
        ? { countryCode: query.countryCode.toUpperCase() }
        : {}),
      ...(query.keyword
        ? {
            OR: [
              { code: { contains: query.keyword, mode: "insensitive" } },
              { nameZh: { contains: query.keyword, mode: "insensitive" } },
              { nameEn: { contains: query.keyword, mode: "insensitive" } },
              {
                countryNameZh: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
              {
                countryNameEn: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
              {
                provinceNameZh: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
              {
                provinceNameEn: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
              { cityNameZh: { contains: query.keyword, mode: "insensitive" } },
              { cityNameEn: { contains: query.keyword, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.strategicLocation.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: [
          { [query.sort]: query.order },
          ...(query.sort !== "sortOrder" ? [{ sortOrder: "asc" as const }] : []),
          { createdAt: "desc" },
        ],
      }),
      prisma.strategicLocation.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.pageSize);

    return ok({
      items: items.map((item) => ({
        ...item,
        longitude: Number(item.longitude),
        latitude: Number(item.latitude),
      })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdminActor();
    assertCanWriteStrategic(actor);
    assertSameOriginRequest(request);

    const input = createStrategicLocationSchema.parse(await request.json());

    const existing = await prisma.strategicLocation.findUnique({
      where: { code: input.code },
      select: { id: true },
    });

    if (existing) {
      throw new ApiError("VALIDATION_ERROR", "网点编码已存在", 409, {
        code: ["网点编码已存在"],
      });
    }

    const item = await prisma.strategicLocation.create({
      data: {
        ...input,
        longitude: new Prisma.Decimal(input.longitude),
        latitude: new Prisma.Decimal(input.latitude),
        createdById: actor.userId,
        updatedById: actor.userId,
      },
    });

    return ok(
      {
        ...item,
        longitude: Number(item.longitude),
        latitude: Number(item.latitude),
      },
      { status: 201 },
    );
  } catch (error) {
    return fail(error);
  }
}
