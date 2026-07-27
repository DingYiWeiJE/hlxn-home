import {
  CategoryLevel,
  MediaAssetType,
} from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

type ProductImageReference = {
  assetId: string;
};

export type ProductReferenceInput = {
  secondaryCategoryId?: string;

  coverImageAssetId?: string | null;

  advantages?: ProductImageReference[];

  applications?: ProductImageReference[];

  detailPdfAssetId?: string | null;
};

/**
 * 校验产品关联的分类、封面图片、内容图片和 PDF。
 *
 * 产品优势和应用场景中的标题属于当前产品，
 * 不保存在 MediaAsset 中。
 */
export async function validateProductReferences(
  input: ProductReferenceInput,
): Promise<void> {
  await validateSecondaryCategory(
    input.secondaryCategoryId,
  );

  await validateImageAssets(
    [
      input.coverImageAssetId,
      ...(input.advantages ?? []).map(
        (item) => item.assetId,
      ),
      ...(input.applications ?? []).map(
        (item) => item.assetId,
      ),
    ],
    input.coverImageAssetId,
  );

  await validatePdfAsset(
    input.detailPdfAssetId,
  );
}

async function validateSecondaryCategory(
  secondaryCategoryId?: string,
): Promise<void> {
  if (!secondaryCategoryId) {
    return;
  }

  const category =
    await prisma.category.findFirst({
      where: {
        id: secondaryCategoryId,
        level: CategoryLevel.LEVEL_TWO,
        enabled: true,
        deletedAt: null,

        parent: {
          is: {
            level: CategoryLevel.LEVEL_ONE,
            enabled: true,
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
      },
    });

  if (!category) {
    throw new ApiError(
      "BAD_REQUEST",
      "请选择有效的二级产品分类",
      400,
      {
        secondaryCategoryId: [
          "请选择有效的二级产品分类",
        ],
      },
    );
  }
}

async function validateImageAssets(
  assetIds: Array<string | null | undefined>,
  coverImageAssetId?: string | null,
): Promise<void> {
  const uniqueAssetIds = [
    ...new Set(
      assetIds
        .map((assetId) => assetId?.trim())
        .filter(
          (assetId): assetId is string =>
            Boolean(assetId),
        ),
    ),
  ];

  if (uniqueAssetIds.length === 0) {
    return;
  }

  const existingAssets =
    await prisma.mediaAsset.findMany({
      where: {
        id: {
          in: uniqueAssetIds,
        },
        type: MediaAssetType.IMAGE,
        enabled: true,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

  const existingAssetIds = new Set(
    existingAssets.map((asset) => asset.id),
  );

  if (
    coverImageAssetId &&
    !existingAssetIds.has(coverImageAssetId)
  ) {
    throw new ApiError(
      "BAD_REQUEST",
      "产品封面图片不存在、已停用或文件类型不正确",
      400,
      {
        coverImageAssetId: [
          "产品封面图片不存在、已停用或文件类型不正确",
        ],
      },
    );
  }

  const invalidAssetIds =
    uniqueAssetIds.filter(
      (assetId) =>
        !existingAssetIds.has(assetId),
    );

  if (invalidAssetIds.length > 0) {
    throw new ApiError(
      "BAD_REQUEST",
      "部分产品图片不存在、已停用或文件类型不正确",
      400,
      {
        assets: [
          "部分产品图片不存在、已停用或文件类型不正确",
        ],
      },
    );
  }
}

async function validatePdfAsset(
  detailPdfAssetId?: string | null,
): Promise<void> {
  if (!detailPdfAssetId) {
    return;
  }

  const asset =
    await prisma.mediaAsset.findFirst({
      where: {
        id: detailPdfAssetId,
        type: MediaAssetType.PDF,
        enabled: true,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

  if (!asset) {
    throw new ApiError(
      "BAD_REQUEST",
      "产品详情 PDF 不存在、已停用或文件类型不正确",
      400,
      {
        detailPdfAssetId: [
          "产品详情 PDF 不存在、已停用或文件类型不正确",
        ],
      },
    );
  }
}