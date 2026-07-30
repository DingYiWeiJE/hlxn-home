import { ContactSubmissionType } from "@prisma/client";

function getRecipients(type: ContactSubmissionType): string[] {
  const mapping: Record<ContactSubmissionType, string> = {
    CUSTOMER: process.env.CONTACT_CUSTOMER_RECIPIENTS || "",
    MEDIA: process.env.CONTACT_MEDIA_RECIPIENTS || "",
    EVENT_ORGANIZER: process.env.CONTACT_EVENT_RECIPIENTS || "",
  };

  const recipients = mapping[type] || "";
  return recipients
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}

export async function sendContactNotificationEmail(params: {
  submissionId: string;
  type: ContactSubmissionType;
  locale: string;
  contactName: string;
  phone?: string | null;
  email?: string | null;
  companyName?: string;
  mediaName?: string;
  organizerName?: string;
  submittedAt: Date;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const recipients = getRecipients(params.type);

    if (recipients.length === 0) {
      console.warn("[CONTACT EMAIL] No recipients configured for type", params.type);
      return {
        success: false,
        error: "No recipients configured",
      };
    }

    const typeLabel =
      params.type === "CUSTOMER"
        ? "客户咨询"
        : params.type === "MEDIA"
          ? "媒体咨询"
          : "活动主办方咨询";

    const localeLabel = params.locale === "zh" ? "中文" : "英文";
    const name = params.companyName || params.mediaName || params.organizerName || "";

    console.log(
      `[CONTACT EMAIL] Would send email for ${typeLabel} from ${name} to ${recipients.join(", ")}`
    );

    return { success: true };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[CONTACT EMAIL] Send failed:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
