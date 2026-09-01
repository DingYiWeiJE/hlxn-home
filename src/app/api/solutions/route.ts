import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/response";
import { getPublicSolutions } from "@/lib/solutions/public";
import { publicSolutionListQuerySchema } from "@/lib/solutions/schemas";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const query = publicSolutionListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const data = await withCache(
      "solutions",
      query,
      () => getPublicSolutions(query),
    );

    return ok(data, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
