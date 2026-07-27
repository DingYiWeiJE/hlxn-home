import { z } from "zod";

export const productLocaleSchema = z.enum(
  ["zh", "en"],
  {
    message: "产品语言只能是 zh 或 en",
  },
);

const slugSchema = z
  .string()
  .trim()
  .min(1, "请输入产品 Slug")
  .max(150, "产品 Slug 不能超过 150 个字符")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug 只能包含小写字母、数字和中划线",
  );

const paragraphSchema = z
  .string()
  .trim()
  .min(1, "自然段内容不能为空")
  .max(5000, "单个自然段不能超过 5000 个字符");

const highlightSchema = z
  .string()
  .trim()
  .min(1, "产品亮点不能为空")
  .max(300, "单个产品亮点不能超过 300 个字符");

const productImageItemSchema = z.object({
  assetId: z
    .string()
    .trim()
    .min(1, "请选择图片"),

  // 图片可以从素材库复用，
  // 标题必须属于当前产品并重新填写
  title: z
    .string()
    .trim()
    .min(1, "请输入标题")
    .max(150, "标题不能超过 150 个字符"),

  sortOrder: z
    .number()
    .int()
    .min(0, "排序值不能小于 0")
    .optional(),
});

export const specificationSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "请输入规格参数表格标题")
      .max(200, "规格参数表格标题不能超过 200 个字符"),

    headers: z
      .array(
        z
          .string()
          .trim()
          .min(1, "表头名称不能为空")
          .max(100, "单个表头不能超过 100 个字符"),
      )
      .min(1, "规格参数至少需要一列表头")
      .max(20, "规格参数最多支持 20 列"),

    rows: z
      .array(
        z.array(
          z
            .string()
            .trim()
            .max(1000, "单元格内容不能超过 1000 个字符"),
        ),
      )
      .max(200, "规格参数最多支持 200 行"),
  })
  .superRefine((data, context) => {
    data.rows.forEach((row, rowIndex) => {
      if (row.length !== data.headers.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rows", rowIndex],
          message:
            `第 ${rowIndex + 1} 行有 ${row.length} 个单元格，` +
            `但表头有 ${data.headers.length} 列`,
        });
      }
    });
  });

const productFieldsSchema = z.object({
  // 创建产品时必传，不提供默认值
  locale: productLocaleSchema,

  name: z
    .string()
    .trim()
    .min(1, "请输入产品名称")
    .max(200, "产品名称不能超过 200 个字符"),

  slug: slugSchema,

  seriesName: z
    .string()
    .trim()
    .max(200, "系列名称不能超过 200 个字符")
    .optional()
    .nullable(),

  secondaryCategoryId: z
    .string()
    .trim()
    .min(1, "请选择二级分类"),

  summaryParagraphs: z
    .array(paragraphSchema)
    .max(50, "产品简介最多支持 50 个自然段")
    .default([]),

  highlights: z
    .array(highlightSchema)
    .max(100, "产品亮点最多支持 100 项")
    .default([]),

  introductionParagraphs: z
    .array(paragraphSchema)
    .max(100, "产品介绍最多支持 100 个自然段")
    .default([]),

  advantages: z
    .array(productImageItemSchema)
    .max(50, "产品优势最多支持 50 项")
    .default([]),

  specification: specificationSchema
    .optional()
    .nullable(),

  applications: z
    .array(productImageItemSchema)
    .max(50, "应用场景最多支持 50 项")
    .default([]),

  coverImageAssetId: z
    .string()
    .trim()
    .min(1, "产品封面图片素材 ID 不正确")
    .optional()
    .nullable(),

  detailPdfAssetId: z
    .string()
    .trim()
    .min(1, "PDF 素材 ID 不正确")
    .optional()
    .nullable(),

  status: z
    .enum(["DRAFT", "PUBLISHED", "OFFLINE"])
    .default("DRAFT"),

  sortOrder: z
    .number()
    .int()
    .min(0, "排序值不能小于 0")
    .default(0),
});

export const createProductSchema =
  productFieldsSchema;

export const updateProductSchema =
  productFieldsSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: "至少需要提交一个需要修改的字段",
      },
    );

const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const adminProductListQuerySchema =
  z.object({
    locale: productLocaleSchema.optional(),

    keyword: z
      .string()
      .trim()
      .max(100, "搜索关键词不能超过 100 个字符")
      .optional(),

    status: z
      .enum(["DRAFT", "PUBLISHED", "OFFLINE"])
      .optional(),

    primaryCategoryId: z
      .string()
      .trim()
      .min(1)
      .optional(),

    secondaryCategoryId: z
      .string()
      .trim()
      .min(1)
      .optional(),

    deleted: booleanQuerySchema.optional(),

    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    sort: z
      .enum([
        "createdAt",
        "updatedAt",
        "publishedAt",
        "sortOrder",
        "name",
      ])
      .default("createdAt"),

    order: z
      .enum(["asc", "desc"])
      .default("desc"),
  });

export type CreateProductInput =
  z.infer<typeof createProductSchema>;

export type UpdateProductInput =
  z.infer<typeof updateProductSchema>;

export type AdminProductListQuery =
  z.infer<typeof adminProductListQuerySchema>;