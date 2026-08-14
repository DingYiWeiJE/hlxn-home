/**
 * 访客 ID 管理 - 在浏览器端生成并持久化
 * 使用 crypto.randomUUID() 生成唯一 ID
 * 保存在 localStorage 中，用于长期识别访客
 */

const VISITOR_ID_STORAGE_KEY = "hlxn_visitor_id";

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const stored = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (stored && stored.length > 0) {
      return stored;
    }

    const visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
    return visitorId;
  } catch (error) {
    console.error("Failed to manage visitor ID:", error);
    return "";
  }
}
