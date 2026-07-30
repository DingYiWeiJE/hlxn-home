import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { contactSubmissionSchema, type ContactSubmissionInput } from "@/lib/contact-submissions/schemas";
import { normalizeContactInput, hashIP, generateContentFingerprint, detectRiskReasons } from "@/lib/contact-submissions/normalize";
import { findDuplicates } from "@/lib/contact-submissions/dedupe";
import { checkRateLimit } from "@/lib/contact-submissions/rate-limit";
import { verifyTurnstile, detectFormTooFast, isHoneypotTriggered } from "@/lib/contact-submissions/security";
import { sendContactNotificationEmail } from "@/lib/contact-submissions/notifications";
import { PRIVACY_POLICY_VERSION, CONTACT_RISK_LEVELS } from "@/lib/contact-submissions/types";

export const runtime = "nodejs";

const MAX_BODY_SIZE = 50 * 1024;

export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      throw new ApiError("BAD_REQUEST", "请求体过大", 413);
    }

    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const appOrigin = process.env.APP_ORIGIN;

    if (!origin || !origin.startsWith(appOrigin!)) {
      throw new ApiError("FORBIDDEN", "跨域请求被拒绝", 403);
    }

    const body = await request.json();

    const validated = await contactSubmissionSchema.parseAsync(body);

    const normalized = normalizeContactInput({
      phone: validated.phone,
      email: validated.email,
    });

    if (detectFormTooFast(validated.formStartedAt)) {
      const now = new Date();
      const submission = await prisma.contactSubmission.create({
        data: {
          type: validated.type,
          locale: validated.locale,
          contactName: validated.contactName,
          phone: normalized.phone,
          phoneNormalized: normalized.phoneNormalized,
          email: normalized.email,
          emailNormalized: normalized.emailNormalized,
          status: "PENDING",
          riskLevel: "BLOCKED",
          riskReasons: JSON.stringify(["TOO_FAST"]),
          idempotencyKey: validated.idempotencyKey,
          sourcePath: referer,
          referrer: referer,
          ipHash: hashIP(request.headers.get("x-forwarded-for")),
          userAgent: request.headers.get("user-agent"),
          consentAt: now,
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
          submittedAt: now,
          notificationStatus: "SKIPPED",
        },
      });

      return ok({ submitted: true });
    }

    if (isHoneypotTriggered(validated.website)) {
      const now = new Date();
      await prisma.contactSubmission.create({
        data: {
          type: validated.type,
          locale: validated.locale,
          contactName: validated.contactName,
          phone: normalized.phone,
          phoneNormalized: normalized.phoneNormalized,
          email: normalized.email,
          emailNormalized: normalized.emailNormalized,
          status: "PENDING",
          riskLevel: "BLOCKED",
          riskReasons: JSON.stringify(["HONEYPOT"]),
          idempotencyKey: validated.idempotencyKey,
          sourcePath: referer,
          referrer: referer,
          ipHash: hashIP(request.headers.get("x-forwarded-for")),
          userAgent: request.headers.get("user-agent"),
          consentAt: now,
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
          submittedAt: now,
          notificationStatus: "SKIPPED",
        },
      });

      return ok({ submitted: true });
    }

    const turnstileValid = await verifyTurnstile(validated.turnstileToken);
    if (!turnstileValid) {
      throw new ApiError("BAD_REQUEST", "验证码验证失败，请重试", 400);
    }

    const ipHash = hashIP(request.headers.get("x-forwarded-for"));
    const { allowed: rateLimitAllowed, reasons: rateLimitReasons } = await checkRateLimit({
      ipHash,
      emailNormalized: normalized.emailNormalized,
      phoneNormalized: normalized.phoneNormalized,
    });

    if (!rateLimitAllowed) {
      throw new ApiError("RATE_LIMITED", "提交过于频繁，请稍候再试", 429);
    }

    const existingIdempotent = await prisma.contactSubmission.findUnique({
      where: { idempotencyKey: validated.idempotencyKey },
      select: { id: true },
    });

    if (existingIdempotent) {
      return ok({ submitted: true });
    }

    const riskReasons = detectRiskReasons(validated);

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "BLOCKED" = "LOW";
    if (riskReasons.length > 0) {
      riskLevel = "MEDIUM";
    }

    let companyName: string | undefined;
    let mediaName: string | undefined;
    let organizerName: string | undefined;

    if (validated.type === "CUSTOMER") {
      companyName = validated.companyName;
    } else if (validated.type === "MEDIA") {
      mediaName = validated.mediaName;
    } else if (validated.type === "EVENT_ORGANIZER") {
      organizerName = validated.organizerName;
    }

    const contentFingerprint = generateContentFingerprint(
      validated.type,
      normalized.phoneNormalized,
      normalized.emailNormalized,
      { companyName, mediaName, organizerName }
    );

    const { exactDuplicate } = await findDuplicates({
      type: validated.type,
      phoneNormalized: normalized.phoneNormalized,
      emailNormalized: normalized.emailNormalized,
      contentFingerprint,
      companyName,
      mediaName,
      organizerName,
    });

    const now = new Date();
    let duplicateOfId: string | undefined;
    let isDuplicate = false;
    let duplicateReason: string | undefined;

    if (exactDuplicate) {
      isDuplicate = true;
      duplicateOfId = exactDuplicate.id;
      duplicateReason = "完全重复提交";
    }

    let notificationStatus: "PENDING" | "SENT" | "FAILED" | "SKIPPED" = "PENDING";
    let notificationError: string | undefined;

    if (
      isDuplicate ||
      riskLevel !== "LOW"
    ) {
      notificationStatus = "SKIPPED";
    }

    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.contactSubmission.create({
        data: {
          type: validated.type,
          locale: validated.locale,
          contactName: validated.contactName,
          phone: normalized.phone,
          phoneNormalized: normalized.phoneNormalized,
          email: normalized.email,
          emailNormalized: normalized.emailNormalized,
          status: "PENDING",
          riskLevel: riskLevel as any,
          riskReasons: JSON.stringify(riskReasons),
          isDuplicate,
          duplicateOfId,
          duplicateReason,
          contentFingerprint,
          idempotencyKey: validated.idempotencyKey,
          sourcePath: referer,
          referrer: referer,
          ipHash,
          userAgent: request.headers.get("user-agent")?.substring(0, 500),
          consentAt: now,
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
          submittedAt: now,
          notificationStatus,
          notificationError,
        },
      });

      if (validated.type === "CUSTOMER") {
        await tx.customerInquiry.create({
          data: {
            submissionId: submission.id,
            companyName: validated.companyName,
            mainBusiness: validated.mainBusiness,
            regionDetail: validated.regionDetail,
            jobTitle: validated.jobTitle || null,
            applicationType: validated.applicationType || null,
            productType: validated.productType || null,
            chemicalSystem: validated.chemicalSystem || null,
            cellShape: validated.cellShape || null,
            specificScenario: validated.specificScenario || null,
            unitPackCapacityKwh: validated.unitPackCapacityKwh || null,
            unitPackVoltageV: validated.unitPackVoltageV || null,
            spaceDimensions: validated.spaceDimensions || null,
            annualElectricityKwh: validated.annualElectricityKwh || null,
            chargingHours: validated.chargingHours || null,
            otherRequirements: validated.otherRequirements || null,
          },
        });
      } else if (validated.type === "MEDIA") {
        await tx.mediaInquiry.create({
          data: {
            submissionId: submission.id,
            mediaName: validated.mediaName,
            inquiryPurpose: validated.inquiryPurpose || null,
            details: validated.details,
          },
        });
      } else if (validated.type === "EVENT_ORGANIZER") {
        await tx.eventOrganizerInquiry.create({
          data: {
            submissionId: submission.id,
            eventName: validated.eventName,
            organizerName: validated.organizerName,
            location: validated.location,
            startAt: new Date(validated.startAt),
            endAt: new Date(validated.endAt),
            inquiryPurpose: validated.inquiryPurpose || null,
            details: validated.details,
          },
        });
      }

      return submission;
    });

    if (notificationStatus === "PENDING") {
      try {
        const emailResult = await sendContactNotificationEmail({
          submissionId: result.id,
          type: validated.type,
          locale: validated.locale,
          contactName: validated.contactName,
          phone: normalized.phone,
          email: normalized.email,
          companyName,
          mediaName,
          organizerName,
          submittedAt: now,
        });

        if (!emailResult.success) {
          await prisma.contactSubmission.update({
            where: { id: result.id },
            data: {
              notificationStatus: "FAILED",
              notificationError: emailResult.error?.substring(0, 255),
            },
          });
        } else {
          await prisma.contactSubmission.update({
            where: { id: result.id },
            data: { notificationStatus: "SENT" },
          });
        }
      } catch (error) {
        console.error("Email notification error:", error);
        await prisma.contactSubmission.update({
          where: { id: result.id },
          data: {
            notificationStatus: "FAILED",
            notificationError: "邮件发送异常",
          },
        });
      }
    }

    return ok({ submitted: true });
  } catch (error) {
    return fail(error);
  }
}
