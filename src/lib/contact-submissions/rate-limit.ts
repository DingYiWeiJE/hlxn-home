import { prisma } from "@/lib/prisma";

const RATE_LIMIT_RULES = {
  IP_10MIN: { minutes: 10, maxRequests: 5 },
  IP_24HOUR: { minutes: 24 * 60, maxRequests: 20 },
  CONTACT_1HOUR: { minutes: 60, maxRequests: 3 },
};

export async function checkRateLimit(params: {
  ipHash: string | null;
  emailNormalized?: string | null;
  phoneNormalized?: string | null;
}): Promise<{ allowed: boolean; reasons: string[] }> {
  const reasons: string[] = [];
  const now = new Date();

  if (params.ipHash) {
    const ip10Min = await prisma.contactSubmission.count({
      where: {
        ipHash: params.ipHash,
        submittedAt: {
          gte: new Date(now.getTime() - RATE_LIMIT_RULES.IP_10MIN.minutes * 60 * 1000),
        },
        deletedAt: null,
      },
    });

    if (ip10Min >= RATE_LIMIT_RULES.IP_10MIN.maxRequests) {
      reasons.push("IP_RATE_LIMIT_10MIN");
    }

    const ip24h = await prisma.contactSubmission.count({
      where: {
        ipHash: params.ipHash,
        submittedAt: {
          gte: new Date(now.getTime() - RATE_LIMIT_RULES.IP_24HOUR.minutes * 60 * 1000),
        },
        deletedAt: null,
      },
    });

    if (ip24h >= RATE_LIMIT_RULES.IP_24HOUR.maxRequests) {
      reasons.push("IP_RATE_LIMIT_24H");
    }
  }

  if (params.emailNormalized) {
    const email1h = await prisma.contactSubmission.count({
      where: {
        emailNormalized: params.emailNormalized,
        submittedAt: {
          gte: new Date(now.getTime() - RATE_LIMIT_RULES.CONTACT_1HOUR.minutes * 60 * 1000),
        },
        deletedAt: null,
      },
    });

    if (email1h >= RATE_LIMIT_RULES.CONTACT_1HOUR.maxRequests) {
      reasons.push("EMAIL_RATE_LIMIT_1H");
    }
  }

  if (params.phoneNormalized) {
    const phone1h = await prisma.contactSubmission.count({
      where: {
        phoneNormalized: params.phoneNormalized,
        submittedAt: {
          gte: new Date(now.getTime() - RATE_LIMIT_RULES.CONTACT_1HOUR.minutes * 60 * 1000),
        },
        deletedAt: null,
      },
    });

    if (phone1h >= RATE_LIMIT_RULES.CONTACT_1HOUR.maxRequests) {
      reasons.push("PHONE_RATE_LIMIT_1H");
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}
