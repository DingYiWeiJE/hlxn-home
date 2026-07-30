import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { adminContactSubmissionListQuerySchema } from "@/lib/contact-submissions/schemas";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor();

    const query = adminContactSubmissionListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    const where: Prisma.ContactSubmissionWhereInput = {
      deletedAt: query.deleted ? { not: null } : null,
      ...(query.type ? { type: query.type as any } : {}),
      ...(query.locale ? { locale: query.locale } : {}),
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.riskLevel ? { riskLevel: query.riskLevel as any } : {}),
      ...(query.notificationStatus
        ? { notificationStatus: query.notificationStatus as any }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            submittedAt: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {}),
            },
          }
        : {}),
      ...(query.keyword
        ? {
            OR: [
              { contactName: { contains: query.keyword, mode: "insensitive" } },
              {
                phoneNormalized: { contains: query.keyword, mode: "insensitive" },
              },
              {
                emailNormalized: { contains: query.keyword, mode: "insensitive" },
              },
              {
                customerInquiry: {
                  companyName: { contains: query.keyword, mode: "insensitive" },
                },
              },
              {
                mediaInquiry: {
                  mediaName: { contains: query.keyword, mode: "insensitive" },
                },
              },
              {
                eventOrganizerInquiry: {
                  organizerName: { contains: query.keyword, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
      ...(query.duplicate === "duplicate" ? { isDuplicate: true } : {}),
      ...(query.duplicate === "not_duplicate" ? { isDuplicate: false } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.contactSubmission.findMany({
        where,
        select: {
          id: true,
          type: true,
          locale: true,
          contactName: true,
          phone: true,
          email: true,
          status: true,
          riskLevel: true,
          isDuplicate: true,
          notificationStatus: true,
          submittedAt: true,
          customerInquiry: {
            select: { companyName: true },
          },
          mediaInquiry: {
            select: { mediaName: true },
          },
          eventOrganizerInquiry: {
            select: { organizerName: true },
          },
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sort]: query.order },
      }),
      prisma.contactSubmission.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.pageSize);

    return ok({
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
