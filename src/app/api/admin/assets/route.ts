import {
  MediaAssetPurpose,
  MediaAssetType,
  Prisma,
} from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { fail, ok } from "@/lib/api/response";
import { buildMediaUrl } from "@/lib/media/asset-url";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const purposeValues = [
  "GENERAL",
  "PRODUCT_COVER",
  "PRODUCT_INTRO_BACKGROUND",
  "PRODUCT_ADVANTAGE",
  "PRODUCT_APPLICATION",
  "SOLUTION_WORKING_PRINCIPLE_BACKGROUND",
  "SOLUTION_USAGE_SCENARIO",
  "SOLUTION_CUSTOMER_VALUE",
  "APPLICATION_CASE_IMAGE",
  "COMPANY_HISTORY_IMAGE",
  "NEWS_COVER",
  "NEWS_CONTENT",
  "STRATEGIC_LOCATION_IMAGE",
] as const;

const querySchema = z.object({
  type: z
    .enum(["IMAGE", "PDF"])
    .optional(),

  purpose: z
    .enum(purposeValues)
    .optional(),

  keyword: z
    .string()
    .trim()
    .max(
      100,
      "搜索关键词不能超过 100 个字符",
    )
    .optional(),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});

/**
 * 后台素材库列表
 *
 * GET /api/admin/assets
 * GET /api/admin/assets?type=IMAGE
 * GET /api/admin/assets?type=IMAGE&purpose=PRODUCT_COVER
 * GET /api/admin/assets?type=IMAGE&purpose=PRODUCT_INTRO_BACKGROUND
 * GET /api/admin/assets?type=IMAGE&purpose=PRODUCT_ADVANTAGE
 * GET /api/admin/assets?type=IMAGE&purpose=PRODUCT_APPLICATION
 */
export async function GET(
  request: NextRequest,
) {
  try {
    await requireAdminActor();

    const query = querySchema.parse(
      Object.fromEntries(
        request.nextUrl.searchParams,
      ),
    );

    const where: Prisma.MediaAssetWhereInput = {
      deletedAt: null,
      enabled: true,

      ...(query.type
        ? {
            type:
              query.type as MediaAssetType,
          }
        : {}),

      ...(query.purpose
        ? {
            purpose:
              query.purpose as MediaAssetPurpose,
          }
        : {}),

      ...(query.keyword
        ? {
            OR: [
              {
                originalName: {
                  contains:
                    query.keyword,
                  mode: "insensitive",
                },
              },
              {
                filename: {
                  contains:
                    query.keyword,
                  mode: "insensitive",
                },
              },
              {
                alt: {
                  contains:
                    query.keyword,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] =
      await prisma.$transaction([
        prisma.mediaAsset.findMany({
          where,

          skip:
            (query.page - 1) *
            query.pageSize,

          take: query.pageSize,

          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            type: true,
            purpose: true,
            relativePath: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            checksum: true,
            width: true,
            height: true,
            alt: true,
            enabled: true,
            createdAt: true,
            updatedAt: true,

            _count: {
              select: {
                advantages: true,
                applications: true,
                productCovers: true,
                productIntroBackgrounds:
                  true,
                solutionWorkingPrincipleBackgrounds:
                  true,
                solutionUsageScenarios: true,
                solutionCustomerValues: true,
                productPdfs: true,
                newsCovers: true,
                applicationCaseImages: true,
                companyHistoryEvents: true,
              },
            },
          },
        }),

        prisma.mediaAsset.count({
          where,
        }),
      ]);

    const totalPages =
      Math.ceil(
        total / query.pageSize,
      );

    return ok({
      items: items.map(
        (item) => {
          const totalUsage =
            item._count.advantages +
            item._count.applications +
            item._count.productCovers +
            item._count
              .productIntroBackgrounds +
            item._count
              .solutionWorkingPrincipleBackgrounds +
            item._count
              .solutionUsageScenarios +
            item._count
              .solutionCustomerValues +
            item._count.productPdfs +
            item._count.newsCovers +
            item._count.applicationCaseImages +
            item._count.companyHistoryEvents;

          return {
            id: item.id,
            type: item.type,
            purpose: item.purpose,
            url: buildMediaUrl(item.relativePath),
            relativePath:
              item.relativePath,
            filename:
              item.filename,
            originalName:
              item.originalName,
            mimeType:
              item.mimeType,
            size: item.size,
            checksum:
              item.checksum,
            width: item.width,
            height: item.height,
            alt: item.alt,
            enabled:
              item.enabled,
            createdAt:
              item.createdAt,
            updatedAt:
              item.updatedAt,

            usage: {
              advantages:
                item._count
                  .advantages,

              applications:
                item._count
                  .applications,

              productCovers:
                item._count
                  .productCovers,

              productIntroBackgrounds:
                item._count
                  .productIntroBackgrounds,

              productPdfs:
                item._count
                  .productPdfs,

              newsCovers:
                item._count
                  .newsCovers,

              applicationCaseImages:
                item._count
                  .applicationCaseImages,

              companyHistoryEvents:
                item._count
                  .companyHistoryEvents,

              solutionWorkingPrincipleBackgrounds:
                item._count
                  .solutionWorkingPrincipleBackgrounds,

              solutionUsageScenarios:
                item._count
                  .solutionUsageScenarios,

              solutionCustomerValues:
                item._count
                  .solutionCustomerValues,

              total:
                totalUsage,
            },
          };
        },
      ),

      pagination: {
        page: query.page,
        pageSize:
          query.pageSize,
        total,
        totalPages,

        hasNextPage:
          query.page <
          totalPages,

        hasPreviousPage:
          query.page > 1,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
