import { CategoryLevel } from "@prisma/client";
import { z } from "zod";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const updateCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "请输入分类名称")
      .max(100, "分类名称不能超过 100 个字符")
      .optional(),

    nameEn: z
      .string()
      .trim()
      .min(1, "Please enter the English category name")
      .max(100, "English category name cannot exceed 100 characters")
      .optional(),

    parentId: z
      .string()
      .trim()
      .min(1, "请选择一级分类")
      .nullable()
      .optional(),

    sortOrder: z
      .number()
      .int()
      .min(0, "排序值不能小于 0")
      .optional(),

    enabled: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "至少需要提交一个需要修改的字段",
    },
  );

/**
 * 查询单个分类
 *
 * GET /api/admin/categories/:id
 */
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireAdminActor();

    const { id } = await context.params;

    const category = await prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
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
            enabled: true,
          },
        },

        children: {
          where: {
            deletedAt: null,
          },
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
            enabled: true,
            sortOrder: true,
          },
        },

        _count: {
          select: {
            children: {
              where: {
                deletedAt: null,
              },
            },
            products: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new ApiError(
        "NOT_FOUND",
        "产品分类不存在",
        404,
      );
    }

    return ok({
      ...category,
      counts: {
        children: category._count.children,
        products: category._count.products,
      },
      _count: undefined,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * 编辑分类
 *
 * PATCH /api/admin/categories/:id
 *
 * 注意：
 * 分类层级创建后不允许修改。
 * 分类 Slug 创建后不允许修改。
 * 修改分类名称不会改变原 Slug。
 * 一级分类不能设置 parentId。
 * 二级分类可以更换所属一级分类。
 */
export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } = await context.params;

    const body = updateCategorySchema.parse(
      await request.json(),
    );

    const existingCategory =
      await prisma.category.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          nameEn: true,
          slug: true,
          level: true,
          parentId: true,
        },
      });

    if (!existingCategory) {
      throw new ApiError(
        "NOT_FOUND",
        "产品分类不存在",
        404,
      );
    }

    let nextParentId = existingCategory.parentId;

    if (
      existingCategory.level ===
      CategoryLevel.LEVEL_ONE
    ) {
      if (
        body.parentId !== undefined &&
        body.parentId !== null
      ) {
        throw new ApiError(
          "BAD_REQUEST",
          "一级分类不能设置父级分类",
          400,
          {
            parentId: ["一级分类不能设置父级分类"],
          },
        );
      }

      nextParentId = null;
    }

    if (
      existingCategory.level ===
        CategoryLevel.LEVEL_TWO &&
      body.parentId !== undefined
    ) {
      if (!body.parentId) {
        throw new ApiError(
          "BAD_REQUEST",
          "二级分类必须选择所属一级分类",
          400,
          {
            parentId: [
              "二级分类必须选择所属一级分类",
            ],
          },
        );
      }

      const parent =
        await prisma.category.findFirst({
          where: {
            id: body.parentId,
            level: CategoryLevel.LEVEL_ONE,
            enabled: true,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        });

      if (!parent) {
        throw new ApiError(
          "BAD_REQUEST",
          "所选择的一级分类不存在或已停用",
          400,
          {
            parentId: [
              "所选择的一级分类不存在或已停用",
            ],
          },
        );
      }

      nextParentId = parent.id;
    }

    const nextName =
      body.name ?? existingCategory.name;

    const nameExists =
      await prisma.category.findFirst({
        where: {
          id: {
            not: id,
          },
          parentId: nextParentId,
          deletedAt: null,
          name: {
            equals: nextName,
            mode: "insensitive",
          },
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

    const category =
      await prisma.category.update({
        where: {
          id,
        },
        data: {
          ...(body.name !== undefined
            ? {
                name: body.name,
              }
            : {}),

          ...(body.nameEn !== undefined
            ? {
                nameEn: body.nameEn,
              }
            : {}),

          ...(existingCategory.level ===
            CategoryLevel.LEVEL_TWO
            ? {
                parentId: nextParentId,
              }
            : {}),

          ...(body.sortOrder !== undefined
            ? {
                sortOrder: body.sortOrder,
              }
            : {}),

          ...(body.enabled !== undefined
            ? {
                enabled: body.enabled,
              }
            : {}),
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

    return ok(category);
  } catch (error) {
    return fail(error);
  }
}

/**
 * 软删除分类
 *
 * DELETE /api/admin/categories/:id
 *
 * 一级分类仍有二级分类时不能删除。
 * 二级分类仍有产品时不能删除。
 */
export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } = await context.params;

    const category =
      await prisma.category.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: {
          id: true,
          level: true,

          _count: {
            select: {
              children: {
                where: {
                  deletedAt: null,
                },
              },
              products: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
      });

    if (!category) {
      throw new ApiError(
        "NOT_FOUND",
        "产品分类不存在",
        404,
      );
    }

    if (
      category.level ===
        CategoryLevel.LEVEL_ONE &&
      category._count.children > 0
    ) {
      throw new ApiError(
        "BAD_REQUEST",
        "该一级分类下仍有二级分类，无法删除",
        409,
      );
    }

    if (
      category.level ===
        CategoryLevel.LEVEL_TWO &&
      category._count.products > 0
    ) {
      throw new ApiError(
        "BAD_REQUEST",
        "该二级分类下仍有关联产品，无法删除",
        409,
      );
    }

    await prisma.category.update({
      where: {
        id,
      },
      data: {
        enabled: false,
        deletedAt: new Date(),
      },
    });

    return ok({
      id,
      deleted: true,
    });
  } catch (error) {
    return fail(error);
  }
}
