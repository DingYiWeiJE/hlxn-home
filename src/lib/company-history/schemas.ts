import { z } from "zod";
import { parseDateInputToUtcNoon } from "./date";

export const companyHistoryLocaleSchema = z.enum(["zh", "en"], {
  message: "内容语言只能是中文或英文",
});

const titleSchema = z
  .string()
  .trim()
  .max(200, "事件标题不能超过 200 个字符")
  .optional()
  .nullable()
  .transform((value) => {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
  });

const paragraphSchema = z
  .string()
  .trim()
  .min(1, "自然段内容不能为空")
  .max(3000, "单个自然段不能超过 3000 个字符");

export const detailParagraphsSchema = z
  .array(z.string())
  .max(20, "事件详情最多支持 20 个自然段")
  .transform((items) => items.map((item) => item.trim()).filter(Boolean))
  .pipe(
    z
      .array(paragraphSchema)
      .min(1, "事件详情至少需要一个非空自然段")
      .max(20, "事件详情最多支持 20 个自然段"),
  );

const imageAssetIdSchema = z
  .union([z.string().trim().min(1), z.null()])
  .optional()
  .transform((value) => value ?? null);

const companyHistoryFieldsSchema = z.object({
  locale: companyHistoryLocaleSchema,
  displayTime: z
    .string()
    .trim()
    .min(1, "展示时间不能为空")
    .max(100, "展示时间不能超过 100 个字符"),
  sortDate: z
    .union([z.string(), z.date()])
    .transform((value) => parseDateInputToUtcNoon(value)),
  sortOrder: z.coerce
    .number()
    .int("排序值必须是整数")
    .min(-100000, "排序值过小")
    .max(100000, "排序值过大")
    .default(0),
  title: titleSchema,
  detailParagraphs: detailParagraphsSchema,
  imageAssetId: imageAssetIdSchema,
});

export const createCompanyHistorySchema = companyHistoryFieldsSchema.strict();
export const updateCompanyHistorySchema = companyHistoryFieldsSchema.strict();

export const adminCompanyHistoryListQuerySchema = z.object({
  keyword: z.string().trim().max(100).optional(),
  locale: companyHistoryLocaleSchema.optional(),
  sortDateFrom: z.string().optional(),
  sortDateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(["sortDate", "sortOrder", "createdAt", "updatedAt", "displayTime"])
    .default("sortDate"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateCompanyHistoryInput = z.infer<
  typeof createCompanyHistorySchema
>;

export type UpdateCompanyHistoryInput = z.infer<
  typeof updateCompanyHistorySchema
>;
