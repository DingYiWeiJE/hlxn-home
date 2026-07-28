import "server-only";

import { createHash } from "node:crypto";
import type { AnyNode } from "domhandler";
import * as cheerio from "cheerio";

import type { TiptapNode } from "@/lib/news/tiptap";

const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;

const WECHAT_HOST = "mp.weixin.qq.com";

export type WechatRemoteImage = {
  url: string;
  alt: string | null;
};

export type ParsedWechatArticle = {
  title: string;
  summary: string | null;
  authorName: string | null;

  content: TiptapNode;

  sourceType: "WECHAT";
  sourceUrl: string;
  sourceAccountName: string | null;
  sourceArticleId: string;
  sourcePublishedAt: string | null;

  remoteCoverImage: string | null;
  remoteImages: WechatRemoteImage[];

  importMeta: {
    parserVersion: 1;
    importedFrom: "WECHAT";
    fetchedUrl: string;
    remoteCoverImage: string | null;
    remoteImages: WechatRemoteImage[];
    originalTitle: string;
  };
};

export class WechatImportError extends Error {
  readonly code:
    | "INVALID_WECHAT_URL"
    | "WECHAT_FETCH_FAILED"
    | "WECHAT_ACCESS_RESTRICTED"
    | "WECHAT_ARTICLE_NOT_FOUND"
    | "WECHAT_RESPONSE_TOO_LARGE"
    | "WECHAT_PARSE_FAILED";

  readonly status: number;

  constructor(
    code: WechatImportError["code"],
    message: string,
    status = 400,
  ) {
    super(message);

    this.name = "WechatImportError";
    this.code = code;
    this.status = status;
  }
}

