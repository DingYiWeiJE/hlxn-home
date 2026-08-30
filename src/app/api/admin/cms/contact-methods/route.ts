import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { ok, fail } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const contactMethodSchema = z.object({
  language: z.enum(["zh", "en"]),
  title: z.string().min(1, "联系方式标题不能为空"),
  value: z.string().min(1, "联系方式值不能为空"),
});

export async function POST(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const body = await request.json();
    const fields = contactMethodSchema.parse(body);

    const contactMethod = await prisma.cmsContactMethod.create({
      data: {
        language: fields.language,
        title: fields.title,
        value: fields.value,
      },
    });

    // 重置缓存
    revalidatePath("/api/cms/company-info");

    return ok(contactMethod, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language");

    let where: any = { deletedAt: null };
    if (language) {
      where.language = language;
    }

    const contactMethods = await prisma.cmsContactMethod.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return ok(contactMethods);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请指定联系方式 ID",
        400
      );
    }

    const body = await request.json();
    const fields = contactMethodSchema.parse(body);

    const existing = await prisma.cmsContactMethod.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(
        "NOT_FOUND",
        "联系方式不存在",
        404
      );
    }

    const updated = await prisma.cmsContactMethod.update({
      where: { id },
      data: {
        language: fields.language,
        title: fields.title,
        value: fields.value,
      },
    });

    // 重置缓存
    revalidatePath("/api/cms/company-info");

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "请指定联系方式 ID",
        400
      );
    }

    const existing = await prisma.cmsContactMethod.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(
        "NOT_FOUND",
        "联系方式不存在",
        404
      );
    }

    await prisma.cmsContactMethod.delete({
      where: { id },
    });

    // 重置缓存
    revalidatePath("/api/cms/company-info");

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
