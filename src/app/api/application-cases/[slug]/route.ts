import { fail, ok } from "@/lib/api/response";
import { withMediaUrl } from "@/lib/media/asset-url";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { NextRequest } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  locale: z.enum(["zh", "en"]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const query = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const applicationCase =
      await prisma.applicationCase.findFirst({
        where: {
          slug,
          locale: query.locale,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          locale: true,
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
          createdAt: true,
        },
      });

    if (!applicationCase) {
      throw new ApiError(
        "NOT_FOUND",
        "应用案例不存在",
        404,
      );
    }

    return ok({
      ...applicationCase,
      imageAsset: withMediaUrl(applicationCase.imageAsset),
    });
  } catch (error) {
    return fail(error);
  }
}
