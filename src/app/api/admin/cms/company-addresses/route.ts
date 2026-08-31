import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { ok, fail } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { revalidatePath } from "next/cache";
import { clearCacheByNamespace } from "@/lib/cache";

export const runtime = "nodejs";

const companyAddressSchema = z.object({
  language: z.enum(["zh", "en"]),
  address: z.string().min(1, "公司地址不能为空"),
});

export async function POST(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const body = await request.json();
    const fields = companyAddressSchema.parse(body);

    // 检查该语言的地址是否已存在
    const existing = await prisma.cmsCompanyAddress.findUnique({
      where: { language: fields.language },
    });

    if (existing) {
      throw new ApiError(
        "CONFLICT",
        `${fields.language === "zh" ? "中文" : "英文"}公司地址已存在，请更新而不是新增`,
        409
      );
    }

    const address = await prisma.cmsCompanyAddress.create({
      data: {
        language: fields.language,
        address: fields.address,
      },
    });

    // 重置缓存
    revalidatePath("/api/cms/company-info");
    clearCacheByNamespace("cms-company-info");

    return ok(address, { status: 201 });
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

    const addresses = await prisma.cmsCompanyAddress.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return ok(addresses);
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
        "请指定公司地址 ID",
        400
      );
    }

    const body = await request.json();
    const fields = companyAddressSchema.parse(body);

    const existing = await prisma.cmsCompanyAddress.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(
        "NOT_FOUND",
        "公司地址不存在",
        404
      );
    }

    const updated = await prisma.cmsCompanyAddress.update({
      where: { id },
      data: {
        language: fields.language,
        address: fields.address,
      },
    });

    // 重置缓存
    revalidatePath("/api/cms/company-info");
    clearCacheByNamespace("cms-company-info");

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
        "请指定公司地址 ID",
        400
      );
    }

    const existing = await prisma.cmsCompanyAddress.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(
        "NOT_FOUND",
        "公司地址不存在",
        404
      );
    }

    await prisma.cmsCompanyAddress.delete({
      where: { id },
    });

    // 重置缓存
    revalidatePath("/api/cms/company-info");
    clearCacheByNamespace("cms-company-info");

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
