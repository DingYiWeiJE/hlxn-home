import {
  CategoryLevel,
  MediaAssetPurpose,
  MediaAssetType,
} from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

type ProductImageReference = {
  assetId: string;
};

export type ProductReferenceInput = {
  secondaryCategoryId?: string;

  coverImageAssetId?:
    | string
    | null;

  introBackgroundImageAssetId?:
    | string
    | null;

  advantages?:
    ProductImageReference[];

  applications?:
    ProductImageReference[];

  detailPdfAssetId?:
    | string
    | null;
};

/**
 * 校验产品关联的分类、图片和 PDF。
 *
 * 图片用途：
 * - 产品封面：PRODUCT_COVER
 * - 产品介绍背景：PRODUCT_INTRO_BACKGROUND
 * - 产品优势/应用场景（共用图库）：PRODUCT_ADVANTAGE, PRODUCT_APPLICATION
 *
 * 注意：产品优势和应用场景图片共用一个图库资源，两个字段可以引用相同的图片素材。
 * GENERAL 仅用于兼容迁移前已经上传的历史素材。
 */
export async function validateProductReferences(
  input: ProductReferenceInput,
): Promise<void> {
  /*
   * 各项引用校验彼此独立，且大多是远程数据库查询。
   * 使用 Promise.all 并发执行，避免逐条 await 累加网络往返延迟。
   * 任意一项校验失败都会抛出 ApiError，Promise.all 会立即拒绝。
   */
  await Promise.all([
    validateSecondaryCategory(
      input.secondaryCategoryId,
    ),

    validateSingleImageAsset({
      assetId:
        input.coverImageAssetId,

      expectedPurpose:
        MediaAssetPurpose.PRODUCT_COVER,

      fieldName:
        "coverImageAssetId",

      errorMessage:
        "产品封面图片不存在、已停用、文件类型不正确或素材用途不匹配",
    }),

    validateSingleImageAsset({
      assetId:
        input.introBackgroundImageAssetId,

      expectedPurpose:
        MediaAssetPurpose
          .PRODUCT_INTRO_BACKGROUND,

      fieldName:
        "introBackgroundImageAssetId",

      errorMessage:
        "产品介绍背景图不存在、已停用、文件类型不正确或素材用途不匹配",
    }),

    validateImageAssetList({
      items:
        input.advantages,

      expectedPurposes: [
        MediaAssetPurpose
          .PRODUCT_ADVANTAGE,
        MediaAssetPurpose
          .PRODUCT_APPLICATION,
      ],

      fieldName:
        "advantages",

      errorMessage:
        "部分产品优势图片不存在、已停用、文件类型不正确或素材用途不匹配",
    }),

    validateImageAssetList({
      items:
        input.applications,

      expectedPurposes: [
        MediaAssetPurpose
          .PRODUCT_ADVANTAGE,
        MediaAssetPurpose
          .PRODUCT_APPLICATION,
      ],

      fieldName:
        "applications",

      errorMessage:
        "部分应用场景图片不存在、已停用、文件类型不正确或素材用途不匹配",
    }),

    validatePdfAsset(
      input.detailPdfAssetId,
    ),
  ]);
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

        level:
          CategoryLevel.LEVEL_TWO,

        enabled: true,
        deletedAt: null,

        parent: {
          is: {
            level:
              CategoryLevel.LEVEL_ONE,

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

async function validateSingleImageAsset({
  assetId,
  expectedPurpose,
  fieldName,
  errorMessage,
}: {
  assetId?:
    | string
    | null;

  expectedPurpose:
    MediaAssetPurpose;

  fieldName: string;
  errorMessage: string;
}): Promise<void> {
  const normalizedAssetId =
    assetId?.trim();

  if (!normalizedAssetId) {
    return;
  }

  const asset =
    await prisma.mediaAsset.findFirst({
      where: {
        id: normalizedAssetId,

        type:
          MediaAssetType.IMAGE,

        enabled: true,
        deletedAt: null,

        /*
         * GENERAL 用于兼容迁移前的旧素材。
         * 新上传素材必须使用对应的业务用途。
         */
        purpose: {
          in: [
            expectedPurpose,
            MediaAssetPurpose.GENERAL,
          ],
        },
      },

      select: {
        id: true,
      },
    });

  if (!asset) {
    throw new ApiError(
      "BAD_REQUEST",
      errorMessage,
      400,
      {
        [fieldName]: [
          errorMessage,
        ],
      },
    );
  }
}

async function validateImageAssetList({
  items,
  expectedPurposes,
  fieldName,
  errorMessage,
}: {
  items?:
    ProductImageReference[];

  expectedPurposes:
    MediaAssetPurpose[];

  fieldName: string;
  errorMessage: string;
}): Promise<void> {
  const assetIds = [
    ...new Set(
      (items ?? [])
        .map((item) =>
          item.assetId.trim(),
        )
        .filter(Boolean),
    ),
  ];

  if (
    assetIds.length === 0
  ) {
    return;
  }

  const assets =
    await prisma.mediaAsset.findMany({
      where: {
        id: {
          in: assetIds,
        },

        type:
          MediaAssetType.IMAGE,

        enabled: true,
        deletedAt: null,

        purpose: {
          in: [
            ...expectedPurposes,
            MediaAssetPurpose.GENERAL,
          ],
        },
      },

      select: {
        id: true,
      },
    });

  const validAssetIds =
    new Set(
      assets.map(
        (asset) => asset.id,
      ),
    );

  const hasInvalidAsset =
    assetIds.some(
      (assetId) =>
        !validAssetIds.has(
          assetId,
        ),
    );

  if (hasInvalidAsset) {
    throw new ApiError(
      "BAD_REQUEST",
      errorMessage,
      400,
      {
        [fieldName]: [
          errorMessage,
        ],
      },
    );
  }
}

async function validatePdfAsset(
  detailPdfAssetId?:
    | string
    | null,
): Promise<void> {
  const normalizedAssetId =
    detailPdfAssetId?.trim();

  if (!normalizedAssetId) {
    return;
  }

  const asset =
    await prisma.mediaAsset.findFirst({
      where: {
        id:
          normalizedAssetId,

        type:
          MediaAssetType.PDF,

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