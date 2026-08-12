import { z } from "zod";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { uploadImage } from "@/lib/media/upload";

export const runtime = "nodejs";

const formSchema = z.object({
  alt: z.string().trim().max(200).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const actor = await requireAdminActor();
    assertSameOriginRequest(request);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请选择图片文件",
        400,
        { file: ["请选择图片文件"] },
      );
    }

    const fields = formSchema.parse({
      alt: formData.get("alt"),
    });

    const image = await uploadImage(file, {
      scope: "news",
      alt: fields.alt,
      createdById: actor.userId,
    });

    return ok(image, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