export async function parseWechatArticle(
  inputUrl: string,
): Promise<ParsedWechatArticle> {
  const requestedUrl = validateWechatUrl(inputUrl);

  const {
    html,
    finalUrl,
  } = await fetchWechatHtml(requestedUrl);

  detectWechatRestrictionPage(html);

  const $ = cheerio.load(html);

  const contentRoot = $("#js_content").first();

  if (contentRoot.length === 0) {
    throw new WechatImportError(
      "WECHAT_ARTICLE_NOT_FOUND",
      "没有找到微信公众号文章正文，文章可能已删除、设置了访问限制或链接已经失效",
      404,
    );
  }

  cleanWechatContent($, contentRoot);

  const title = firstNonEmpty([
    normalizeText(
      $("#activity-name").first().text(),
    ),
    normalizeText(
      $('meta[property="og:title"]').attr("content"),
    ),
    normalizeText(
      $("title").first().text(),
    ),
  ]);

  if (!title) {
    throw new WechatImportError(
      "WECHAT_PARSE_FAILED",
      "无法解析微信公众号文章标题",
      422,
    );
  }

  const sourceAccountName = firstNonEmpty([
    normalizeText(
      $("#js_name").first().text(),
    ),
    normalizeText(
      $('meta[property="og:site_name"]').attr("content"),
    ),
  ]);

  const authorName = firstNonEmpty([
    normalizeText(
      $('meta[name="author"]').attr("content"),
    ),
    normalizeText(
      $(".rich_media_meta_text")
        .first()
        .text(),
    ),
    sourceAccountName,
  ]);

  const summary = truncateText(
    firstNonEmpty([
      normalizeText(
        $('meta[name="description"]').attr("content"),
      ),
      normalizeText(
        $('meta[property="og:description"]').attr("content"),
      ),
      createSummaryFromContent(
        contentRoot.text(),
      ),
    ]),
    1000,
  );

  const sourcePublishedAt =
    parseWechatPublishedAt($, html);

  const remoteCoverImage = normalizeWechatImageUrl(
    firstNonEmpty([
      $('meta[property="og:image"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
    ]),
    finalUrl,
  );

  const remoteImages = extractWechatImages(
    $,
    contentRoot,
    finalUrl,
  );

  const content = convertWechatContentToTiptap(
    $,
    contentRoot,
    finalUrl,
  );

  const sourceUrl = normalizeWechatArticleUrl(
    finalUrl,
  );

  const sourceArticleId = createHash("sha256")
    .update(sourceUrl)
    .digest("hex")
    .slice(0, 40);

  return {
    title: truncateText(title, 200) ?? title,
    summary,
    authorName: truncateText(authorName, 100),

    content,

    sourceType: "WECHAT",
    sourceUrl,
    sourceAccountName: truncateText(
      sourceAccountName,
      200,
    ),
    sourceArticleId,
    sourcePublishedAt,

    remoteCoverImage,
    remoteImages,

    importMeta: {
      parserVersion: 1,
      importedFrom: "WECHAT",
      fetchedUrl: finalUrl,
      remoteCoverImage,
      remoteImages,
      originalTitle: title,
    },
  };
}

function validateWechatUrl(
  inputUrl: string,
): URL {
  let url: URL;

  try {
    url = new URL(inputUrl.trim());
  } catch {
    throw new WechatImportError(
      "INVALID_WECHAT_URL",
      "微信公众号文章地址格式不正确",
      400,
    );
  }

  if (url.protocol !== "https:") {
    throw new WechatImportError(
      "INVALID_WECHAT_URL",
      "微信公众号文章地址必须使用 HTTPS",
      400,
    );
  }

  if (!isWechatHostname(url.hostname)) {
    throw new WechatImportError(
      "INVALID_WECHAT_URL",
      "仅支持 mp.weixin.qq.com 的微信公众号文章地址",
      400,
    );
  }

  url.hash = "";

  return url;
}

function isWechatHostname(
  hostname: string,
) {
  const normalized =
    hostname.toLowerCase();

  return (
    normalized === WECHAT_HOST ||
    normalized.endsWith(
      `.${WECHAT_HOST}`,
    )
  );
}

async function fetchWechatHtml(
  initialUrl: URL,
): Promise<{
  html: string;
  finalUrl: string;
}> {
  let currentUrl = initialUrl;

  for (
    let redirectCount = 0;
    redirectCount <= MAX_REDIRECTS;
    redirectCount += 1
  ) {
    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      FETCH_TIMEOUT_MS,
    );

    let response: Response;

    try {
      response = await fetch(
        currentUrl,
        {
          method: "GET",
          redirect: "manual",
          cache: "no-store",
          signal: controller.signal,

          headers: {
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

            "Accept-Language":
              "zh-CN,zh;q=0.9,en;q=0.7",

            "Cache-Control":
              "no-cache",

            Pragma:
              "no-cache",

            Referer:
              "https://mp.weixin.qq.com/",

            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
              "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          },
        },
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new WechatImportError(
          "WECHAT_FETCH_FAILED",
          "微信公众号文章请求超时，请稍后重试",
          504,
        );
      }

      throw new WechatImportError(
        "WECHAT_FETCH_FAILED",
        "无法访问微信公众号文章，请检查服务器网络和文章地址",
        502,
      );
    } finally {
      clearTimeout(timeout);
    }

    if (
      response.status >= 300 &&
      response.status < 400
    ) {
      const location =
        response.headers.get("location");

      if (!location) {
        throw new WechatImportError(
          "WECHAT_FETCH_FAILED",
          "微信公众号返回了无效的跳转地址",
          502,
        );
      }

      if (
        redirectCount ===
        MAX_REDIRECTS
      ) {
        throw new WechatImportError(
          "WECHAT_FETCH_FAILED",
          "微信公众号文章跳转次数过多",
          502,
        );
      }

      const redirectUrl =
        new URL(
          location,
          currentUrl,
        );

      currentUrl =
        validateWechatUrl(
          redirectUrl.toString(),
        );

      continue;
    }

    if (!response.ok) {
      throw new WechatImportError(
        "WECHAT_FETCH_FAILED",
        `微信公众号文章请求失败，状态码：${response.status}`,
        response.status >= 500
          ? 502
          : 400,
      );
    }

    const contentLength =
      Number(
        response.headers.get(
          "content-length",
        ) ?? 0,
      );

    if (
      Number.isFinite(
        contentLength,
      ) &&
      contentLength >
        MAX_HTML_BYTES
    ) {
      throw new WechatImportError(
        "WECHAT_RESPONSE_TOO_LARGE",
        "微信公众号文章内容过大，无法导入",
        413,
      );
    }

    const contentType =
      response.headers
        .get("content-type")
        ?.toLowerCase() ?? "";

    if (
      contentType &&
      !contentType.includes(
        "text/html",
      ) &&
      !contentType.includes(
        "application/xhtml+xml",
      )
    ) {
      throw new WechatImportError(
        "WECHAT_FETCH_FAILED",
        "微信公众号返回的内容不是网页文章",
        422,
      );
    }

    const html =
      await response.text();

    if (
      Buffer.byteLength(
        html,
        "utf8",
      ) > MAX_HTML_BYTES
    ) {
      throw new WechatImportError(
        "WECHAT_RESPONSE_TOO_LARGE",
        "微信公众号文章内容过大，无法导入",
        413,
      );
    }

    return {
      html,
      finalUrl:
        currentUrl.toString(),
    };
  }

  throw new WechatImportError(
    "WECHAT_FETCH_FAILED",
    "微信公众号文章获取失败",
    502,
  );
}

function detectWechatRestrictionPage(
  html: string,
) {
  const normalized =
    html.toLowerCase();

  const restricted =
    html.includes("环境异常") ||
    html.includes("访问过于频繁") ||
    html.includes("请完成验证") ||
    html.includes("操作频繁") ||
    html.includes("该内容已被发布者删除") ||
    normalized.includes(
      "verify_page",
    ) ||
    normalized.includes(
      "captcha",
    );

  if (restricted) {
    throw new WechatImportError(
      "WECHAT_ACCESS_RESTRICTED",
      "微信公众号限制了服务器访问，可能需要稍后重试或更换服务器出口网络",
      429,
    );
  }
}

function cleanWechatContent(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<
    AnyNode
  >,
) {
  root
    .find(
      [
        "script",
        "style",
        "noscript",
        "iframe",
        "form",
        "button",
        "svg",
        "canvas",
        "video",
        "audio",
        ".js_ad_link",
        ".rich_media_tool",
        ".reward_area",
        ".wx_profile_card_inner",
      ].join(","),
    )
    .remove();

  root
    .find("[hidden]")
    .remove();

  root
    .find("br")
    .replaceWith("\n");

  root
    .find("*")
    .each((_, element) => {
      const item = $(element);

      item.removeAttr("style");
      item.removeAttr("class");
      item.removeAttr("id");
      item.removeAttr("onclick");
      item.removeAttr("onerror");
      item.removeAttr("onload");
    });
}

function extractWechatImages(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<
    AnyNode
  >,
  baseUrl: string,
): WechatRemoteImage[] {
  const result:
    WechatRemoteImage[] = [];

  const seen =
    new Set<string>();

  root
    .find("img")
    .each((_, element) => {
      const image =
        $(element);

      const rawUrl =
        firstNonEmpty([
          image.attr("data-src"),
          image.attr(
            "data-original",
          ),
          image.attr("src"),
        ]);

      const url =
        normalizeWechatImageUrl(
          rawUrl,
          baseUrl,
        );

      if (
        !url ||
        seen.has(url)
      ) {
        return;
      }

      seen.add(url);

      result.push({
        url,
        alt:
          truncateText(
            normalizeText(
              image.attr("alt"),
            ),
            200,
          ),
      });
    });

  return result;
}

function convertWechatContentToTiptap(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>,
  baseUrl: string,
): TiptapNode {
  const nodes: TiptapNode[] = [];
  const seenImages = new Set<string>();

  root
    .find(
      [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "blockquote",
        "pre",
        "li",
        "img",
      ].join(","),
    )
    .each((_, element) => {
      const item = $(element);
      const tagName =
        element.type === "tag"
          ? element.name.toLowerCase()
          : "";

      /*
       * 微信图片通常真正地址保存在 data-src，
       * src 可能只是占位图片。
       */
      if (tagName === "img") {
        const rawImageUrl = firstNonEmpty([
          item.attr("data-src"),
          item.attr("data-original"),
          item.attr("data-backsrc"),
          item.attr("src"),
        ]);

        const imageUrl = normalizeWechatImageUrl(
          rawImageUrl,
          baseUrl,
        );

        if (!imageUrl || seenImages.has(imageUrl)) {
          return;
        }

        seenImages.add(imageUrl);

        const alt =
          truncateText(
            item.attr("alt"),
            200,
          ) ?? "";

        nodes.push({
          type: "image",
          attrs: {
            src: imageUrl,
            alt,
            title: null,
          },
        });

        return;
      }

      /*
       * 文本节点中删除图片，避免图片说明或占位内容
       * 被重复转换成普通文本。
       */
      const cloned = item.clone();

      cloned.find("img").remove();
      cloned.find("br").replaceWith("\n");

      const text = normalizeParagraphText(
        cloned.text(),
      );

      if (!text) {
        return;
      }

      const paragraphs = text
        .split(/\n+/)
        .map((value) => normalizeText(value))
        .filter(Boolean);

      for (const paragraph of paragraphs) {
        const previousNode =
          nodes[nodes.length - 1];

        /*
         * 避免微信公众号复杂嵌套结构导致相邻文字重复。
         */
        if (
          previousNode?.type === "paragraph" &&
          previousNode.content?.[0]?.type === "text" &&
          previousNode.content[0].text === paragraph
        ) {
          continue;
        }

        if (/^h[1-6]$/.test(tagName)) {
          const originalLevel = Number(tagName.slice(1));

          /*
          * 当前新闻编辑器只支持 H2 和 H3：
          * H1、H2 统一转换为 H2；
          * H3 至 H6 统一转换为 H3。
          */
          const level = originalLevel <= 2 ? 2 : 3;

          nodes.push({
            type: "heading",
            attrs: {
              level,
            },
            content: [
              {
                type: "text",
                text: paragraph,
              },
            ],
          });

          continue;
        }

        if (tagName === "blockquote") {
          nodes.push({
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: paragraph,
                  },
                ],
              },
            ],
          });

          continue;
        }

        if (tagName === "pre") {
          nodes.push({
            type: "codeBlock",
            content: [
              {
                type: "text",
                text: paragraph,
              },
            ],
          });

          continue;
        }

        nodes.push({
          type: "paragraph",
          content: [
            {
              type: "text",
              text: paragraph,
            },
          ],
        });
      }
    });

  if (nodes.length === 0) {
    const fallbackText = normalizeParagraphText(
      root.text(),
    );

    for (const paragraph of fallbackText.split(/\n+/)) {
      const text = normalizeText(paragraph);

      if (!text) {
        continue;
      }

      nodes.push({
        type: "paragraph",
        content: [
          {
            type: "text",
            text,
          },
        ],
      });
    }
  }

  return {
    type: "doc",
    content: nodes,
  };
}

