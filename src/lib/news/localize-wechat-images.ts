import "server-only";

import { createHash } from "node:crypto";
import path from "node:path";

import { MediaAssetType } from "@prisma/client";

import { getUploadConfig } from "@/lib/media/config";
import {
  uploadImage,
  type UploadedMediaAsset,
} from "@/lib/media/upload";
import { prisma } from "@/lib/prisma";
import type { TiptapNode } from "@/lib/news/tiptap";
import type { WechatRemoteImage } from "@/lib/news/wechat-import";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;
const MAX_ARTICLE_IMAGES = 80;
const MAX_TOTAL_IMAGE_BYTES = 50 * 1024 * 1024;

const allowedWechatImageHosts = new Set([
  "mmbiz.qpic.cn",
  "mmbiz.qlogo.cn",
  "wx.qlogo.cn",
  "thirdwx.qlogo.cn",
  "res.wx.qq.com",
]);

const mediaAssetSelect = {
  id: true,
  type: true,
  url: true,
  relativePath: true,
  filename: true,
  originalName: true,
  mimeType: true,
  size: true,
  checksum: true,
  width: true,
  height: true,
  alt: true,
  createdAt: true,
} as const;

type LocalizedImage = {
  sourceUrl: string;
  assetId: string;
  localUrl: string;
};

type FailedImage = {
  sourceUrl: string;
  reason: string;
};

export type LocalizeWechatImagesResult = {
  content: TiptapNode;
  coverImageAsset: UploadedMediaAsset | null;
  localizedImages: LocalizedImage[];
  failedImages: FailedImage[];
};

type LocalizeWechatImagesInput = {
  content: TiptapNode;
  remoteCoverImage: string | null;
  remoteImages: WechatRemoteImage[];
  articleTitle: string;
};

export async function localizeWechatImages(
  input: LocalizeWechatImagesInput,
): Promise<LocalizeWechatImagesResult> {
  console.log(
    "🔄 Starting image localization",
    {
      coverImageUrl: input.remoteCoverImage ? "✓" : "✗",
      totalImages: input.remoteImages.length,
    }
  );

  const requestedImages = buildImageQueue(input);
  const localizedByUrl = new Map<string, UploadedMediaAsset>();
  const localizedImages: LocalizedImage[] = [];
  const failedImages: FailedImage[] = [];

  let totalDownloadedBytes = 0;

  for (const image of requestedImages.slice(0, MAX_ARTICLE_IMAGES)) {
    try {
      console.log(
        "🔍 Processing image:",
        {
          sourceUrl: image.url.substring(0, 80),
        }
      );

      const existingAsset = await findExistingWechatAsset(image.url);

      if (existingAsset) {
        console.log(
          "♻️ Found existing asset (using cache):",
          {
            assetId: existingAsset.id,
            url: existingAsset.url,
          }
        );

        localizedByUrl.set(image.url, existingAsset);

        localizedImages.push({
          sourceUrl: image.url,
          assetId: existingAsset.id,
          localUrl: existingAsset.url,
        });

        continue;
      }

      console.log("📥 No existing asset, downloading from WeChat...");

      const downloaded = await downloadWechatImage(image.url);

      console.log(
        "📥 Image downloaded",
        {
          sourceUrl: image.url,
          downloadedBytes: downloaded.buffer.length,
          contentType: downloaded.contentType,
        }
      );

      totalDownloadedBytes += downloaded.buffer.length;

      if (totalDownloadedBytes > MAX_TOTAL_IMAGE_BYTES) {
        throw new Error("整篇文章的图片总大小超过 50 MB");
      }

      const originalName = createWechatOriginalName(
        image.url,
        downloaded.contentType,
      );

      /*
      * File 构造器要求 ArrayBuffer 类型的数据。
      * 显式复制为普通 Uint8Array，避免 Node.js Buffer
      * 使用 ArrayBufferLike 导致 TypeScript 类型冲突。
      */
      const fileBytes = new Uint8Array(
        downloaded.buffer.length,
      );

      fileBytes.set(downloaded.buffer);

      const file = new File(
        [fileBytes],
        originalName,
        {
          type:
            downloaded.contentType ||
            "application/octet-stream",
        },
      );

      console.log(
        "📤 Uploading image:",
        {
          sourceUrl: image.url,
          fileName: originalName,
        }
      );

      const asset = await uploadImage(file, {
        scope: "news",
        alt: image.alt,
        createdById: null,
      });

      console.log(
        "✅ Image uploaded successfully:",
        {
          assetId: asset.id,
          generatedUrl: asset.url,
          relativePath: asset.relativePath,
          correctUrl: asset.url.startsWith('http') ? '✓' : '❌ WRONG',
        }
      );

      localizedByUrl.set(image.url, asset);

      localizedImages.push({
        sourceUrl: image.url,
        assetId: asset.id,
        localUrl: asset.url,
      });
    } catch (error) {
      console.error(
        "❌ Wechat image localization failed",
        {
          sourceUrl: image.url,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        }
      );

      failedImages.push({
        sourceUrl: image.url,
        reason:
          error instanceof Error
            ? error.message
            : "图片下载失败",
      });
    }
  }

  if (requestedImages.length > MAX_ARTICLE_IMAGES) {
    for (const image of requestedImages.slice(MAX_ARTICLE_IMAGES)) {
      failedImages.push({
        sourceUrl: image.url,
        reason: `单篇文章最多自动处理 ${MAX_ARTICLE_IMAGES} 张图片`,
      });
    }
  }

  const coverImageAsset = input.remoteCoverImage
    ? localizedByUrl.get(input.remoteCoverImage) ?? null
    : null;

  console.log(
    "✅ Image localization completed",
    {
      successCount: localizedImages.length,
      failedCount: failedImages.length,
      coverImageAssetId: coverImageAsset?.id ?? 'N/A',
    }
  );

  return {
    content: replaceTiptapImageUrls(
      input.content,
      localizedByUrl,
    ),
    coverImageAsset,
    localizedImages,
    failedImages,
  };
}

