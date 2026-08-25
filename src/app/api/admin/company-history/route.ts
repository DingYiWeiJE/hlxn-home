import { CompanyHistoryLocale, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  adminCompanyHistoryListQuerySchema,
  createCompanyHistoryEventSchema,
} from "@/lib/company-history/schemas";
import { parseDateInputToUtcNoon } from "@/lib/company-history/date";
import { assertCanWriteCompanyHistory } from "@/lib/company-history/permissions";
import { validateCompanyHistoryImage } from "@/lib/company-history/validation";
import { clearCacheByNamespace } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor();

    const query = adminCompanyHistoryListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const where: Prisma.CompanyHistoryEventWhereInput = {
      ...(query.locale ? { historyYear: { locale: query.locale as CompanyHistoryLocale } } : {}),
      ...(query.keyword
        ? {
            OR: [
              {
                time: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
              {
                content: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(query.sortDateFrom || query.sortDateTo
        ? {
            historyYear: {
              sortDate: {
                ...(query.sortDateFrom
                  ? { gte: parseDateInputToUtcNoon(query.sortDateFrom) }
                  : {}),
                ...(query.sortDateTo
                  ? { lte: parseDateInputToUtcNoon(query.sortDateTo) }
                  : {}),
              },
            },
          }
        : {}),
    };

    const orderBy: Prisma.CompanyHistoryEventOrderByWithRelationInput[] =
      query.sort === "sortDate"
        ? [{ historyYear: { sortDate: query.order } }, { sortOrder: "asc" }, { createdAt: "asc" }]
        : query.sort === "sortOrder"
        ? [{ sortOrder: query.order }, { historyYear: { sortDate: "asc" as const } }, { createdAt: "asc" as const }]
        : query.sort === "createdAt"
        ? [{ createdAt: query.order }, { historyYear: { sortDate: "asc" as const } }, { sortOrder: "asc" as const }]
        : query.sort === "year"
        ? [{ historyYear: { year: query.order } }, { historyYear: { sortDate: "asc" as const } }, { sortOrder: "asc" as const }]
        : [{ historyYear: { sortDate: "asc" as const } }, { sortOrder: "asc" as const }, { createdAt: "asc" as const }];

    const [items, total] = await prisma.$transaction([
      prisma.companyHistoryEvent.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy,
        select: {
          id: true,
          time: true,
          content: true,
          sortOrder: true,
          historyYear: {
            select: {
              id: true,
              locale: true,
              year: true,
              sortDate: true,
              sortOrder: true,
            },
          },
          imageAsset: {
            select: {
              id: true,
              url: true,
              width: true,
              height: true,
              alt: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.companyHistoryEvent.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.pageSize);

    return ok({
      items,
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
    assertCanWriteCompanyHistory(actor);
    assertSameOriginRequest(request);

    const input = createCompanyHistoryEventSchema.parse(await request.json());
    await validateCompanyHistoryImage(input.imageAssetId);

    const event = await prisma.$transaction(async (tx) => {
      let historyYear = await tx.companyHistoryYear.findUnique({
        where: {
          locale_year: {
            locale: input.locale as CompanyHistoryLocale,
            year: input.year,
          },
        },
      });

      if (!historyYear) {
        historyYear = await tx.companyHistoryYear.create({
          data: {
            locale: input.locale as CompanyHistoryLocale,
            year: input.year,
            sortDate: input.sortDate,
            sortOrder: input.sortOrder,
          },
        });
      }

      return tx.companyHistoryEvent.create({
        data: {
          historyYearId: historyYear.id,
          time: input.time,
          content: input.content,
          imageAssetId: input.imageAssetId,
          sortOrder: input.sortOrder,
        },
        select: {
          id: true,
          time: true,
          content: true,
          sortOrder: true,
          historyYear: {
            select: {
              id: true,
              locale: true,
              year: true,
              sortDate: true,
              sortOrder: true,
            },
          },
          imageAssetId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    clearCacheByNamespace("company-history");

    return ok({ id: event.id }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
