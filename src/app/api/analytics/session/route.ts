import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";

const sessionSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
  visitorId: z.string().uuid("visitorId must be a valid UUID"),
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

    const validatedData = sessionSchema.parse(body);

    const userAgent = request.headers.get("user-agent");
    const botFlag = isBot(userAgent);
    const ipHash = await getIpHash(request);

    // 使用 upsert 确保并发情况下也只创建一条 session
    // 如果 sessionId 已存在，则返回现有记录（不更新）
    const session = await prisma.analyticsSession.upsert({
      where: { sessionId: validatedData.sessionId },
      update: {
        lastActiveAt: new Date(),
      },
      create: {
        sessionId: validatedData.sessionId,
        visitorId: validatedData.visitorId,
        startedAt: new Date(),
        lastActiveAt: new Date(),
        ipHash,
        userAgent,
        isBot: botFlag,
      },
    });

    return ok({
      sessionId: session.sessionId,
      created: true,
    });
  } catch (error) {
    return fail(error);
  }
}