function buildImageQueue(
  input: LocalizeWechatImagesInput,
) {
  const result: Array<{
    url: string;
    alt: string | null;
  }> = [];

  const seen = new Set<string>();

  function append(
    url: string | null | undefined,
    alt: string | null,
  ) {
    if (!url || seen.has(url)) {
      return;
    }

    seen.add(url);
    result.push({
      url,
      alt,
    });
  }

  /*
   * 封面优先下载，这样即使后续图片超过限制，
   * 封面仍然能够正常进入素材库。
   */
  append(
    input.remoteCoverImage,
    input.articleTitle,
  );

  for (const image of input.remoteImages) {
    append(image.url, image.alt);
  }

  return result;
}

async function findExistingWechatAsset(
  sourceUrl: string,
): Promise<UploadedMediaAsset | null> {
  const sourceHash = createHash("sha256")
    .update(sourceUrl)
    .digest("hex")
    .slice(0, 32);

  return prisma.mediaAsset.findFirst({
    where: {
      type: MediaAssetType.IMAGE,

      /*
       * 不依赖扩展名查重。
       * 同一个微信图片地址只会保存一份素材。
       */
      originalName: {
        startsWith: `wechat-${sourceHash}`,
      },

      enabled: true,
      deletedAt: null,
    },
    select: mediaAssetSelect,
  });
}

