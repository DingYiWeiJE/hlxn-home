import "server-only";

import { CompanyHistoryLocale as PrismaCompanyHistoryLocale } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CompanyHistoryLocale, CompanyHistoryPublicItem } from "./types";

function normalizeParagraphs(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export async function getCompanyHistoryByLocale(
  locale: CompanyHistoryLocale,
): Promise<CompanyHistoryPublicItem[]> {
  const items = await prisma.companyHistoryItem.findMany({
    where: {
      locale: locale as PrismaCompanyHistoryLocale,
    },
    orderBy: [
      { sortDate: "asc" },
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
    select: {
      id: true,
      displayTime: true,
      title: true,
      detailParagraphs: true,
      imageAsset: {
        select: {
          id: true,
          type: true,
          purpose: true,
          enabled: true,
          deletedAt: true,
          url: true,
          width: true,
          height: true,
          alt: true,
        },
      },
    },
  });

  return items.map((item) => {
    const imageAsset =
      item.imageAsset &&
      item.imageAsset.type === "IMAGE" &&
      item.imageAsset.purpose === "COMPANY_HISTORY_IMAGE" &&
      item.imageAsset.enabled &&
      item.imageAsset.deletedAt === null
        ? {
            id: item.imageAsset.id,
            url: item.imageAsset.url,
            width: item.imageAsset.width,
            height: item.imageAsset.height,
            alt: item.imageAsset.alt,
          }
        : null;

    return {
      id: item.id,
      displayTime: item.displayTime,
      title: item.title,
      detailParagraphs: normalizeParagraphs(item.detailParagraphs),
      imageAsset,
    };
  });
}
