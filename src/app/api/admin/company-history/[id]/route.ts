import { CompanyHistoryLocale } from "@prisma/client";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import {
  updateCompanyHistorySchema,
} from "@/lib/company-history/schemas";
import {
  assertCanDeleteCompanyHistory,
  assertCanWriteCompanyHistory,
} from "@/lib/company-history/permissions";
import { validateCompanyHistoryImage } from "@/lib/company-history/validation";
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

    const item = await prisma.companyHistoryItem.findUnique({
      where: { id },
      select: {
        id: true,
        locale: true,
        displayTime: true,
        sortDate: true,
        sortOrder: true,
        title: true,
        detailParagraphs: true,
        imageAssetId: true,
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
    });

    if (!item) {
      throw new ApiError("NOT_FOUND", "公司发展历程不存在", 404);
    }

    return ok(item);
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
    const input = updateCompanyHistorySchema.parse(await request.json());

    const existing = await prisma.companyHistoryItem.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "公司发展历程不存在", 404);
    }

    await validateCompanyHistoryImage(input.imageAssetId);

    const item = await prisma.$transaction((tx) =>
      tx.companyHistoryItem.update({
        where: { id },
        data: {
          locale: input.locale as CompanyHistoryLocale,
          displayTime: input.displayTime,
          sortDate: input.sortDate,
          sortOrder: input.sortOrder,
          title: input.title,
          detailParagraphs: input.detailParagraphs,
          imageAssetId: input.imageAssetId,
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

    clearCacheByNamespace("company-history");

    return ok(item);
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

    const existing = await prisma.companyHistoryItem.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "公司发展历程不存在", 404);
    }

    await prisma.$transaction((tx) =>
      tx.companyHistoryItem.delete({
        where: { id },
      }),
    );

    clearCacheByNamespace("company-history");

    return ok({ id, deleted: true });
  } catch (error) {
    return fail(error);
  }
}
