/**
 * Session 管理 - 在浏览器端生成并管理
 * 使用 crypto.randomUUID() 生成唯一 sessionId
 * 通过 sessionStorage 保存，30 分钟无活动后过期
 */

import { getOrCreateVisitorId } from "./visitor";

const SESSION_ID_STORAGE_KEY = "hlxn_session_id";
const SESSION_CREATED_AT_KEY = "hlxn_session_created_at";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 分钟

export interface SessionInfo {
  visitorId: string;
  sessionId: string;
  isNewSession: boolean;
}

export function getOrCreateSession(): SessionInfo {
  if (typeof window === "undefined") {
    return {
      visitorId: "",
      sessionId: "",
      isNewSession: false,
    };
  }

  try {
    const visitorId = getOrCreateVisitorId();
    const storedSessionId = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    const storedCreatedAt = sessionStorage.getItem(SESSION_CREATED_AT_KEY);

    const now = Date.now();
    const createdAt = storedCreatedAt ? parseInt(storedCreatedAt, 10) : now;
    const isExpired =
      !storedSessionId || now - createdAt > SESSION_TIMEOUT_MS;

    if (storedSessionId && !isExpired) {
      // Session 仍然有效
      return {
        visitorId,
        sessionId: storedSessionId,
        isNewSession: false,
      };
    }

    // 创建新 Session
    const newSessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_STORAGE_KEY, newSessionId);
    sessionStorage.setItem(SESSION_CREATED_AT_KEY, now.toString());

    return {
      visitorId,
      sessionId: newSessionId,
      isNewSession: true,
    };
  } catch (error) {
    console.error("Failed to manage session:", error);
    return {
      visitorId: "",
      sessionId: "",
      isNewSession: false,
    };
  }
}

/**
 * 更新 Session 的最后活动时间
 * 用于判断 Session 是否即将过期
 */
export function updateSessionActivity(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(SESSION_CREATED_AT_KEY, Date.now().toString());
  } catch (error) {
    console.error("Failed to update session activity:", error);
  }
}
