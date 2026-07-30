import { z } from "zod";

export const applicationCaseLocaleSchema = z.enum(["zh", "en"], {
  message: "应用案例语言只能是 zh 或 en",
});

const paragraphSchema = z
  .string()
  .trim()
  .min(1, "自然段内容不能为空")
  .max(5000, "单个自然段不能超过 5000 个字符");

const contentParagraphsSchema = z
  .array(z.string())
  .default([])
  .transform((items) => items.map((item) => item.trim()).filter(Boolean))
  .pipe(
    z
      .array(paragraphSchema)
      .min(1, "至少需要一个非空自然段")
      .max(50, "应用案例内容最多支持 50 个自然段"),
  );

const applicationCaseFieldsSchema = z.object({
  locale: applicationCaseLocaleSchema,

  title: z
    .string()
    .trim()
    .min(1, "请输入应用案例标题")
    .max(200, "应用案例标题不能超过 200 个字符"),

  contentParagraphs: contentParagraphsSchema,

  caseDate: z.coerce
    .date({
      message: "请选择有效的日期",
    })
    .refine((date) => !isNaN(date.getTime()), {
      message: "日期格式不正确",
    }),

  imageAssetId: z
    .string()
    .trim()
    .min(1, "应用案例图片素材 ID 不正确"),
});

export const createApplicationCaseSchema = applicationCaseFieldsSchema;

export const updateApplicationCaseSchema = applicationCaseFieldsSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "至少需要提交一个需要修改的字段",
  });

const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const adminApplicationCaseListQuerySchema = z.object({
  locale: applicationCaseLocaleSchema.optional(),

  keyword: z
    .string()
    .trim()
    .max(100, "搜索关键词不能超过 100 个字符")
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
    .enum(["caseDate", "createdAt", "updatedAt", "title"])
    .default("caseDate"),

  order: z
    .enum(["asc", "desc"])
    .default("desc"),
});

export type CreateApplicationCaseInput = z.infer<
  typeof createApplicationCaseSchema
>;

export type UpdateApplicationCaseInput = z.infer<
  typeof updateApplicationCaseSchema
>;

export type AdminApplicationCaseListQuery = z.infer<
  typeof adminApplicationCaseListQuerySchema
>;
