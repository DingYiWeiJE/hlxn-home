import { headers } from "next/headers";

/**
 * 解析当前站点的 origin，供服务端组件内部自请求（fetch 自己的 API 路由）时使用。
 * 优先使用显式配置的环境变量；未配置时从请求头反推，避免在 Vercel 等
 * 无服务器环境下硬编码 fallback（如 http://localhost:3000）导致自请求连接被拒绝。
 */
export async function getSiteOrigin(): Promise<string> {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.APP_ORIGIN ??
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/, "");
  }

  const requestHeaders = await headers();

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    return "http://localhost:3000";
  }

  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");

  const isLocal =
    host.startsWith("localhost") || host.startsWith("127.0.0.1");

  const protocol = forwardedProtocol ?? (isLocal ? "http" : "https");

  return `${protocol}://${host}`;
}
