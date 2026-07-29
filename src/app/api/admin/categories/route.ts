import { CategoryLevel, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { generateUniqueSlug } from "@/lib/slug/generate-slug";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const listCategoryQuerySchema = z.object({
  level: z.enum(["LEVEL_ONE", "LEVEL_TWO"]).optional(),

  // 当 level=LEVEL_TWO：
  // 不传 parentId 表示查询全部二级分类；
  // 传 parentId 表示查询指定一级分类下的二级分类。
  parentId: z.string().trim().min(1).optional(),

  enabled: booleanQuerySchema.optional(),

  keyword: z
    .string()
    .trim()
    .max(100, "搜索关键词不能超过 100 个字符")
    .optional(),
});

const createCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "请输入分类名称")
      .max(100, "分类名称不能超过 100 个字符"),

    nameEn: z
      .string()
      .trim()
      .min(1, "Please enter the English category name")
      .max(100, "English category name cannot exceed 100 characters"),

    level: z.enum(["LEVEL_ONE", "LEVEL_TWO"]),

    parentId: z
      .string()
      .trim()
      .min(1)
      .optional()
      .nullable(),

    sortOrder: z
      .number()
      .int()
      .min(0, "排序值不能小于 0")
      .default(0),

    enabled: z.boolean().default(true),
  })
  .superRefine((data, context) => {
    if (data.level === "LEVEL_ONE" && data.parentId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["parentId"],
        message: "一级分类不能设置父级分类",
      });
    }

    if (data.level === "LEVEL_TWO" && !data.parentId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["parentId"],
        message: "二级分类必须选择所属一级分类",
      });
    }
  });

/**
 * 分类列表
 *
 * GET /api/admin/categories
 *
 * 查询全部一级分类：
 * GET /api/admin/categories?level=LEVEL_ONE
 *
 * 查询全部二级分类：
 * GET /api/admin/categories?level=LEVEL_TWO
 *
 * 查询指定一级分类下的二级分类：
 * GET /api/admin/categories?level=LEVEL_TWO&parentId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminActor();

    const query = listCategoryQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,

      ...(query.level
        ? {
            level: query.level as CategoryLevel,
          }
        : {}),

      ...(query.parentId
        ? {
            parentId: query.parentId,
          }
        : {}),

      ...(query.enabled === undefined
        ? {}
        : {
            enabled: query.enabled,
          }),

      ...(query.keyword
        ? {
            OR: [
              {
                name: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
              {
                nameEn: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const items = await prisma.category.findMany({
      where,
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        nameEn: true,
        slug: true,
        level: true,
        parentId: true,
        sortOrder: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,

        parent: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
          },
        },

        _count: {
          select: {
            children: true,
            products: true,
          },
        },
      },
    });

    return ok({
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        nameEn: item.nameEn,
        slug: item.slug,
        level: item.level,
        parentId: item.parentId,
        parent: item.parent,
        sortOrder: item.sortOrder,
        enabled: item.enabled,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        counts: {
          children: item._count.children,
          products: item._count.products,
        },
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * 新增分类
 *
 * POST /api/admin/categories
 *
 * Slug 由后端根据分类名称自动生成。
 * 重复时自动追加 -2、-3。
 */
export async function POST(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const body = createCategorySchema.parse(
      await request.json(),
    );

    const parentId =
      body.level === "LEVEL_ONE"
        ? null
        : body.parentId ?? null;

    if (body.level === "LEVEL_TWO") {
      const parent = await prisma.category.findFirst({
        where: {
          id: parentId!,
          level: CategoryLevel.LEVEL_ONE,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!parent) {
        throw new ApiError(
          "BAD_REQUEST",
          "所选择的一级分类不存在",
          400,
          {
            parentId: ["所选择的一级分类不存在"],
          },
        );
      }
    }

    const nameExists = await prisma.category.findFirst({
      where: {
        name: {
          equals: body.name,
          mode: "insensitive",
        },
        parentId,
      },
      select: {
        id: true,
      },
    });

    if (nameExists) {
      throw new ApiError(
        "BAD_REQUEST",
        "同级分类名称已经存在",
        409,
        {
          name: ["同级分类名称已经存在"],
        },
      );
    }

    const category = await prisma.$transaction(
      async (transaction) => {
        const slug =
          await generateUniqueSlug({
            source: body.name,
            maxLength: 100,

            exists: async (candidate) => {
              const existingCategory =
                await transaction.category.findUnique({
                  where: {
                    slug: candidate,
                  },

                  select: {
                    id: true,
                  },
                });

              return existingCategory !== null;
            },
          });

        return transaction.category.create({
          data: {
            name: body.name,
            nameEn: body.nameEn,
            slug,
            level: body.level,
            parentId,
            sortOrder: body.sortOrder,
            enabled: body.enabled,
          },

          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            level: true,
            parentId: true,
            sortOrder: true,
            enabled: true,
            createdAt: true,
            updatedAt: true,

            parent: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
              },
            },
          },
        });
      },
    );

    return ok(category, {
      status: 201,
    });
  } catch (error) {
    return fail(error);
  }
}
