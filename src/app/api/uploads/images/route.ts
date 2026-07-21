import { z } from "zod";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdmin } from "@/lib/admin-auth/require-admin";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { processUploadedImage } from "@/lib/media/upload";

export const runtime = "nodejs";

const formSchema = z.object({
  alt: z.string().trim().max(200).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    assertSameOriginRequest(request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError("VALIDATION_ERROR", "请选择图片文件", 400, { file: ["请选择图片文件"] });
    }

    const fields = formSchema.parse({ alt: formData.get("alt") });
    const image = await processUploadedImage(file, fields.alt);
    return ok(image, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
