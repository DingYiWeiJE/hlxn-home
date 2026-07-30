import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";

export async function validateApplicationCaseImage(
  imageAssetId: string,
): Promise<void> {
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
    throw new ApiError(
      "MEDIA_NOT_FOUND",
      "应用案例图片不存在",
      400,
    );
  }

  if (asset.type !== "IMAGE") {
    throw new ApiError(
      "INVALID_IMAGE",
      "应用案例图片类型不正确",
      400,
    );
  }

  if (asset.purpose !== "APPLICATION_CASE_IMAGE") {
    throw new ApiError(
      "VALIDATION_ERROR",
      "图片用途不正确",
      400,
      {
        imageAssetId: [
          "图片用途不正确",
        ],
      },
    );
  }

  if (!asset.enabled) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "图片已禁用",
      400,
      {
        imageAssetId: [
          "图片已禁用",
        ],
      },
    );
  }

  if (asset.deletedAt) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "图片已删除",
      400,
      {
        imageAssetId: [
          "图片已删除",
        ],
      },
    );
  }
}
