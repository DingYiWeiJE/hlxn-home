import { NextRequest } from "next/server";
import { StrategicLocationStatus } from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { publicStrategicLocationQuerySchema } from "@/lib/strategic/schemas";
import { serializePublicStrategicLocation } from "@/lib/strategic/serialize";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const query = publicStrategicLocationQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const data = await withCache(
      "strategic-locations",
      query,
      async () => {
        const items = await prisma.strategicLocation.findMany({
          where: {
            status: StrategicLocationStatus.PUBLISHED,
            enabled: true,
            deletedAt: null,
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });

        return {
          items: items.map((item) =>
            serializePublicStrategicLocation(item, query.locale),
          ),
        };
      },
      10 * 60 * 1000,
    );

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

