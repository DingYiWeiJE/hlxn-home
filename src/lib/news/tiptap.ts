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

export function isAllowedImageUrl(url: string) {
  const normalized = url.trim().toLowerCase();
  if (normalized.startsWith("javascript:") || normalized.startsWith("data:") || normalized.startsWith("file:")) {
    return false;
  }
  if (url.startsWith("/media/")) {
    return true;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return false;
    }
    const allowedHosts = (process.env.ALLOWED_EXTERNAL_IMAGE_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);
    return allowedHosts.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}
