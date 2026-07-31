import { ApiError } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

export const runtime = "nodejs";

export async function POST() {
  return fail(new ApiError("BAD_REQUEST", "Legacy admin authentication has been removed", 410));
}
