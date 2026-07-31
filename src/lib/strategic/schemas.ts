import { z } from "zod";

export const strategicLocationTypeSchema = z.enum([
  "HEADQUARTERS",
  "BRANCH",
  "MARKETING",
  "SERVICE",
]);

export const strategicLocationStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);

const nullableTrimmedString = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      const trimmed = typeof value === "string" ? value.trim() : "";
      return trimmed.length > 0 ? trimmed.slice(0, max) : null;
    });

const requiredText = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max);

const businessScopeSchema = z
  .array(z.string())
  .max(20)
  .transform((items) => items.map((item) => item.trim()).filter(Boolean))
  .pipe(z.array(z.string().min(1).max(80)).max(20));

const longitudeSchema = z.coerce.number().min(-180).max(180);
const latitudeSchema = z.coerce.number().min(-90).max(90);
const optionalStaffSchema = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.union([z.coerce.number().int().min(0).max(100000), z.null()]),
);

const strategicLocationFieldsSchema = z.object({
  code: requiredText("网点编码不能为空", 80).regex(
    /^[a-z0-9][a-z0-9-]*$/,
    "网点编码只能包含小写字母、数字和连字符",
  ),
  nameZh: requiredText("中文名称不能为空", 160),
  nameEn: requiredText("英文名称不能为空", 160),
  type: strategicLocationTypeSchema,
  countryCode: requiredText("国家代码不能为空", 8).transform((value) =>
    value.toUpperCase(),
  ),
  countryNameZh: requiredText("中文国家名称不能为空", 80),
  countryNameEn: requiredText("英文国家名称不能为空", 80),
  provinceNameZh: nullableTrimmedString(80),
  provinceNameEn: nullableTrimmedString(80),
  cityNameZh: nullableTrimmedString(80),
  cityNameEn: nullableTrimmedString(80),
  longitude: longitudeSchema,
  latitude: latitudeSchema,
  establishment: nullableTrimmedString(40),
  staff: optionalStaffSchema,
  descriptionZh: nullableTrimmedString(3000),
  descriptionEn: nullableTrimmedString(3000),
  businessScopeZh: businessScopeSchema.default([]),
  businessScopeEn: businessScopeSchema.default([]),
  imageUrl: nullableTrimmedString(1000),
  status: strategicLocationStatusSchema.default("DRAFT"),
  enabled: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(-100000).max(100000).default(0),
});

export const createStrategicLocationSchema =
  strategicLocationFieldsSchema.strict();

export const updateStrategicLocationSchema =
  strategicLocationFieldsSchema.strict();

export const adminStrategicLocationListQuerySchema = z.object({
  keyword: z.string().trim().max(100).optional(),
  status: strategicLocationStatusSchema.optional(),
  enabled: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  countryCode: z.string().trim().max(8).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["sortOrder", "createdAt", "updatedAt", "nameZh"]).default("sortOrder"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const publicStrategicLocationQuerySchema = z.object({
  locale: z.enum(["zh", "en"]).default("zh"),
});

export type CreateStrategicLocationInput = z.infer<
  typeof createStrategicLocationSchema
>;

export type UpdateStrategicLocationInput = z.infer<
  typeof updateStrategicLocationSchema
>;
