import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { getCompanyHistoryByLocale } from "@/lib/company-history/queries";
import type { CompanyHistoryLocale } from "@/lib/company-history/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const locale = (request.nextUrl.searchParams.get("locale") || "zh") as CompanyHistoryLocale;

    if (!["zh", "en"].includes(locale)) {
      throw new Error("Invalid locale");
    }

    const data = await getCompanyHistoryByLocale(locale);

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
