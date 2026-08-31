import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { buildMediaUrl } from "@/lib/media/asset-url";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const usageCountSelect = {
  advantages: true,
  applications: true,
  productCovers: true,
  productIntroBackgrounds: true,
  productPdfs: true,
  newsCovers: true,
  applicationCaseImages: true,
  companyHistoryImages: true,
  solutionWorkingPrincipleBackgrounds: true,
  solutionUsageScenarios: true,
  solutionCustomerValues: true,
} as const;

function getTotalUsage(counts: Record<keyof typeof usageCountSelect, number>) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

export async function GET(_request: Request, context: RouteContext) {
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
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: usageCountSelect,
        },
      },
    });

    if (!asset) {
      throw new ApiError("MEDIA_NOT_FOUND", "素材不存在", 404);
    }

    return ok({
      id: asset.id,
      type: asset.type,
      purpose: asset.purpose,
      url: buildMediaUrl(asset.relativePath),
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
        ...asset._count,
        total: getTotalUsage(asset._count),
      },
    });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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
          select: usageCountSelect,
        },
      },
    });

    if (!asset) {
      throw new ApiError("MEDIA_NOT_FOUND", "素材不存在", 404);
    }

    const totalUsage = getTotalUsage(asset._count);

    if (totalUsage > 0) {
      const labels: Array<[keyof typeof usageCountSelect, string]> = [
        ["productCovers", "产品封面"],
        ["productIntroBackgrounds", "产品介绍背景图"],
        ["advantages", "产品优势图"],
        ["applications", "产品应用场景图"],
        ["productPdfs", "产品 PDF"],
        ["newsCovers", "新闻封面"],
        ["applicationCaseImages", "应用案例图片"],
        ["companyHistoryImages", "公司发展历程图片"],
        ["solutionWorkingPrincipleBackgrounds", "解决方案工作原理背景图"],
        ["solutionUsageScenarios", "解决方案使用场景图"],
        ["solutionCustomerValues", "解决方案客户价值图"],
      ];

      const usageDescriptions = labels
        .filter(([key]) => asset._count[key] > 0)
        .map(([key, label]) => `${asset._count[key]} 个${label}`);

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
