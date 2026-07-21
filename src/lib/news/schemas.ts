import { z } from "zod";
import { isAllowedImageUrl, validateTiptapDocument } from "./tiptap";

const slugSchema = z
  .string()
  .trim()
  .min(1, "slug 不能为空")
  .max(120, "slug 过长")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug 只能包含小写字母、数字和短横线");

const dateInput = z
  .union([z.string().datetime(), z.string().date(), z.null()])
  .optional()
  .transform((value) => (value ? new Date(value) : null));

export const listNewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  keyword: z.string().trim().max(100).optional(),
  featured: z.coerce.boolean().optional(),
  locale: z.enum(["zh", "en"]).default("zh"),
  sort: z.enum(["publishedAt", "createdAt", "updatedAt"]).default("publishedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const adminListNewsQuerySchema = listNewsQuerySchema.extend({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  deleted: z.coerce.boolean().optional(),
});

export const newsInputSchema = z.object({
  title: z.string().trim().min(1, "请输入标题").max(200, "标题不能超过 200 字"),
  slug: slugSchema.optional().or(z.literal("").transform(() => undefined)),
  locale: z.enum(["zh", "en"], { message: "请选择语言" }),
  summary: z.string().trim().max(500, "摘要不能超过 500 字").optional().nullable(),
  coverImage: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((value) => !value || isAllowedImageUrl(value), "封面图地址不被允许"),
  coverImageAlt: z.string().trim().max(200).optional().nullable(),
  content: z.unknown().transform((value, ctx) => {
    try {
      return validateTiptapDocument(value);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "正文格式不正确",
      });
      return z.NEVER;
    }
  }),
  authorName: z.string().trim().max(100).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  publishedAt: dateInput,
});

export const newsPatchSchema = newsInputSchema.partial();

export type NewsInput = z.infer<typeof newsInputSchema>;
export type NewsPatch = z.infer<typeof newsPatchSchema>;
