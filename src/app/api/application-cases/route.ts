import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
                url: true,
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

    return ok({
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
