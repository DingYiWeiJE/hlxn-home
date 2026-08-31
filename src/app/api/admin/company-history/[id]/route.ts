import { CompanyHistoryLocale } from "@prisma/client";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import {
  updateCompanyHistoryEventSchema,
} from "@/lib/company-history/schemas";
import {
  assertCanDeleteCompanyHistory,
  assertCanWriteCompanyHistory,
} from "@/lib/company-history/permissions";
import { validateCompanyHistoryImage } from "@/lib/company-history/validation";
import { withMediaUrl } from "@/lib/media/asset-url";
import { prisma } from "@/lib/prisma";
import { clearCacheByNamespace } from "@/lib/cache";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminActor();

    const { id } = await context.params;

    const event = await prisma.companyHistoryEvent.findUnique({
      where: { id },
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
        imageAsset: {
          select: {
            id: true,
            relativePath: true,
            width: true,
            height: true,
            alt: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!event) {
      throw new ApiError("NOT_FOUND", "公司发展历程事件不存在", 404);
    }

    return ok({
      ...event,
      imageAsset: withMediaUrl(event.imageAsset),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireAdminActor();
    assertCanWriteCompanyHistory(actor);
    assertSameOriginRequest(request);

    const { id } = await context.params;
    const input = updateCompanyHistoryEventSchema.parse(await request.json());

    const existing = await prisma.companyHistoryEvent.findUnique({
      where: { id },
      select: { id: true, historyYearId: true },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "公司发展历程事件不存在", 404);
    }

    if (input.imageAssetId !== undefined) {
      await validateCompanyHistoryImage(input.imageAssetId);
    }

    const event = await prisma.$transaction(async (tx) => {
      let historyYearId = existing.historyYearId;

      if (input.year !== undefined && input.locale !== undefined) {
        const locale = input.locale as CompanyHistoryLocale;
        const year = input.year;

        const historyYear = await tx.companyHistoryYear.findUnique({
          where: {
            locale_year: {
              locale,
              year,
            },
          },
        });

        if (!historyYear) {
          const newYear = await tx.companyHistoryYear.create({
            data: {
              locale,
              year,
              sortDate: input.sortDate || new Date(),
              sortOrder: input.sortOrder ?? 0,
            },
          });
          historyYearId = newYear.id;
        } else {
          historyYearId = historyYear.id;
        }
      }

      return tx.companyHistoryEvent.update({
        where: { id },
        data: {
          historyYearId,
          ...(input.time !== undefined && { time: input.time }),
          ...(input.content !== undefined && { content: input.content }),
          ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
          ...(input.imageAssetId !== undefined && { imageAssetId: input.imageAssetId }),
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

    return ok(event);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireAdminActor();
    assertCanDeleteCompanyHistory(actor);
    assertSameOriginRequest(request);

    const { id } = await context.params;

    const existing = await prisma.companyHistoryEvent.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "公司发展历程事件不存在", 404);
    }

    await prisma.companyHistoryEvent.delete({
      where: { id },
    });

    clearCacheByNamespace("company-history");

    return ok({ id, deleted: true });
  } catch (error) {
    return fail(error);
  }
}
