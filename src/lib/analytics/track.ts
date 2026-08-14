/**
 * Analytics 埋点核心
 * 负责收集和发送访问统计数据到后端
 */

import { getOrCreateSession } from "./session";

export enum AnalyticsResourceType {
  Page = "page",
  Product = "product",
  News = "news",
  Solution = "solution",
  Case = "case",
  Contact = "contact",
}

export interface TrackEventPayload {
  eventId: string;
  visitorId: string;
  sessionId: string;
  event: string;
  resourceType: AnalyticsResourceType;
  resourceId?: string;
  path: string;
}

const API_ENDPOINT = "/api/analytics/track";
const TRACK_TIMEOUT_MS = 5000; // 5 秒超时

/**
 * 发送埋点数据到后端
 * 采用 sendBeacon 保证数据可靠性（如页面卸载时）
 * 如果浏览器不支持 sendBeacon，则回退到 fetch
 */
async function sendTrackingData(payload: TrackEventPayload): Promise<void> {
  try {
    // 优先使用 sendBeacon，性能更好且不会被页面卸载中断
    if (navigator.sendBeacon) {
      navigator.sendBeacon(API_ENDPOINT, JSON.stringify(payload));
      return;
    }

    // 回退方案：使用 fetch with keepalive
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TRACK_TIMEOUT_MS);

    try {
      await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // 埋点错误不应该影响页面正常展示
    // 仅在开发环境下输出日志
    if (process.env.NODE_ENV === "development") {
      console.debug("Analytics track failed:", error);
    }
  }
}

/**
 * 追踪页面访问
 *
 * @param resourceType - 资源类型
 * @param resourceId - 资源 ID（可选）
 * @param path - 页面路径
 */
export async function trackPageView(
  resourceType: AnalyticsResourceType,
  options?: {
    resourceId?: string;
    path?: string;
  },
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const { visitorId, sessionId, isNewSession } = getOrCreateSession();

  if (!visitorId || !sessionId) {
    if (process.env.NODE_ENV === "development") {
      console.debug("Failed to get visitor or session ID");
    }
    return;
  }

  // 首次访问时先创建 Session 记录
  if (isNewSession) {
    try {
      await fetch("/api/analytics/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          visitorId,
        }),
        keepalive: true,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.debug("Failed to create session:", error);
      }
    }
  }

  const payload: TrackEventPayload = {
    eventId: crypto.randomUUID(),
    visitorId,
    sessionId,
    event: "page_view",
    resourceType,
    resourceId: options?.resourceId,
    path: options?.path || window.location.pathname,
  };

  await sendTrackingData(payload);
}

/**
 * 手动追踪自定义事件
 */
export async function trackCustomEvent(
  eventType: string,
  resourceType: AnalyticsResourceType,
  options?: {
    resourceId?: string;
    path?: string;
  },
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const { visitorId, sessionId } = getOrCreateSession();

  if (!visitorId || !sessionId) {
    return;
  }

  const payload: TrackEventPayload = {
    eventId: crypto.randomUUID(),
    visitorId,
    sessionId,
    event: eventType,
    resourceType,
    resourceId: options?.resourceId,
    path: options?.path || window.location.pathname,
  };

  await sendTrackingData(payload);
}
