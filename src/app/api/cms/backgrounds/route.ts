import { ok, fail } from "@/lib/api/response";
import { getCmsBackgrounds } from "@/lib/cms/backgrounds";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await getCmsBackgrounds();

    return ok(result, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
