import { z } from "zod";

import {
  validateTiptapDocument,
} from "./tiptap";

export const newsLocaleSchema = z.enum(
  ["zh", "en"],
  {
    message:
      "新闻语言只能是 zh 或 en",
  },
);

export const newsStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
]);

export const newsSourceTypeSchema =
  z.enum(["MANUAL", "WECHAT"]);

const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform(
    (value) => value === "true",
  );

const dateValueSchema = z.union([
  z.string().datetime(),
  z.string().date(),
  z.null(),
]);

const optionalDateInput =
  dateValueSchema
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      if (value === null) {
        return null;
      }

      return new Date(value);
    });

const contentSchema = z
  .unknown()
  .transform((value, context) => {
    try {
      return validateTiptapDocument(
        value,
      );
    } catch (error) {
      context.addIssue({
        code: "custom",
        message:
          error instanceof Error
            ? error.message
            : "正文格式不正确",
      });

      return z.NEVER;
    }
  });

const sourceUrlSchema = z
  .string()
  .trim()
  .max(
    2000,
    "文章来源地址不能超过 2000 个字符",
  )
  .url("文章来源地址格式不正确")
  .refine((value) => {
    try {
      const url = new URL(value);

      return (
        url.protocol === "https:" &&
        (url.hostname ===
          "mp.weixin.qq.com" ||
          url.hostname.endsWith(
            ".mp.weixin.qq.com",
          ))
      );
    } catch {
      return false;
    }
  }, "仅允许使用微信公众号文章地址");

const listQueryFields = {
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10),

  keyword: z
    .string()
    .trim()
    .max(100)
    .optional(),

  featured:
    booleanQuerySchema.optional(),

  sort: z
    .enum([
      "publishedAt",
      "createdAt",
      "updatedAt",
    ])
    .default("publishedAt"),

  order: z
    .enum(["asc", "desc"])
    .default("desc"),
};

export const listNewsQuerySchema =
  z.object({
    ...listQueryFields,

    locale:
      newsLocaleSchema.default("zh"),
  });

export const adminListNewsQuerySchema =
  z.object({
    ...listQueryFields,

    locale:
      newsLocaleSchema.optional(),

    status:
      newsStatusSchema.optional(),

    deleted:
      booleanQuerySchema.optional(),
  });

const createNewsObject = z.object({
  title: z
    .string()
    .trim()
    .min(1, "请输入新闻标题")
    .max(
      200,
      "新闻标题不能超过 200 个字符",
    ),

  // 创建时必须明确选择 zh 或 en
  locale: newsLocaleSchema,

  summary: z
    .string()
    .trim()
    .max(
      1000,
      "新闻摘要不能超过 1000 个字符",
    )
    .optional()
    .nullable(),

  coverImageAssetId: z
    .string()
    .trim()
    .min(
      1,
      "新闻封面素材 ID 不正确",
    )
    .optional()
    .nullable(),

  coverImageAlt: z
    .string()
    .trim()
    .max(
      200,
      "封面图片说明不能超过 200 个字符",
    )
    .optional()
    .nullable(),

  content: contentSchema,

  authorName: z
    .string()
    .trim()
    .max(
      100,
      "作者名称不能超过 100 个字符",
    )
    .optional()
    .nullable(),

  status:
    newsStatusSchema.default("DRAFT"),

  isFeatured:
    z.boolean().default(false),

  publishedAt:
    optionalDateInput,

  sourceType:
    newsSourceTypeSchema.default(
      "MANUAL",
    ),

  sourceUrl:
    sourceUrlSchema
      .optional()
      .nullable(),

  sourceAccountName: z
    .string()
    .trim()
    .max(
      200,
      "公众号名称不能超过 200 个字符",
    )
    .optional()
    .nullable(),

  sourceArticleId: z
    .string()
    .trim()
    .max(
      255,
      "来源文章标识不能超过 255 个字符",
    )
    .optional()
    .nullable(),

  sourcePublishedAt:
    optionalDateInput,

  importMeta: z
    .unknown()
    .optional()
    .nullable(),
});

export const newsInputSchema =
  createNewsObject.superRefine(
    (data, context) => {
      if (
        data.sourceType === "WECHAT" &&
        !data.sourceUrl
      ) {
        context.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: ["sourceUrl"],
          message:
            "微信公众号导入新闻必须保留原文地址",
        });
      }
    },
  );

export const newsPatchSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "请输入新闻标题")
      .max(200)
      .optional(),

    locale:
      newsLocaleSchema.optional(),

    summary: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .nullable(),

    coverImageAssetId: z
      .string()
      .trim()
      .min(1)
      .optional()
      .nullable(),

    coverImageAlt: z
      .string()
      .trim()
      .max(200)
      .optional()
      .nullable(),

    content:
      contentSchema.optional(),

    authorName: z
      .string()
      .trim()
      .max(100)
      .optional()
      .nullable(),

    status:
      newsStatusSchema.optional(),

    isFeatured:
      z.boolean().optional(),

    publishedAt:
      optionalDateInput,

    sourceType:
      newsSourceTypeSchema.optional(),

    sourceUrl:
      sourceUrlSchema
        .optional()
        .nullable(),

    sourceAccountName: z
      .string()
      .trim()
      .max(200)
      .optional()
      .nullable(),

    sourceArticleId: z
      .string()
      .trim()
      .max(255)
      .optional()
      .nullable(),

    sourcePublishedAt:
      optionalDateInput,

    importMeta: z
      .unknown()
      .optional()
      .nullable(),
  })
  .refine(
    (data) =>
      Object.keys(data).length > 0,
    {
      message:
        "至少需要提交一个需要修改的字段",
    },
  );

export type NewsInput =
  z.infer<typeof newsInputSchema>;

export type NewsPatch =
  z.infer<typeof newsPatchSchema>;