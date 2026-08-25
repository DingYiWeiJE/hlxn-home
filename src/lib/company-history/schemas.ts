import { z } from "zod";
import { parseDateInputToUtcNoon } from "./date";

export const companyHistoryLocaleSchema = z.enum(["zh", "en"], {
  message: "内容语言只能是中文或英文",
});

const yearSchema = z.coerce
  .number()
  .int("年份必须是整数")
  .min(1900, "年份不能早于 1900 年")
  .max(2100, "年份不能晚于 2100 年");

const timeSchema = z
  .string()
  .trim()
  .min(1, "事件时间不能为空")
  .max(50, "事件时间不能超过 50 个字符");

const contentSchema = z
  .string()
  .trim()
  .min(1, "事件内容不能为空")
  .max(1000, "事件内容不能超过 1000 个字符");

const imageAssetIdSchema = z
  .union([z.string().trim().min(1), z.null()])
  .optional()
  .transform((value) => value ?? null);

const companyHistoryEventFieldsSchema = z.object({
  locale: companyHistoryLocaleSchema,
  year: yearSchema,
  time: timeSchema,
  content: contentSchema,
  sortDate: z
    .union([z.string(), z.date()])
    .transform((value) => parseDateInputToUtcNoon(value)),
  sortOrder: z.coerce
    .number()
    .int("排序值必须是整数")
    .min(-100000, "排序值过小")
    .max(100000, "排序值过大")
    .default(0),
  imageAssetId: imageAssetIdSchema,
});

export const createCompanyHistoryEventSchema = companyHistoryEventFieldsSchema.strict();
export const updateCompanyHistoryEventSchema = companyHistoryEventFieldsSchema.partial().strict();

export const adminCompanyHistoryListQuerySchema = z.object({
  keyword: z.string().trim().max(100).optional(),
  locale: companyHistoryLocaleSchema.optional(),
  sortDateFrom: z.string().optional(),
  sortDateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(["sortDate", "sortOrder", "createdAt", "year"])
    .default("sortDate"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateCompanyHistoryEventInput = z.infer<
  typeof createCompanyHistoryEventSchema
>;

export type UpdateCompanyHistoryEventInput = z.infer<
  typeof updateCompanyHistoryEventSchema
>;
