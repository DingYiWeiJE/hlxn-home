import { prisma } from "@/lib/prisma";
import { ContactSubmissionType } from "@prisma/client";

export async function findDuplicates(params: {
  type: ContactSubmissionType;
  phoneNormalized?: string | null;
  emailNormalized?: string | null;
  contentFingerprint?: string | null;
  companyName?: string | null;
  mediaName?: string | null;
  organizerName?: string | null;
}) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const exactDuplicateWhere: any = {
    type: params.type,
    submittedAt: { gte: twentyFourHoursAgo },
    deletedAt: null,
  };

  if (
    params.contentFingerprint &&
    params.phoneNormalized &&
    params.emailNormalized
  ) {
    exactDuplicateWhere.OR = [
      {
        contentFingerprint: params.contentFingerprint,
        phoneNormalized: params.phoneNormalized,
      },
      {
        contentFingerprint: params.contentFingerprint,
        emailNormalized: params.emailNormalized,
      },
    ];
  } else if (params.contentFingerprint) {
    exactDuplicateWhere.contentFingerprint = params.contentFingerprint;
  }

  const exactDuplicate = await prisma.contactSubmission.findFirst({
    where: exactDuplicateWhere,
    select: { id: true },
    orderBy: { submittedAt: "desc" },
  });

  const possibleDuplicateWhere: any = {
    type: params.type,
    submittedAt: { gte: thirtyDaysAgo },
    deletedAt: null,
  };

  const orConditions: any[] = [];

  if (params.emailNormalized) {
    orConditions.push({ emailNormalized: params.emailNormalized });
  }

  if (params.phoneNormalized) {
    orConditions.push({ phoneNormalized: params.phoneNormalized });
  }

  if (params.companyName) {
    orConditions.push({
      customerInquiry: { companyName: params.companyName },
    });
  }

  if (params.mediaName) {
    orConditions.push({ mediaInquiry: { mediaName: params.mediaName } });
  }

  if (params.organizerName) {
    orConditions.push({
      eventOrganizerInquiry: { organizerName: params.organizerName },
    });
  }

  if (orConditions.length > 0) {
    possibleDuplicateWhere.OR = orConditions;
  }

  const possibleDuplicates = await prisma.contactSubmission.findMany({
    where: possibleDuplicateWhere,
    select: { id: true },
    orderBy: { submittedAt: "desc" },
    take: 5,
  });

  return {
    exactDuplicate,
    possibleDuplicates,
  };
}
