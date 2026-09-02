import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { withMediaUrl } from "@/lib/media/asset-url";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withCache } from "@/lib/cache";

const querySchema = z.object({
  locale: z.enum(["zh", "en"]),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});

export async function GET(request: NextRequest) {
  try {
    const query = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const data = await withCache(
      "application-cases",
      query,
      async () => {
        const [items, total] =
          await prisma.$transaction([
            prisma.applicationCase.findMany({
              where: {
                locale: query.locale,
                deletedAt: null,
              },
              select: {
                id: true,
                title: true,
                slug: true,
                caseDate: true,
                contentParagraphs: true,
                imageAsset: {
                  select: {
                    id: true,
                    relativePath: true,
                    width: true,
                    height: true,
                    alt: true,
                  },
                },
              },
              orderBy: [
                { caseDate: "desc" },
                { createdAt: "desc" },
              ],
              skip: (query.page - 1) * query.pageSize,
              take: query.pageSize,
            }),
            prisma.applicationCase.count({
              where: {
                locale: query.locale,
                deletedAt: null,
              },
            }),
          ]);

        const totalPages = Math.ceil(
          total / query.pageSize,
        );

        return {
          items: items.map((item) => ({
            ...item,
            imageAsset: withMediaUrl(item.imageAsset),
          })),
          pagination: {
            page: query.page,
            pageSize: query.pageSize,
            total,
            totalPages,
            hasNextPage: query.page < totalPages,
            hasPreviousPage: query.page > 1,
          },
        };
      },
    );

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

