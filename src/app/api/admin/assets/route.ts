import {
  MediaAssetType,
  Prisma,
} from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const querySchema = z.object({
  type: z
    .enum(["IMAGE", "PDF"])
    .optional(),

  keyword: z
    .string()
    .trim()
    .max(100, "搜索关键词不能超过 100 个字符")
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
 * GET /api/admin/assets?type=PDF
 * GET /api/admin/assets?type=IMAGE&keyword=产品
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

      ...(query.keyword
        ? {
            OR: [
              {
                originalName: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
              {
                filename: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
              {
                alt: {
                  contains: query.keyword,
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
            url: true,
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
                // 产品优势图片引用
                advantages: true,

                // 应用场景图片引用
                applications: true,

                // 产品封面图片引用
                productCovers: true,

                // 产品详情 PDF 引用
                productPdfs: true,
              },
            },
          },
        }),

        prisma.mediaAsset.count({
          where,
        }),
      ]);

    const totalPages = Math.ceil(
      total / query.pageSize,
    );

    return ok({
      items: items.map((item) => {
        const totalUsage =
          item._count.advantages +
          item._count.applications +
          item._count.productCovers +
          item._count.productPdfs;

        return {
          id: item.id,
          type: item.type,
          url: item.url,
          relativePath: item.relativePath,
          filename: item.filename,
          originalName: item.originalName,
          mimeType: item.mimeType,
          size: item.size,
          checksum: item.checksum,
          width: item.width,
          height: item.height,
          alt: item.alt,
          enabled: item.enabled,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,

          usage: {
            advantages:
              item._count.advantages,

            applications:
              item._count.applications,

            productCovers:
              item._count.productCovers,

            productPdfs:
              item._count.productPdfs,

            total:
              totalUsage,
          },
        };
      }),

      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,

        hasNextPage:
          query.page < totalPages,

        hasPreviousPage:
          query.page > 1,
      },
    });
  } catch (error) {
    return fail(error);
  }
}