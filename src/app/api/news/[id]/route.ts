import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdmin } from "@/lib/admin-auth/require-admin";
import { prisma } from "@/lib/prisma";
import { newsPatchSchema } from "@/lib/news/schemas";
import { ensureUniqueSlug } from "@/lib/news/slug";
import { extractTextFromTiptapJson } from "@/lib/news/tiptap";
import { revalidateNewsCache } from "@/lib/news/cache";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const news = await prisma.news.findUnique({ where: { id } });
    if (!news) {
      throw new ApiError("NEWS_NOT_FOUND", "新闻不存在", 404);
    }
    return ok(news);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    assertSameOriginRequest(request);
    const { id } = await params;
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NEWS_NOT_FOUND", "新闻不存在", 404);
    }

    const input = newsPatchSchema.parse(await request.json());
    const nextSlug = input.slug ? await ensureUniqueSlug(input.slug, existing.locale, id) : undefined;
    const firstPublish = existing.status !== "PUBLISHED" && input.status === "PUBLISHED" && !existing.publishedAt && !input.publishedAt;
    const data: Prisma.NewsUpdateInput = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
      ...(input.summary !== undefined ? { summary: input.summary || null } : {}),
      ...(input.coverImage !== undefined ? { coverImage: input.coverImage || null } : {}),
      ...(input.coverImageAlt !== undefined ? { coverImageAlt: input.coverImageAlt || null } : {}),
      ...(input.content !== undefined
        ? { content: input.content as Prisma.InputJsonValue, contentText: extractTextFromTiptapJson(input.content) }
        : {}),
      ...(input.authorName !== undefined ? { authorName: input.authorName || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
      ...(input.publishedAt !== undefined ? { publishedAt: input.publishedAt } : {}),
      ...(firstPublish ? { publishedAt: new Date() } : {}),
    };

    const updated = await prisma.news.update({
      where: { id },
      data,
    });

    revalidateNewsCache({ oldSlug: existing.slug, newSlug: updated.slug });
    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    assertSameOriginRequest(request);
    const { id } = await params;
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NEWS_NOT_FOUND", "新闻不存在", 404);
    }

    const updated = await prisma.news.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    revalidateNewsCache({ oldSlug: existing.slug, newSlug: updated.slug });
    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
