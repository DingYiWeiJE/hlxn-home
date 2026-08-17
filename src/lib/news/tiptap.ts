import { z } from "zod";

export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
};

const allowedNodes = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "horizontalRule",
  "hardBreak",
  "image",
]);

const allowedMarks = new Set(["bold", "italic", "underline", "link"]);
const maxContentBytes = 512 * 1024;

export const emptyTiptapDocument: TiptapNode = { type: "doc", content: [] };

export function validateTiptapDocument(input: unknown): TiptapNode {
  const size = Buffer.byteLength(JSON.stringify(input), "utf8");
  if (size > maxContentBytes) {
    throw new Error("正文内容过大");
  }

  const document = z
    .object({
      type: z.literal("doc"),
      content: z.array(z.unknown()).optional(),
    })
    .passthrough()
    .parse(input);

  const node = document as TiptapNode;
  validateNode(node);
  return node;
}

function validateNode(node: TiptapNode) {
  if (!allowedNodes.has(node.type)) {
    throw new Error(`不支持的正文节点: ${node.type}`);
  }

  if (node.type === "text" && typeof node.text !== "string") {
    throw new Error("文本节点不正确");
  }

  if (node.type === "heading") {
    const level = node.attrs?.level;
    if (level !== 2 && level !== 3) {
      throw new Error("标题级别仅支持 H2/H3");
    }
  }

  if (node.type === "image") {
    const src = node.attrs?.src;
    if (typeof src !== "string" || !isAllowedImageUrl(src)) {
      throw new Error("图片地址不被允许");
    }
  }

  for (const mark of node.marks ?? []) {
    if (!allowedMarks.has(mark.type)) {
      throw new Error(`不支持的正文样式: ${mark.type}`);
    }
    if (mark.type === "link") {
      const href = mark.attrs?.href;
      if (typeof href !== "string" || !isAllowedLinkUrl(href)) {
        throw new Error("链接地址不被允许");
      }
    }
  }

  for (const child of node.content ?? []) {
    validateNode(child);
  }
}

export function extractTextFromTiptapJson(node: TiptapNode): string {
  const chunks: string[] = [];

  function walk(current: TiptapNode) {
    if (typeof current.text === "string") {
      chunks.push(current.text);
    }

    if (["paragraph", "heading", "listItem", "blockquote"].includes(current.type)) {
      chunks.push(" ");
    }

    for (const child of current.content ?? []) {
      walk(child);
    }
  }

  walk(node);
  return chunks.join("").replace(/\s+/g, " ").trim();
}

export function extractImageUrlsFromTiptapJson(node: TiptapNode): string[] {
  const urls = new Set<string>();

  function walk(current: TiptapNode) {
    if (current.type === "image" && typeof current.attrs?.src === "string") {
      urls.add(current.attrs.src);
    }
    for (const child of current.content ?? []) {
      walk(child);
    }
  }

  walk(node);
  return [...urls];
}

export function isAllowedLinkUrl(url: string) {
  const normalized = url.trim().toLowerCase();
  if (normalized.startsWith("javascript:")) {
    return false;
  }
  return normalized.startsWith("/") || normalized.startsWith("http://") || normalized.startsWith("https://") || normalized.startsWith("mailto:");
}

const allowedLocalImagePrefixes = [
  "/media/",
  "/api/media/",
  "/uploads/",
];

export function isAllowedImageUrl(input: string) {
  const value = input.trim();

  if (!value || value.length > 2048) {
    return false;
  }

  const normalized = value.toLowerCase();

  /*
   * 禁止脚本、内嵌文件、本地文件及协议相对地址。
   */
  if (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("file:") ||
    normalized.startsWith("blob:") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return false;
  }

  /*
   * 允许本站受控的相对媒体地址。
   */
  if (value.startsWith("/")) {
    try {
      const parsed = new URL(value, "https://local.invalid");

      if (parsed.origin !== "https://local.invalid") {
        return false;
      }

      return allowedLocalImagePrefixes.some((prefix) =>
        parsed.pathname.startsWith(prefix),
      );
    } catch {
      return false;
    }
  }

  try {
    const parsed = new URL(value);

    if (
      parsed.username ||
      parsed.password
    ) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    /*
     * 允许通过环境变量配置的可信图片域名。
     * 七牛云在本地开发时允许 HTTP，其他外部域名仍要求 HTTPS。
     */
    const configuredHosts =
      getAllowedExternalImageHosts();

    if (!configuredHosts.has(hostname)) {
      return false;
    }

    // 七牛云域名允许 HTTP 或 HTTPS，其他域名只允许 HTTPS
    const qiniuHosts = getQiniuHosts();
    if (qiniuHosts.has(hostname)) {
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    }

    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getAllowedExternalImageHosts() {
  const hosts = new Set(
    (process.env.ALLOWED_EXTERNAL_IMAGE_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );

  for (const value of [
    process.env.QINIU_DOMAIN,
    process.env.NEXT_PUBLIC_QINIU_DOMAIN,
  ]) {
    if (!value) {
      continue;
    }

    try {
      hosts.add(
        new URL(value).hostname.toLowerCase(),
      );
    } catch {
      // Ignore malformed optional host settings.
    }
  }

  return hosts;
}

function getQiniuHosts() {
  const hosts = new Set<string>();

  for (const value of [
    process.env.QINIU_DOMAIN,
    process.env.NEXT_PUBLIC_QINIU_DOMAIN,
  ]) {
    if (!value) {
      continue;
    }

    try {
      hosts.add(
        new URL(value).hostname.toLowerCase(),
      );
    } catch {
      // Ignore malformed optional host settings.
    }
  }

  return hosts;
}
