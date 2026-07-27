import { z } from "zod";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { uploadImage, uploadPdf } from "@/lib/media/upload";

export const runtime = "nodejs";

const formSchema = z.object({
  type: z.enum(["IMAGE", "PDF"], {
    message: "请选择正确的文件类型",
  }),
  alt: z
    .string()
    .trim()
    .max(200, "图片替代文本不能超过 200 个字符")
    .optional()
    .nullable(),
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
        "请选择需要上传的文件",
        400,
        {
          file: ["请选择需要上传的文件"],
        },
      );
    }

    const fields = formSchema.parse({
      type: formData.get("type"),
      alt: formData.get("alt"),
    });

    if (fields.type === "IMAGE") {
      const image = await uploadImage(file, {
        scope: "products",
        alt: fields.alt,
        createdById: actor.userId,
      });

      return ok(image, {
        status: 201,
      });
    }

    const pdf = await uploadPdf(file, {
      scope: "products",
      createdById: actor.userId,
    });

    return ok(pdf, {
      status: 201,
    });
  } catch (error) {
    return fail(error);
  }
}