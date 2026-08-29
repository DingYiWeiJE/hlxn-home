import { z } from "zod";

export const solutionLocaleSchema = z.enum(["zh", "en"], {
  message: "Locale must be zh or en",
});

export const solutionStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);

const paragraphSchema = z
  .string()
  .trim()
  .min(1, "Paragraph cannot be empty")
  .max(5000, "Paragraph cannot exceed 5000 characters");

const optionalParagraphsSchema = z
  .array(z.string())
  .default([])
  .transform((items) =>
    items.map((item) => item.trim()).filter(Boolean),
  )
  .pipe(z.array(paragraphSchema).max(100));

const requiredParagraphsSchema = z
  .array(z.string())
  .default([])
  .transform((items) =>
    items.map((item) => item.trim()).filter(Boolean),
  )
  .pipe(
    z
      .array(paragraphSchema)
      .min(1, "At least one paragraph is required")
      .max(100),
  );

const highlightsSchema = z
  .array(z.string())
  .default([])
  .transform((items) =>
    items.map((item) => item.trim()).filter(Boolean),
  )
  .pipe(
    z
      .array(
        z
          .string()
          .min(1)
          .max(300, "Highlight cannot exceed 300 characters"),
      )
      .max(100),
  );

const translationKeySchema = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Translation key can contain lowercase letters, numbers and hyphens",
  )
  .max(160)
  .optional()
  .nullable()
  .transform((value) => value?.trim() || null);

const imageIdSchema = z
  .string()
  .trim()
  .pipe(
    z.union([
      z.string().min(1, "Image is required"),
      z.literal("").transform(() => null),
    ]),
  )
  .nullable();

export const solutionUsageScenarioSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  detailParagraphs: optionalParagraphsSchema,
  imageAssetId: imageIdSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const solutionCustomerValueSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  detailParagraphs: requiredParagraphsSchema,
  imageAssetId: imageIdSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const solutionFieldsSchema = z.object({
  locale: solutionLocaleSchema,
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  subtitle: z
    .string()
    .trim()
    .max(200, "Subtitle cannot exceed 200 characters")
    .optional()
    .nullable(),
  status: solutionStatusSchema.default("DRAFT"),
  sortOrder: z.number().int().min(0).default(0),
  publishedAt: z.coerce.date().optional().nullable(),
  translationKey: translationKeySchema,
  categoryId: z
    .string()
    .trim()
    .min(1, "Category ID is required")
    .optional()
    .nullable(),
  coverImageAssetId: imageIdSchema.optional(),
  summaryParagraphs: requiredParagraphsSchema,
  highlights: highlightsSchema,
  workingPrincipleParagraphs: requiredParagraphsSchema,
  workingPrincipleBackgroundAssetId: imageIdSchema.optional(),
  systemCompositionParagraphs: optionalParagraphsSchema,
  usageScenarios: z
    .array(solutionUsageScenarioSchema)
    .max(50)
    .default([]),
  customerValues: z
    .array(solutionCustomerValueSchema)
    .max(50)
    .default([]),
});

export const createSolutionSchema = solutionFieldsSchema;

export const updateSolutionSchema = solutionFieldsSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const adminSolutionListQuerySchema = z.object({
  locale: solutionLocaleSchema.optional(),
  keyword: z.string().trim().max(100).optional(),
  status: solutionStatusSchema.optional(),
  type: z.string().trim().optional(),
  deleted: booleanQuerySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(["createdAt", "updatedAt", "publishedAt", "sortOrder", "title"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const publicSolutionListQuerySchema = z.object({
  locale: solutionLocaleSchema,
  keyword: z.string().trim().max(100).optional(),
  type: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});

export const publicSolutionDetailQuerySchema = z.object({
  locale: solutionLocaleSchema,
});

export type CreateSolutionInput = z.infer<typeof createSolutionSchema>;
export type UpdateSolutionInput = z.infer<typeof updateSolutionSchema>;
export type AdminSolutionListQuery = z.infer<
  typeof adminSolutionListQuerySchema
>;
