import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export async function validateCompanyHistoryImage(
  imageAssetId: string | null,
): Promise<void> {
  if (!imageAssetId) {
    return;
  }

  const asset = await prisma.mediaAsset.findUnique({
    where: { id: imageAssetId },
    select: {
      id: true,
      type: true,
      purpose: true,
      enabled: true,
      deletedAt: true,
    },
  });

  if (!asset) {
    throw new ApiError("MEDIA_NOT_FOUND", "公司发展历程图片不存在", 400, {
      imageAssetId: ["公司发展历程图片不存在"],
    });
  }

  if (asset.type !== "IMAGE") {
    throw new ApiError("INVALID_IMAGE", "公司发展历程图片类型不正确", 400, {
      imageAssetId: ["请选择图片素材"],
    });
  }

  if (asset.purpose !== "COMPANY_HISTORY_IMAGE") {
    throw new ApiError("VALIDATION_ERROR", "图片用途不正确", 400, {
      imageAssetId: ["只能选择公司发展历程图片"],
    });
  }

  if (!asset.enabled || asset.deletedAt) {
    throw new ApiError("VALIDATION_ERROR", "图片不可用", 400, {
      imageAssetId: ["图片已禁用或已删除"],
    });
  }
}
