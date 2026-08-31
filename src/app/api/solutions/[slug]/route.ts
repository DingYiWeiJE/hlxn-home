import { SolutionLocale } from "@prisma/client";
import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { getPublicSolutionDetail } from "@/lib/solutions/public";
import { publicSolutionDetailQuerySchema } from "@/lib/solutions/schemas";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const query = publicSolutionDetailQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const { slug } = await context.params;
    const normalizedSlug = decodeURIComponent(slug).trim();

    if (!normalizedSlug) {
      throw new ApiError("NOT_FOUND", "Solution not found", 404);
    }

    const locale = query.locale as SolutionLocale;

    const solution = await withCache(
      "solutions",
      { slug: normalizedSlug, locale },
      async () => {
        const result = await getPublicSolutionDetail({
          locale,
          slug: normalizedSlug,
        });

        if (!result) {
          throw new ApiError(
            "NOT_FOUND",
            "Solution does not exist or has not been published",
            404,
          );
        }

        return result;
      },
    );

    return ok(solution, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
