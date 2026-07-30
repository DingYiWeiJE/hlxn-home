import { createHmac } from "crypto";

function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  return phone
    .replace(/\s+/g, "")
    .replace(/[-()]/g, "")
    .replace(/^0+/, "");
}

function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\x00-\x1F\x7F]/g, "");
}

export function normalizeContactInput(input: {
  phone?: string | null;
  email?: string | null;
  [key: string]: any;
}) {
  return {
    ...input,
    phone: input.phone ? normalizeText(input.phone) : input.phone,
    phoneNormalized: input.phone
      ? normalizePhoneNumber(normalizeText(input.phone))
      : undefined,
    email: input.email ? normalizeText(input.email) : input.email,
    emailNormalized: input.email
      ? normalizeText(input.email).toLowerCase()
      : undefined,
  };
}

export function hashIP(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const secret = process.env.CONTACT_IP_HASH_SECRET || "default-secret";
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export function generateContentFingerprint(
  type: string,
  phone: string | null | undefined,
  email: string | null | undefined,
  content: Record<string, any>
): string {
  const secret = process.env.CONTACT_IP_HASH_SECRET || "default-secret";
  const phoneNorm = phone ? normalizePhoneNumber(phone) : "";
  const emailNorm = email ? normalizeText(email).toLowerCase() : "";

  const coreFields = [
    type,
    phoneNorm,
    emailNorm,
    JSON.stringify(content).substring(0, 500),
  ]
    .filter(Boolean)
    .join("|");

  return createHmac("sha256", secret).update(coreFields).digest("hex");
}

export function sanitizeUserAgent(ua: string | undefined): string {
  if (!ua) return "";
  return ua.substring(0, 500);
}

export function cleanUserContent(text: string | null | undefined): string {
  if (!text) return "";

  let cleaned = normalizeText(text);

  if (/<script|<iframe|<object|<embed|javascript:/i.test(cleaned)) {
    cleaned = cleaned.replace(/<[^>]*>/g, "");
  }

  return cleaned;
}

export function detectRiskReasons(input: {
  phone?: string | null;
  email?: string | null;
  [key: string]: any;
}): string[] {
  const reasons: string[] = [];

  const textFields = Object.entries(input)
    .filter(([k]) => !["phone", "email", "type", "locale", "formStartedAt", "turnstileToken", "website"].includes(k))
    .map(([, v]) => (typeof v === "string" ? v : ""))
    .join(" ");

  const urlCount = (textFields.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) {
    reasons.push("TOO_MANY_URLS");
  }

  if (/<[^>]*>/i.test(textFields)) {
    reasons.push("HTML_CONTENT");
  }

  if (/[\x00-\x1F]/g.test(textFields)) {
    reasons.push("CONTROL_CHARACTERS");
  }

  const repetitiveMatch = textFields.match(/(.)\1{5,}/);
  if (repetitiveMatch) {
    reasons.push("REPETITIVE_TEXT");
  }

  return [...new Set(reasons)];
}