async function downloadWechatImage(
  sourceUrl: string,
): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const config = getUploadConfig();
  console.log("🔍 [downloadWechatImage] Starting download:", sourceUrl);

  let currentUrl = validateWechatImageUrl(sourceUrl);

  for (
    let redirectCount = 0;
    redirectCount <= MAX_REDIRECTS;
    redirectCount += 1
  ) {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      FETCH_TIMEOUT_MS,
    );

    let response: Response;

    try {
      console.log(
        `🔍 [downloadWechatImage] Fetch attempt ${redirectCount + 1}/${MAX_REDIRECTS + 1}`
      );
      response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
          Referer: "https://mp.weixin.qq.com/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/131.0.0.0 Safari/537.36",
        },
      });

      console.log(
        `📨 [downloadWechatImage] Response received: ${response.status}`
      );
    } catch (error) {
      console.error(
        "❌ [downloadWechatImage] Fetch error:",
        error instanceof Error ? error.message : String(error)
      );

      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new Error("微信图片请求超时");
      }

      throw new Error("无法下载微信图片");
    } finally {
      clearTimeout(timeout);
    }

    if (
      response.status >= 300 &&
      response.status < 400
    ) {
      const location = response.headers.get("location");

      if (!location) {
        throw new Error("微信图片返回了无效跳转地址");
      }

      if (redirectCount === MAX_REDIRECTS) {
        throw new Error("微信图片跳转次数过多");
      }

      currentUrl = validateWechatImageUrl(
        new URL(location, currentUrl).toString(),
      );

      continue;
    }

    if (!response.ok) {
      throw new Error(
        `微信图片下载失败，状态码：${response.status}`,
      );
    }

    const contentLength = Number(
      response.headers.get("content-length") ?? 0,
    );

    if (
      Number.isFinite(contentLength) &&
      contentLength > config.maxImageBytes
    ) {
      throw new Error("微信图片大小超过系统上传限制");
    }

    const buffer = Buffer.from(
      await response.arrayBuffer(),
    );

    if (buffer.length <= 0) {
      throw new Error("微信图片内容为空");
    }

    if (buffer.length > config.maxImageBytes) {
      throw new Error("微信图片大小超过系统上传限制");
    }

    return {
      buffer,
      contentType:
        response.headers
          .get("content-type")
          ?.split(";")[0]
          ?.trim()
          .toLowerCase() ?? "",
    };
  }

  throw new Error("微信图片下载失败");
}

function validateWechatImageUrl(
  input: string,
): string {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new Error("微信图片地址格式不正确");
  }

  if (url.protocol !== "https:") {
    throw new Error("微信图片必须使用 HTTPS");
  }

  const hostname = url.hostname.toLowerCase();

  if (!allowedWechatImageHosts.has(hostname)) {
    throw new Error(
      `不允许下载该图片域名：${hostname}`,
    );
  }

  url.hash = "";

  return url.toString();
}

function createWechatOriginalName(
  sourceUrl: string,
  contentType: string | null,
) {
  const hash = createHash("sha256")
    .update(sourceUrl)
    .digest("hex")
    .slice(0, 32);

  const extension = getImageExtension(
    sourceUrl,
    contentType,
  );

  return `wechat-${hash}${extension}`;
}

function getImageExtension(
  sourceUrl: string,
  contentType: string | null,
) {
  if (contentType === "image/jpeg") {
    return ".jpg";
  }

  if (contentType === "image/png") {
    return ".png";
  }

  if (contentType === "image/webp") {
    return ".webp";
  }

  if (contentType === "image/gif") {
    return ".gif";
  }

  try {
    const extension = path
      .extname(new URL(sourceUrl).pathname)
      .toLowerCase();

    if (
      [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(
        extension,
      )
    ) {
      return extension;
    }
  } catch {
    // 使用默认扩展名
  }

  /*
   * uploadImage 会根据真实文件内容识别类型，
   * 此扩展名只用于原始文件名和去重。
   */
  return ".img";
}

function replaceTiptapImageUrls(
  node: TiptapNode,
  localizedByUrl: Map<string, UploadedMediaAsset>,
): TiptapNode {
  const nextNode = {
    ...node,
  } as TiptapNode;

  if (
    node.type === "image" &&
    node.attrs &&
    typeof node.attrs.src === "string"
  ) {
    const asset = localizedByUrl.get(node.attrs.src);

    if (asset) {
      nextNode.attrs = {
        ...node.attrs,
        src: asset.url,
      };
    }
  }

  if (Array.isArray(node.content)) {
    nextNode.content = node.content.map((child) =>
      replaceTiptapImageUrls(
        child,
        localizedByUrl,
      ),
    );
  }

  return nextNode;
}