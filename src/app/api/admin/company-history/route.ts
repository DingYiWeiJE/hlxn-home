import { CompanyHistoryLocale, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  adminCompanyHistoryListQuerySchema,
  createCompanyHistorySchema,
} from "@/lib/company-history/schemas";
import { parseDateInputToUtcNoon } from "@/lib/company-history/date";
import { assertCanWriteCompanyHistory } from "@/lib/company-history/permissions";
import { validateCompanyHistoryImage } from "@/lib/company-history/validation";

export const runtime = "nodejs";

function normalizeParagraphs(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor();

    const query = adminCompanyHistoryListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const where: Prisma.CompanyHistoryItemWhereInput = {
      ...(query.locale ? { locale: query.locale as CompanyHistoryLocale } : {}),
      ...(query.keyword
        ? {
            OR: [
              {
                displayTime: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
              {
                title: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(query.sortDateFrom || query.sortDateTo
        ? {
            sortDate: {
              ...(query.sortDateFrom
                ? { gte: parseDateInputToUtcNoon(query.sortDateFrom) }
                : {}),
              ...(query.sortDateTo
                ? { lte: parseDateInputToUtcNoon(query.sortDateTo) }
                : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.CompanyHistoryItemOrderByWithRelationInput[] =
      query.sort === "sortDate" && query.order === "asc"
        ? [{ sortDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
        : [
            { [query.sort]: query.order },
            ...(query.sort !== "sortDate" ? [{ sortDate: "asc" as const }] : []),
            ...(query.sort !== "sortOrder"
              ? [{ sortOrder: "asc" as const }]
              : []),
            ...(query.sort !== "createdAt"
              ? [{ createdAt: "asc" as const }]
              : []),
          ];

    const [items, total] = await prisma.$transaction([
      prisma.companyHistoryItem.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy,
        select: {
          id: true,
          locale: true,
          displayTime: true,
          sortDate: true,
          sortOrder: true,
          title: true,
          detailParagraphs: true,
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
      prisma.companyHistoryItem.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.pageSize);

    return ok({
      items: items.map((item) => ({
        ...item,
        detailParagraphCount: normalizeParagraphs(item.detailParagraphs).length,
        detailParagraphs: undefined,
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
    assertCanWriteCompanyHistory(actor);
    assertSameOriginRequest(request);

    const input = createCompanyHistorySchema.parse(await request.json());
    await validateCompanyHistoryImage(input.imageAssetId);

    const item = await prisma.$transaction((tx) =>
      tx.companyHistoryItem.create({
        data: {
          locale: input.locale as CompanyHistoryLocale,
          displayTime: input.displayTime,
          sortDate: input.sortDate,
          sortOrder: input.sortOrder,
          title: input.title,
          detailParagraphs: input.detailParagraphs,
          imageAssetId: input.imageAssetId,
          createdById: actor.userId,
          updatedById: actor.userId,
        },
        select: {
          id: true,
          locale: true,
          displayTime: true,
          sortDate: true,
          sortOrder: true,
          title: true,
          detailParagraphs: true,
          imageAssetId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );

    return ok(item, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
