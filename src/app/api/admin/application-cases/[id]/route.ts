import { ApplicationCaseLocale } from "@prisma/client";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  updateApplicationCaseSchema,
} from "@/lib/application-cases/schemas";
import {
  validateApplicationCaseImage,
} from "@/lib/application-cases/validation";
import { clearCacheByNamespace } from "@/lib/cache";

export const runtime = "nodejs";

/**
 * 获取应用案例详情
 *
 * GET /api/admin/application-cases/[id]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminActor();

    const { id } = await params;

    const applicationCase =
      await prisma.applicationCase.findUnique({
        where: { id },
        select: {
          id: true,
          locale: true,
          title: true,
          slug: true,
          contentParagraphs: true,
          caseDate: true,
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
          deletedAt: true,
        },
      });

    if (!applicationCase) {
      throw new ApiError(
        "NOT_FOUND",
        "应用案例不存在",
        404,
      );
    }

    return ok(applicationCase);
  } catch (error) {
    return fail(error);
  }
}

/**
 * 更新应用案例
 *
 * PATCH /api/admin/application-cases/[id]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor =
      await requireAdminActor();

    assertSameOriginRequest(request);

    const { id } = await params;

    const body = await request.json();

    const input =
      updateApplicationCaseSchema.parse(body);

    const existing =
      await prisma.applicationCase.findUnique({
        where: { id },
        select: {
          id: true,
          locale: true,
          slug: true,
        },
      });

    if (!existing) {
      throw new ApiError(
        "NOT_FOUND",
        "应用案例不存在",
        404,
      );
    }

    if (input.imageAssetId) {
      await validateApplicationCaseImage(
        input.imageAssetId,
      );
    }

    const updateData: any = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (
      input.contentParagraphs !== undefined
    ) {
      const normalized = Array.isArray(
        input.contentParagraphs,
      )
        ? input.contentParagraphs
          .map(
            (p) =>
              typeof p === "string"
                ? p.trim()
                : "",
          )
          .filter(Boolean)
        : [];

      updateData.contentParagraphs =
        normalized;
    }

    if (input.caseDate !== undefined) {
      updateData.caseDate = input.caseDate;
    }

    if (input.imageAssetId !== undefined) {
      updateData.imageAssetId =
        input.imageAssetId;
    }

    updateData.updatedById = actor.userId;

    const applicationCase =
      await prisma.applicationCase.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          locale: true,
          title: true,
          slug: true,
          contentParagraphs: true,
          caseDate: true,
          imageAssetId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    clearCacheByNamespace("application-cases");

    return ok(applicationCase);
  } catch (error) {
    return fail(error);
  }
}

/**
 * 软删除应用案例
 *
 * DELETE /api/admin/application-cases/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminActor();

    assertSameOriginRequest(request);

    const { id } = await params;

    const applicationCase =
      await prisma.applicationCase.findUnique({
        where: { id },
        select: { id: true },
      });

    if (!applicationCase) {
      throw new ApiError(
        "NOT_FOUND",
        "应用案例不存在",
        404,
      );
    }

    await prisma.applicationCase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    clearCacheByNamespace("application-cases");

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}
