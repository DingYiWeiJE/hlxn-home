import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { addContactSubmissionNoteSchema } from "@/lib/contact-submissions/schemas";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdminActor();
    const { id } = await params;

    const body = await request.json();
    const { content } = addContactSubmissionNoteSchema.parse(body);

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new ApiError("NOT_FOUND", "提交不存在", 404);
    }

    const note = await prisma.contactSubmissionNote.create({
      data: {
        submissionId: id,
        content,
        createdById: actor.userId || undefined,
      },
    });

    return ok(note);
  } catch (error) {
    return fail(error);
  }
}
