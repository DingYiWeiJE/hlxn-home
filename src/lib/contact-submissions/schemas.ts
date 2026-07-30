import { z } from "zod";
import { ContactSubmissionType } from "./types";

const PHONE_REGEX = /^[+]?[\d\s\-()]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const phoneSchema = z
  .string()
  .trim()
  .min(7, "电话号码格式不正确")
  .max(20, "电话号码过长")
  .regex(PHONE_REGEX, "电话号码格式不正确")
  .optional()
  .nullable();

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("邮箱格式不正确")
  .max(255, "邮箱过长")
  .optional()
  .nullable();

const atLeastOneContact = z
  .object({
    phone: phoneSchema,
    email: emailSchema,
  })
  .refine(
    (data) => data.phone || data.email,
    "电话和邮箱至少填写一个"
  );

const customerInquirySchema = z.object({
  type: z.literal("CUSTOMER"),
  locale: z.enum(["zh", "en"]),
  contactName: z.string().trim().min(1, "联系人姓名必填").max(100),
  phone: phoneSchema,
  email: emailSchema,
  jobTitle: z.string().trim().max(100).optional().nullable(),
  companyName: z.string().trim().min(1, "公司名称必填").max(200),
  mainBusiness: z.string().trim().min(1, "主营业务必填").max(500),
  regionDetail: z.string().trim().min(1, "详细地址必填").max(500),
  applicationType: z.string().optional().nullable(),
  productType: z.string().optional().nullable(),
  chemicalSystem: z.string().optional().nullable(),
  cellShape: z.string().optional().nullable(),
  specificScenario: z.string().trim().max(1000).optional().nullable(),
  unitPackCapacityKwh: z.number().positive().optional().nullable(),
  unitPackVoltageV: z.number().positive().optional().nullable(),
  spaceDimensions: z.string().trim().max(200).optional().nullable(),
  annualElectricityKwh: z.number().nonnegative().optional().nullable(),
  chargingHours: z.number().positive().optional().nullable(),
  otherRequirements: z.string().trim().max(2000).optional().nullable(),
  consentGiven: z.boolean().refine((v) => v === true, "必须同意隐私政策"),
  idempotencyKey: z.string().uuid(),
  formStartedAt: z.number(),
  turnstileToken: z.string(),
  website: z.string().max(0, "机器人检测：表单验证失败"),
});

const mediaInquirySchema = z.object({
  type: z.literal("MEDIA"),
  locale: z.enum(["zh", "en"]),
  contactName: z.string().trim().min(1, "联系人姓名必填").max(100),
  phone: phoneSchema,
  email: emailSchema,
  mediaName: z.string().trim().min(1, "媒体名称必填").max(200),
  inquiryPurpose: z.string().optional().nullable(),
  details: z.string().trim().min(1, "详细需求必填").max(2000),
  consentGiven: z.boolean().refine((v) => v === true, "必须同意隐私政策"),
  idempotencyKey: z.string().uuid(),
  formStartedAt: z.number(),
  turnstileToken: z.string(),
  website: z.string().max(0, "机器人检测：表单验证失败"),
});

const eventOrganizerInquirySchema = z.object({
  type: z.literal("EVENT_ORGANIZER"),
  locale: z.enum(["zh", "en"]),
  contactName: z.string().trim().min(1, "联系人姓名必填").max(100),
  phone: phoneSchema,
  email: emailSchema,
  eventName: z.string().trim().min(1, "会议或会展名称必填").max(200),
  organizerName: z.string().trim().min(1, "主办单位必填").max(200),
  location: z.string().trim().min(1, "举办地点必填").max(500),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  inquiryPurpose: z.string().optional().nullable(),
  details: z.string().trim().min(1, "详细需求必填").max(300),
  consentGiven: z.boolean().refine((v) => v === true, "必须同意隐私政策"),
  idempotencyKey: z.string().uuid(),
  formStartedAt: z.number(),
  turnstileToken: z.string(),
  website: z.string().max(0, "机器人检测：表单验证失败"),
});

export const contactSubmissionSchema = z.discriminatedUnion("type", [
  customerInquirySchema.merge(atLeastOneContact),
  mediaInquirySchema.merge(atLeastOneContact),
  eventOrganizerInquirySchema
    .merge(atLeastOneContact)
    .refine((data) => data.endAt >= data.startAt, {
      path: ["endAt"],
      message: "结束时间不能早于开始时间",
    }),
]);

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;

export const adminContactSubmissionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["submittedAt", "createdAt", "contactName"]).default("submittedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  keyword: z.string().optional(),
  type: z.enum(["CUSTOMER", "MEDIA", "EVENT_ORGANIZER"]).optional(),
  locale: z.enum(["zh", "en"]).optional(),
  status: z.enum(["PENDING", "FOLLOWING_UP", "CONTACTED", "COMPLETED", "INVALID", "SPAM"]).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "BLOCKED"]).optional(),
  duplicate: z.enum(["all", "duplicate", "not_duplicate"]).default("all"),
  notificationStatus: z.enum(["PENDING", "SENT", "FAILED", "SKIPPED"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  deleted: z.coerce.boolean().default(false),
});

export type AdminContactSubmissionListQuery = z.infer<
  typeof adminContactSubmissionListQuerySchema
>;

export const updateContactSubmissionStatusSchema = z.object({
  status: z.enum(["PENDING", "FOLLOWING_UP", "CONTACTED", "COMPLETED", "INVALID", "SPAM"]),
});

export const addContactSubmissionNoteSchema = z.object({
  content: z.string().trim().min(1, "备注内容必填").max(5000),
});
