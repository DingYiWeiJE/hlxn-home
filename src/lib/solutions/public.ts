import "server-only";

import {
  MediaAssetType,
  Prisma,
  SolutionLocale,
  SolutionStatus,
} from "@prisma/client";

import { buildMediaUrl } from "@/lib/media/asset-url";
import { prisma } from "@/lib/prisma";
import type { publicSolutionListQuerySchema } from "@/lib/solutions/schemas";
import type { z } from "zod";

export type SolutionImage = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
};

export type PublicSolutionListItem = {
  id: string;
  locale: SolutionLocale;
  title: string;
  subtitle: string | null;
  slug: string;
  summaryParagraphs: unknown;
  highlights: unknown;
  workingPrincipleBackgroundImage: SolutionImage | null;
  publishedAt: Date | null;
  detailUrl: string;
};

export type PublicSolutionDetail = PublicSolutionListItem & {
  translationKey: string | null;
  coverImage: SolutionImage | null;
  workingPrincipleParagraphs: unknown;
  systemCompositionParagraphs: unknown;
  usageScenarios: Array<{
    id: string;
    title: string;
    detailParagraphs: unknown;
    sortOrder: number;
    image: SolutionImage;
  }>;
  customerValues: Array<{
    id: string;
    title: string;
    detailParagraphs: unknown;
    sortOrder: number;
    image: SolutionImage;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicSolutionListQuery = z.infer<
  typeof publicSolutionListQuerySchema
>;

const imageSelect = {
  id: true,
  type: true,
  relativePath: true,
  width: true,
  height: true,
  alt: true,
  enabled: true,
  deletedAt: true,
} satisfies Prisma.MediaAssetSelect;

function formatImage(
  image: {
    id: string;
    type: MediaAssetType;
    relativePath: string;
    width: number | null;
    height: number | null;
    alt: string | null;
    enabled: boolean;
    deletedAt: Date | null;
  } | null,
): SolutionImage | null {
  if (
    !image ||
    image.type !== MediaAssetType.IMAGE ||
    !image.enabled ||
    image.deletedAt !== null
  ) {
    return null;
  }

  return {
    id: image.id,
    url: buildMediaUrl(image.relativePath),
    width: image.width,
    height: image.height,
    alt: image.alt,
  };
}

export async function getPublicSolutions(query: PublicSolutionListQuery) {
  const locale = query.locale as SolutionLocale;

  const where: Prisma.SolutionWhereInput = {
    locale,
    status: SolutionStatus.PUBLISHED,
    deletedAt: null,
    ...(query.keyword
      ? {
          OR: [
            {
              title: {
                contains: query.keyword,
                mode: "insensitive",
              },
            },
            {
              subtitle: {
                contains: query.keyword,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: query.keyword,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.solution.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          publishedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      select: {
        id: true,
        locale: true,
        title: true,
        subtitle: true,
        slug: true,
        summaryParagraphs: true,
        highlights: true,
        publishedAt: true,
        workingPrincipleBackgroundAsset: {
          select: imageSelect,
        },
      },
    }),
    prisma.solution.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / query.pageSize);

  return {
    locale,
    items: items.map(
      (item): PublicSolutionListItem => ({
        id: item.id,
        locale: item.locale,
        title: item.title,
        subtitle: item.subtitle,
        slug: item.slug,
        summaryParagraphs: item.summaryParagraphs,
        highlights: item.highlights,
        workingPrincipleBackgroundImage: formatImage(
          item.workingPrincipleBackgroundAsset,
        ),
        publishedAt: item.publishedAt,
        detailUrl: `/${item.locale}/solutions/${item.slug}`,
      }),
    ),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1,
    },
  };
}

const detailSelect = {
  id: true,
  locale: true,
  title: true,
  subtitle: true,
  slug: true,
  translationKey: true,
  summaryParagraphs: true,
  highlights: true,
  workingPrincipleParagraphs: true,
  systemCompositionParagraphs: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  coverImageAsset: {
    select: imageSelect,
  },
  workingPrincipleBackgroundAsset: {
    select: imageSelect,
  },
  usageScenarios: {
    where: {
      imageAsset: {
        is: {
          type: MediaAssetType.IMAGE,
          enabled: true,
          deletedAt: null,
        },
      },
    },
    orderBy: [
      {
        sortOrder: "asc" as const,
      },
      {
        createdAt: "asc" as const,
      },
    ],
    select: {
      id: true,
      title: true,
      detailParagraphs: true,
      sortOrder: true,
      imageAsset: {
        select: imageSelect,
      },
    },
  },
  customerValues: {
    where: {
      imageAsset: {
        is: {
          type: MediaAssetType.IMAGE,
          enabled: true,
          deletedAt: null,
        },
      },
    },
    orderBy: [
      {
        sortOrder: "asc" as const,
      },
      {
        createdAt: "asc" as const,
      },
    ],
    select: {
      id: true,
      title: true,
      detailParagraphs: true,
      sortOrder: true,
      imageAsset: {
        select: imageSelect,
      },
    },
  },
} satisfies Prisma.SolutionSelect;

type SolutionDetailPayload = Prisma.SolutionGetPayload<{
  select: typeof detailSelect;
}>;

function formatSolutionDetail(
  solution: SolutionDetailPayload,
): PublicSolutionDetail | null {
  const workingPrincipleBackgroundImage = formatImage(
    solution.workingPrincipleBackgroundAsset,
  );
  const coverImage = formatImage(solution.coverImageAsset);

  return {
    id: solution.id,
    locale: solution.locale,
    title: solution.title,
    subtitle: solution.subtitle,
    slug: solution.slug,
    translationKey: solution.translationKey,
    summaryParagraphs: solution.summaryParagraphs,
    highlights: solution.highlights,
    workingPrincipleParagraphs: solution.workingPrincipleParagraphs,
    workingPrincipleBackgroundImage,
    coverImage,
    systemCompositionParagraphs: solution.systemCompositionParagraphs,
    usageScenarios: solution.usageScenarios
      .map((item) => {
        const image = formatImage(item.imageAsset);

        return image
          ? {
              id: item.id,
              title: item.title,
              detailParagraphs: item.detailParagraphs,
              sortOrder: item.sortOrder,
              image,
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
    customerValues: solution.customerValues
      .map((item) => {
        const image = formatImage(item.imageAsset);

        return image
          ? {
              id: item.id,
              title: item.title,
              detailParagraphs: item.detailParagraphs,
              sortOrder: item.sortOrder,
              image,
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
    publishedAt: solution.publishedAt,
    createdAt: solution.createdAt,
    updatedAt: solution.updatedAt,
    detailUrl: `/${solution.locale}/solutions/${solution.slug}`,
  };
}

export async function getPublicSolutionDetail({
  locale,
  slug,
}: {
  locale: SolutionLocale;
  slug: string;
}): Promise<PublicSolutionDetail | null> {
  const solution = await prisma.solution.findFirst({
    where: {
      locale,
      slug,
      status: SolutionStatus.PUBLISHED,
      deletedAt: null,
    },
    select: detailSelect,
  });

  if (!solution) {
    return null;
  }

  return formatSolutionDetail(solution);
}

export async function resolveSolutionLocaleSwitchUrls({
  locale,
  slug,
}: {
  locale: SolutionLocale;
  slug: string;
}): Promise<Record<SolutionLocale, string>> {
  const current = await prisma.solution.findFirst({
    where: {
      locale,
      slug,
      status: SolutionStatus.PUBLISHED,
      deletedAt: null,
    },
    select: {
      locale: true,
      slug: true,
      translationKey: true,
    },
  });

  const fallback = {
    zh: "/zh/solutions",
    en: "/en/solutions",
  };

  if (!current) {
    return fallback;
  }

  const urls: Record<SolutionLocale, string> = {
    zh: current.locale === "zh" ? `/zh/solutions/${current.slug}` : fallback.zh,
    en: current.locale === "en" ? `/en/solutions/${current.slug}` : fallback.en,
  };

  if (!current.translationKey) {
    return urls;
  }

  const translations = await prisma.solution.findMany({
    where: {
      translationKey: current.translationKey,
      status: SolutionStatus.PUBLISHED,
      deletedAt: null,
    },
    select: {
      locale: true,
      slug: true,
    },
  });

  for (const item of translations) {
    urls[item.locale] = `/${item.locale}/solutions/${item.slug}`;
  }

  return urls;
}