function parseWechatPublishedAt(
  $: cheerio.CheerioAPI,
  html: string,
): string | null {
  const metadataValue =
    firstNonEmpty([
      $(
        'meta[property="article:published_time"]',
      ).attr("content"),

      $(
        'meta[name="article:published_time"]',
      ).attr("content"),
    ]);

  const metadataDate =
    parseDateValue(
      metadataValue,
    );

  if (metadataDate) {
    return metadataDate;
  }

  const timestampMatch =
    html.match(
      /(?:\bct\b|publish_time)\s*[:=]\s*["']?(\d{10,13})["']?/i,
    );

  if (timestampMatch) {
    const raw =
      Number(
        timestampMatch[1],
      );

    const milliseconds =
      timestampMatch[1]
        .length === 13
        ? raw
        : raw * 1000;

    const date =
      new Date(milliseconds);

    if (
      !Number.isNaN(
        date.getTime(),
      )
    ) {
      return date.toISOString();
    }
  }

  const text =
    normalizeText(
      $("#publish_time")
        .first()
        .text(),
    );

  return parseDateValue(text);
}

function parseDateValue(
  value:
    | string
    | null
    | undefined,
): string | null {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    return null;
  }

  const directDate =
    new Date(normalized);

  if (
    !Number.isNaN(
      directDate.getTime(),
    )
  ) {
    return directDate.toISOString();
  }

  const chineseMatch =
    normalized.match(
      /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?(?:\s+(\d{1,2}):(\d{1,2}))?/,
    );

  if (!chineseMatch) {
    return null;
  }

  const [
    ,
    year,
    month,
    day,
    hour = "00",
    minute = "00",
  ] = chineseMatch;

  const date =
    new Date(
      `${year}-${month.padStart(
        2,
        "0",
      )}-${day.padStart(
        2,
        "0",
      )}T${hour.padStart(
        2,
        "0",
      )}:${minute.padStart(
        2,
        "0",
      )}:00+08:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function normalizeWechatArticleUrl(
  inputUrl: string,
) {
  const url =
    validateWechatUrl(
      inputUrl,
    );

  url.hash = "";

  if (
    /^\/s\/[^/]+/.test(
      url.pathname,
    )
  ) {
    url.search = "";

    return url.toString();
  }

  const allowedParameters = [
    "__biz",
    "mid",
    "idx",
    "sn",
  ];

  const nextSearch =
    new URLSearchParams();

  for (
    const key of allowedParameters
  ) {
    const value =
      url.searchParams.get(key);

    if (value) {
      nextSearch.set(
        key,
        value,
      );
    }
  }

  url.search =
    nextSearch.toString();

  return url.toString();
}

function normalizeWechatImageUrl(
  input:
    | string
    | null
    | undefined,
  baseUrl: string,
): string | null {
  const normalized =
    normalizeText(input);

  if (!normalized) {
    return null;
  }

  try {
    const url =
      new URL(
        normalized,
        baseUrl,
      );

    if (
      url.protocol !==
        "https:" &&
      url.protocol !== "http:"
    ) {
      return null;
    }

    url.hash = "";

    return url.toString();
  } catch {
    return null;
  }
}

function createSummaryFromContent(
  input: string,
) {
  const text =
    normalizeText(input);

  if (!text) {
    return null;
  }

  return truncateText(
    text,
    300,
  );
}

function normalizeParagraphText(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value
      ?.replace(/\r/g, "")
      .replace(
        /[ \t\u00a0]+/g,
        " ",
      )
      .replace(
        / *\n */g,
        "\n",
      )
      .replace(
        /\n{3,}/g,
        "\n\n",
      )
      .trim() ?? ""
  );
}

function normalizeText(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value
      ?.replace(
        /[\u00a0\s]+/g,
        " ",
      )
      .trim() ?? ""
  );
}

function truncateText(
  value:
    | string
    | null
    | undefined,
  maxLength: number,
): string | null {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    return null;
  }

  if (
    normalized.length <=
    maxLength
  ) {
    return normalized;
  }

  return normalized
    .slice(0, maxLength)
    .trim();
}

function firstNonEmpty(
  values: Array<
    string | null | undefined
  >,
): string | null {
  for (const value of values) {
    const normalized =
      normalizeText(value);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function removeAdjacentDuplicates(
  values: string[],
) {
  const result:
    string[] = [];

  for (const value of values) {
    if (
      result[
        result.length - 1
      ] === value
    ) {
      continue;
    }

    result.push(value);
  }

  return result;
}