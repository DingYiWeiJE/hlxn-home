import {
  ContactSubmissionType,
  ContactSubmissionStatus,
  ContactSubmissionRiskLevel,
  ContactSubmissionNotificationStatus,
} from "@prisma/client";

export type {
  ContactSubmissionType,
  ContactSubmissionStatus,
  ContactSubmissionRiskLevel,
  ContactSubmissionNotificationStatus,
};

export const CONTACT_SUBMISSION_TYPES = {
  CUSTOMER: "CUSTOMER" as const,
  MEDIA: "MEDIA" as const,
  EVENT_ORGANIZER: "EVENT_ORGANIZER" as const,
};

export const CONTACT_SUBMISSION_STATUSES = {
  PENDING: "PENDING" as const,
  FOLLOWING_UP: "FOLLOWING_UP" as const,
  CONTACTED: "CONTACTED" as const,
  COMPLETED: "COMPLETED" as const,
  INVALID: "INVALID" as const,
  SPAM: "SPAM" as const,
};

export const CONTACT_RISK_LEVELS = {
  LOW: "LOW" as const,
  MEDIUM: "MEDIUM" as const,
  HIGH: "HIGH" as const,
  BLOCKED: "BLOCKED" as const,
};

export const RISK_REASON_TYPES = {
  TOO_MANY_URLS: "TOO_MANY_URLS" as const,
  HTML_CONTENT: "HTML_CONTENT" as const,
  CONTROL_CHARACTERS: "CONTROL_CHARACTERS" as const,
  REPETITIVE_TEXT: "REPETITIVE_TEXT" as const,
  SUSPICIOUS_PATTERN: "SUSPICIOUS_PATTERN" as const,
  TOO_FAST: "TOO_FAST" as const,
  HONEYPOT: "HONEYPOT" as const,
  TURNSTILE_FAILED: "TURNSTILE_FAILED" as const,
  RATE_LIMITED: "RATE_LIMITED" as const,
  EXACT_DUPLICATE: "EXACT_DUPLICATE" as const,
  POSSIBLE_DUPLICATE: "POSSIBLE_DUPLICATE" as const,
};

export const PRIVACY_POLICY_VERSION = "2026-07";
