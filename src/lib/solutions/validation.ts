import { MediaAssetPurpose, MediaAssetType } from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

type ImageReference = {
  imageAssetId?: string | null;
};

export type SolutionReferenceInput = {
  coverImageAssetId?: string | null;
  workingPrincipleBackgroundAssetId?: string | null;
  usageScenarios?: ImageReference[];
  customerValues?: ImageReference[];
  requireWorkingPrincipleBackground?: boolean;
};

export async function validateSolutionReferences(
  input: SolutionReferenceInput,
): Promise<void> {
  await validateSingleImageAsset({
    assetId: input.coverImageAssetId,
    allowedPurposes: [MediaAssetPurpose.GENERAL],
    fieldName: "coverImageAssetId",
    errorMessage:
      "Cover image is invalid",
    required: false,
  });

  await validateSingleImageAsset({
    assetId: input.workingPrincipleBackgroundAssetId,
    allowedPurposes: [
      MediaAssetPurpose.SOLUTION_WORKING_PRINCIPLE_BACKGROUND,
    ],
    fieldName: "workingPrincipleBackgroundAssetId",
    errorMessage:
      "Working principle background image is invalid or has an incorrect purpose",
    required: input.requireWorkingPrincipleBackground === true,
  });

  await validateImageAssetList({
    items: input.usageScenarios,
    expectedPurpose: MediaAssetPurpose.SOLUTION_USAGE_SCENARIO,
    fieldName: "usageScenarios",
    errorMessage:
      "One or more usage scenario images are invalid or have an incorrect purpose",
  });

  await validateImageAssetList({
    items: input.customerValues,
    expectedPurpose: MediaAssetPurpose.SOLUTION_CUSTOMER_VALUE,
    fieldName: "customerValues",
    errorMessage:
      "One or more customer value images are invalid or have an incorrect purpose",
  });
}

async function validateSingleImageAsset({
  assetId,
  allowedPurposes,
  fieldName,
  errorMessage,
  required = false,
}: {
  assetId?: string | null;
  allowedPurposes: MediaAssetPurpose[];
  fieldName: string;
  errorMessage: string;
  required?: boolean;
}): Promise<void> {
  const normalizedAssetId = assetId?.trim();

  if (!normalizedAssetId) {
    if (required) {
      throw new ApiError("BAD_REQUEST", errorMessage, 400, {
        [fieldName]: [errorMessage],
      });
    }

    return;
  }

  const asset = await prisma.mediaAsset.findFirst({
    where: {
      id: normalizedAssetId,
      type: MediaAssetType.IMAGE,
      enabled: true,
      deletedAt: null,
      purpose: {
        in: allowedPurposes,
      },
    },
    select: {
      id: true,
    },
  });

  if (!asset) {
    throw new ApiError("BAD_REQUEST", errorMessage, 400, {
      [fieldName]: [errorMessage],
    });
  }
}

async function validateImageAssetList({
  items,
  expectedPurpose,
  fieldName,
  errorMessage,
}: {
  items?: ImageReference[];
  expectedPurpose: MediaAssetPurpose;
  fieldName: string;
  errorMessage: string;
}): Promise<void> {
  const assetIds = [
    ...new Set(
      (items ?? [])
        .map((item) => item.imageAssetId?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (assetIds.length === 0) {
    return;
  }

  const assets = await prisma.mediaAsset.findMany({
    where: {
      id: {
        in: assetIds,
      },
      type: MediaAssetType.IMAGE,
      enabled: true,
      deletedAt: null,
      purpose: expectedPurpose,
    },
    select: {
      id: true,
    },
  });

  const validAssetIds = new Set(assets.map((asset) => asset.id));

  if (assetIds.some((assetId) => !validAssetIds.has(assetId))) {
    throw new ApiError("BAD_REQUEST", errorMessage, 400, {
      [fieldName]: [errorMessage],
    });
  }
}
