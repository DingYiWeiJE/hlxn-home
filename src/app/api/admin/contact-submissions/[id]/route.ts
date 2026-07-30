import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import {
  updateContactSubmissionStatusSchema,
  addContactSubmissionNoteSchema,
} from "@/lib/contact-submissions/schemas";

export const runtime = "nodejs";

function normalizeRiskReasons(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    const { id } = await params;

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
      include: {
        customerInquiry: true,
        mediaInquiry: true,
        eventOrganizerInquiry: true,
        notes: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        duplicateOf: {
          select: { id: true },
        },
        duplicates: {
          select: { id: true },
        },
      },
    });

    if (!submission) {
      throw new ApiError("NOT_FOUND", "提交不存在", 404);
    }

    return ok({
      ...submission,
      riskReasons: normalizeRiskReasons(submission.riskReasons),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    const { id } = await params;

    const body = await request.json();
    const { status } = updateContactSubmissionStatusSchema.parse(body);

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new ApiError("NOT_FOUND", "提交不存在", 404);
    }

    const updated = await prisma.contactSubmission.update({
      where: { id },
      data: { status: status as any },
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    const { id } = await params;

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new ApiError("NOT_FOUND", "提交不存在", 404);
    }

    const deleted = await prisma.contactSubmission.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return ok(deleted);
  } catch (error) {
    return fail(error);
  }
}
