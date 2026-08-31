import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { getCompanyHistoryByLocale } from "@/lib/company-history/queries";
import type { CompanyHistoryLocale } from "@/lib/company-history/types";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const locale = (request.nextUrl.searchParams.get("locale") || "zh") as CompanyHistoryLocale;

    if (!["zh", "en"].includes(locale)) {
      throw new Error("Invalid locale");
    }

    const data = await withCache(
      "company-history",
      { locale },
      () => getCompanyHistoryByLocale(locale),
    );

    return ok(data, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
