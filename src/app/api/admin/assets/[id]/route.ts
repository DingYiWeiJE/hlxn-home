import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * 查询单个素材
 *
 * GET /api/admin/assets/:id
 */
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireAdminActor();

    const { id } = await context.params;

    const asset = await prisma.mediaAsset.findFirst({
      where: {
        id,
        deletedAt: null,
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

        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },

        _count: {
          select: {
            advantages: true,
            applications: true,
            productCovers: true,
            productIntroBackgrounds: true,
            productPdfs: true,
            newsCovers: true,
            solutionWorkingPrincipleBackgrounds: true,
            solutionUsageScenarios: true,
            solutionCustomerValues: true,
          },
        },
      },
    });

    if (!asset) {
      throw new ApiError(
        "MEDIA_NOT_FOUND",
        "素材不存在",
        404,
      );
    }

    const totalUsage =
      asset._count.advantages +
      asset._count.applications +
      asset._count.productCovers +
      asset._count.productIntroBackgrounds +
      asset._count.productPdfs +
      asset._count.newsCovers +
      asset._count.solutionWorkingPrincipleBackgrounds +
      asset._count.solutionUsageScenarios +
      asset._count.solutionCustomerValues;

    return ok({
      id: asset.id,
      type: asset.type,
      url: asset.url,
      relativePath: asset.relativePath,
      filename: asset.filename,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      size: asset.size,
      checksum: asset.checksum,
      width: asset.width,
      height: asset.height,
      alt: asset.alt,
      enabled: asset.enabled,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
      createdBy: asset.createdBy,

      usage: {
        advantages:
          asset._count.advantages,

        applications:
          asset._count.applications,

        productCovers:
          asset._count.productCovers,

        productIntroBackgrounds:
          asset._count.productIntroBackgrounds,

        productPdfs:
          asset._count.productPdfs,

        newsCovers:
          asset._count.newsCovers,

        solutionWorkingPrincipleBackgrounds:
          asset._count.solutionWorkingPrincipleBackgrounds,

        solutionUsageScenarios:
          asset._count.solutionUsageScenarios,

        solutionCustomerValues:
          asset._count.solutionCustomerValues,

        total: totalUsage,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * 删除素材
 *
 * DELETE /api/admin/assets/:id
 *
 * 当前采用软删除：
 * - enabled 设置为 false；
 * - deletedAt 写入删除时间；
 * - 文件暂时保留在磁盘。
 *
 * 后续可以增加定期清理任务，在再次确认没有引用后，
 * 再从服务器硬盘物理删除文件。
 */
export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } = await context.params;

    const asset = await prisma.mediaAsset.findFirst({
      where: {
        id,
        deletedAt: null,
      },

      select: {
        id: true,
        type: true,
        originalName: true,

        _count: {
          select: {
            advantages: true,
            applications: true,
            productCovers: true,
            productIntroBackgrounds: true,
            productPdfs: true,
            newsCovers: true,
            solutionWorkingPrincipleBackgrounds: true,
            solutionUsageScenarios: true,
            solutionCustomerValues: true,
          },
        },
      },
    });

    if (!asset) {
      throw new ApiError(
        "MEDIA_NOT_FOUND",
        "素材不存在",
        404,
      );
    }

    const usage = {
      advantages:
        asset._count.advantages,

      applications:
        asset._count.applications,

      productCovers:
        asset._count.productCovers,

      productIntroBackgrounds:
        asset._count.productIntroBackgrounds,

      productPdfs:
        asset._count.productPdfs,

      newsCovers:
        asset._count.newsCovers,

      solutionWorkingPrincipleBackgrounds:
        asset._count.solutionWorkingPrincipleBackgrounds,

      solutionUsageScenarios:
        asset._count.solutionUsageScenarios,

      solutionCustomerValues:
        asset._count.solutionCustomerValues,
    };

    const totalUsage =
      usage.advantages +
      usage.applications +
      usage.productCovers +
      usage.productIntroBackgrounds +
      usage.productPdfs +
      usage.newsCovers +
      usage.solutionWorkingPrincipleBackgrounds +
      usage.solutionUsageScenarios +
      usage.solutionCustomerValues;

    if (totalUsage > 0) {
      const usageDescriptions: string[] = [];

      if (usage.productCovers > 0) {
        usageDescriptions.push(
          `${usage.productCovers} 个产品封面`,
        );
      }

      if (usage.productIntroBackgrounds > 0) {
        usageDescriptions.push(
          `${usage.productIntroBackgrounds} 个产品介绍背景图`,
        );
      }

      if (usage.advantages > 0) {
        usageDescriptions.push(
          `${usage.advantages} 个产品优势`,
        );
      }

      if (usage.applications > 0) {
        usageDescriptions.push(
          `${usage.applications} 个应用场景`,
        );
      }

      if (usage.productPdfs > 0) {
        usageDescriptions.push(
          `${usage.productPdfs} 个产品 PDF`,
        );
      }

      if (usage.newsCovers > 0) {
        usageDescriptions.push(
          `${usage.newsCovers} 个新闻封面`,
        );
      }

      if (usage.solutionWorkingPrincipleBackgrounds > 0) {
        usageDescriptions.push(
          `${usage.solutionWorkingPrincipleBackgrounds} 个解决方案工作原理背景图`,
        );
      }

      if (usage.solutionUsageScenarios > 0) {
        usageDescriptions.push(
          `${usage.solutionUsageScenarios} 个解决方案使用场景`,
        );
      }

      if (usage.solutionCustomerValues > 0) {
        usageDescriptions.push(
          `${usage.solutionCustomerValues} 个解决方案客户价值`,
        );
      }

      throw new ApiError(
        "BAD_REQUEST",
        `该素材正在被${usageDescriptions.join("、")}使用，无法删除`,
        409,
      );
    }

    const deletedAt = new Date();

    await prisma.mediaAsset.update({
      where: {
        id,
      },

      data: {
        enabled: false,
        deletedAt,
      },
    });

    return ok({
      id,
      type: asset.type,
      originalName: asset.originalName,
      deleted: true,
      deletedAt,
    });
  } catch (error) {
    return fail(error);
  }
}
