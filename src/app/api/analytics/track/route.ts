import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";

const trackingSchema = z.object({
  eventId: z.string().uuid("eventId must be a valid UUID"),
  visitorId: z.string().uuid("visitorId must be a valid UUID"),
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
  event: z.string().min(1).max(50),
  resourceType: z.enum([
    "page",
    "product",
    "news",
    "solution",
    "case",
    "contact",
  ]),
  resourceId: z.string().optional().nullable(),
  path: z.string().min(1).max(500),
});

/**
 * 识别是否为爬虫/机器人
 */
function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) {
    return false;
  }

  const botPatterns = [
    "Googlebot",
    "Bingbot",
    "baiduspider",
    "YandexBot",
    "GPTBot",
    "ClaudeBot",
    "AhrefsBot",
    "SemrushBot",
    "MJ12bot",
    "curl",
    "wget",
    "Slurp",
    "DuckDuckBot",
    "Baiduspider",
    "FacebookExternalHit",
    "Twitterbot",
    "LinkedInBot",
    "WhatsApp",
    "Telegram",
    "Slack",
  ];

  const lowerUserAgent = userAgent.toLowerCase();
  return botPatterns.some((pattern) =>
    lowerUserAgent.includes(pattern.toLowerCase()),
  );
}

/**
 * 从请求头提取 IP 并 hash
 */
async function getIpHash(request: NextRequest): Promise<string | null> {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      null;

    if (!ip) {
      return null;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(ip + (process.env.IP_HASH_SALT || "salt"));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 参数校验
    const validatedData = trackingSchema.parse(body);

    // 检查 resourceId：对于特定资源类型，resourceId 必须存在
    if (
      ["product", "news", "solution", "case"].includes(
        validatedData.resourceType,
      ) &&
      !validatedData.resourceId
    ) {
      return fail(
        new Error(
          `resourceId is required for ${validatedData.resourceType} resource type`,
        ),
      );
    }

    const userAgent = request.headers.get("user-agent");
    const botFlag = isBot(userAgent);
    const ipHash = await getIpHash(request);

    // 检查 eventId 是否已存在（防止重复）
    const existingPageView = await prisma.analyticsPageView.findUnique({
      where: { eventId: validatedData.eventId },
    });

    if (existingPageView) {
      // 重复请求，返回成功但不重复计数
      return ok({ duplicated: true });
    }

    // 确保 session 存在，如不存在则创建
    await prisma.analyticsSession.upsert({
      where: { sessionId: validatedData.sessionId },
      update: { lastActiveAt: new Date() },
      create: {
        sessionId: validatedData.sessionId,
        visitorId: validatedData.visitorId,
        ipHash,
        userAgent,
        isBot: botFlag,
      },
    });

    // 记录页面访问
    await prisma.analyticsPageView.create({
      data: {
        eventId: validatedData.eventId,
        visitorId: validatedData.visitorId,
        sessionId: validatedData.sessionId,
        resourceType: validatedData.resourceType,
        resourceId: validatedData.resourceId || null,
        path: validatedData.path,
      },
    });

    return ok({ tracked: true });
  } catch (error) {
    return fail(error);
  }
}
