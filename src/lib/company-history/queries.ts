import "server-only";

import { CompanyHistoryLocale as PrismaCompanyHistoryLocale } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CompanyHistoryLocale, CompanyHistoryPublicItem } from "./types";

export async function getCompanyHistoryByLocale(
  locale: CompanyHistoryLocale,
): Promise<CompanyHistoryPublicItem[]> {
  const years = await prisma.companyHistoryYear.findMany({
    where: {
      locale: locale as PrismaCompanyHistoryLocale,
      deletedAt: null,
    },
    orderBy: [
      { sortDate: "asc" },
      { sortOrder: "asc" },
    ],
    select: {
      id: true,
      year: true,
      events: {
        where: {
          deletedAt: null,
        },
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "asc" },
        ],
        select: {
          time: true,
          content: true,
          imageAsset: {
            select: {
              id: true,
              type: true,
              purpose: true,
              enabled: true,
              deletedAt: true,
              url: true,
            },
          },
        },
      },
    },
  });

  return years.map((year) => ({
    year: year.year,
    events: year.events
      .map((event) => {
        const imageUrl =
          event.imageAsset &&
          event.imageAsset.type === "IMAGE" &&
          event.imageAsset.purpose === "COMPANY_HISTORY_IMAGE" &&
          event.imageAsset.enabled &&
          event.imageAsset.deletedAt === null
            ? event.imageAsset.url
            : null;

        return {
          time: event.time,
          content: event.content,
          image: imageUrl,
        };
      })
      .filter((event) => event.content.trim()), // Filter out empty events
  }));
}
