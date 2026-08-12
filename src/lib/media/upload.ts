import { createHash, randomBytes } from "crypto";
import path from "path";

import { MediaAssetType } from "@prisma/client";
import { fileTypeFromBuffer } from "file-type";
import * as qiniu from "qiniu";
import sharp from "sharp";

import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

import { getUploadConfig } from "./config";

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const imageExtensionsByMimeType = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export type MediaUploadScope =
  | "news"
  | "products"
  | "solutions"
  | "application-cases"
  | "company-history";

export type UploadedMediaAsset = {
  id: string;
  type: MediaAssetType;
  url: string;
  relativePath: string;
  filename: string;
  originalName: string | null;
  mimeType: string;
  size: number;
  checksum: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: Date;
};

export type UploadedImage = UploadedMediaAsset;

type UploadImageOptions = {
  scope: MediaUploadScope;
  alt?: string | null;
  createdById?: string | null;
};

type UploadPdfOptions = {
  scope: MediaUploadScope;
  createdById?: string | null;
};

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

function createChecksum(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function getQiniuMac(): qiniu.auth.digest.Mac {
  const config = getUploadConfig();
  return new qiniu.auth.digest.Mac(config.qiniuAccessKey, config.qiniuSecretKey);
}

function assertQiniuConfig(
  config: ReturnType<typeof getUploadConfig>,
) {
  const missingFields = [
    ["QINIU_ACCESS_KEY", config.qiniuAccessKey],
    ["QINIU_SECRET_KEY", config.qiniuSecretKey],
    ["QINIU_BUCKET", config.qiniuBucket],
    ["QINIU_DOMAIN", config.qiniuDomain],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingFields.length > 0) {
    throw new Error(
      `Missing Qiniu configuration: ${missingFields.join(", ")}`,
    );
  }
}

function getQiniuUploadToken(key: string): string {
  const config = getUploadConfig();
  assertQiniuConfig(config);
  const mac = getQiniuMac();
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: `${config.qiniuBucket}:${key}`,
  });
  return putPolicy.uploadToken(mac);
}

async function uploadToQiniu(
  key: string,
  content: Buffer,
  mimeType: string,
): Promise<string> {
  const config = getUploadConfig();
  console.log(
    "🌐 uploadToQiniu",
    {
      key,
      contentSize: content.length,
      mimeType,
      bucket: config.qiniuBucket,
    }
  );

  assertQiniuConfig(config);
  const token = getQiniuUploadToken(key);

  const uploader = new qiniu.form_up.FormUploader(new qiniu.conf.Config({}));
  const putExtra = new qiniu.form_up.PutExtra("", {}, mimeType);

  try {
    console.log("📤 Sending to Qiniu...");
    const result = await uploader.put(token, key, content, putExtra);

    console.log(
      "📨 Qiniu response",
      {
        statusCode: result.resp?.statusCode,
      }
    );

    if (result.resp?.statusCode === 200) {
      const url = `${config.qiniuDomain}/${key}`;
      console.log("✅ Qiniu upload successful:", url);
      return url;
    } else {
      throw new Error(`Qiniu upload failed: ${result.resp?.statusCode}`);
    }
  } catch (error) {
    console.error("❌ Qiniu upload error:", error);
    throw error;
  }
}

function getCurrentDatePath() {
  const now = new Date();

  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, "0"),
  };
}

function formatMegabytes(bytes: number): string {
  const megabytes = bytes / 1024 / 1024;

  return Number.isInteger(megabytes)
    ? String(megabytes)
    : megabytes.toFixed(1);
}

/**
 * 通用图片上传。
 *
 * 新闻图片：
 * uploadImage(file, { scope: "news", alt })
 *
 * 产品图片：
 * uploadImage(file, {
 *   scope: "products",
 *   alt,
 *   createdById,
 * })
 */
export async function uploadImage(
  file: File,
  options: UploadImageOptions,
): Promise<UploadedMediaAsset> {
  const config = getUploadConfig();

  console.log(
    "📤 uploadImage called",
    {
      fileName: file.name,
      fileSize: file.size,
      scope: options.scope,
      qiniuDomain: config.qiniuDomain,
      qiniuBucket: config.qiniuBucket,
    }
  );

  if (!config.qiniuDomain) {
    console.error(
      "❌ CRITICAL: qiniuDomain is empty!",
      {
        qiniuDomain: config.qiniuDomain,
        env_QINIU_DOMAIN: process.env.QINIU_DOMAIN,
        env_NEXT_PUBLIC_QINIU_DOMAIN: process.env.NEXT_PUBLIC_QINIU_DOMAIN,
      }
    );
    throw new ApiError(
      "UPLOAD_FAILED",
      "七牛云配置错误：未设置 QINIU_DOMAIN",
      500,
    );
  }

  if (file.size <= 0) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "请选择有效的图片文件",
      400,
      {
        file: ["请选择有效的图片文件"],
      },
    );
  }

  if (file.size > config.maxImageBytes) {
    const sizeLimit = formatMegabytes(config.maxImageBytes);

    throw new ApiError(
      "FILE_TOO_LARGE",
      `图片不能超过 ${sizeLimit} MB`,
      413,
      {
        file: [`图片不能超过 ${sizeLimit} MB`],
      },
    );
  }

  const input = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(input);

  if (!detected || !allowedImageMimeTypes.has(detected.mime)) {
    throw new ApiError(
      "UNSUPPORTED_FILE_TYPE",
      "仅支持 JPG、PNG、WebP 和 GIF 图片",
      400,
      {
        file: ["仅支持 JPG、PNG、WebP 和 GIF 图片"],
      },
    );
  }

  const { year, month } = getCurrentDatePath();

  let output = input;
  let outputMimeType = detected.mime;
  let width: number | null = null;
  let height: number | null = null;
  let filename = "";
  let relativePath = "";

  try {
    const inputMetadata = await sharp(input, {
      animated: detected.mime === "image/gif",
      limitInputPixels: false,
    }).metadata();

    width = inputMetadata.width ?? null;
    height = inputMetadata.height ?? null;

    const inputPixels =
      width !== null && height !== null
        ? width * height
        : null;

    const shouldConvert =
      detected.mime !== "image/gif" &&
      inputPixels !== null &&
      inputPixels <= config.imageMaxInputPixels;

    if (shouldConvert) {
      output = await sharp(input)
        .rotate()
        .resize({
          width: config.imageMaxWidth,
          withoutEnlargement: true,
        })
        .webp({
          quality: config.webpQuality,
        })
        .toBuffer();

      outputMimeType = "image/webp";
    }

    const extension =
      imageExtensionsByMimeType.get(outputMimeType) ?? detected.ext;

    filename = `${randomBytes(16).toString("hex")}.${extension}`;

    relativePath =
      `${options.scope}/images/${year}/${month}/${filename}`;

    const metadata = await sharp(output, {
      animated: outputMimeType === "image/gif",
      limitInputPixels: false,
    }).metadata();

    width = metadata.width ?? null;
    height = metadata.height ?? null;

    await uploadToQiniu(relativePath, output, outputMimeType);
  } catch (error) {
    console.error("Image upload failed", error);

    throw new ApiError(
      "UPLOAD_FAILED",
      "图片上传失败，请稍后重试",
      500,
    );
  }

  const url = `${config.qiniuDomain}/${relativePath}`;
  const checksum = createChecksum(output);

  console.log(
    "💾 Creating MediaAsset in database",
    {
      url,
      relativePath,
      mimeType: outputMimeType,
      size: output.length,
    }
  );

  try {
    return await prisma.mediaAsset.create({
      data: {
        type: MediaAssetType.IMAGE,
        url,
        relativePath,
        filename,
        originalName: file.name || null,
        mimeType: outputMimeType,
        size: output.length,
        checksum,
        width,
        height,
        alt: options.alt?.trim() || null,
        enabled: true,
        createdById: options.createdById ?? null,
      },
      select: mediaAssetSelect,
    });
  } catch (error) {
    console.error(
      "❌ MediaAsset creation failed after image write",
      error,
    );

    throw new ApiError(
      "UPLOAD_FAILED",
      "图片上传失败，请稍后重试",
      500,
    );
  }
}

/**
 * 通用 PDF 上传。
 *
 * 产品 PDF：
 * uploadPdf(file, {
 *   scope: "products",
 *   createdById,
 * })
 */
export async function uploadPdf(
  file: File,
  options: UploadPdfOptions,
): Promise<UploadedMediaAsset> {
  const config = getUploadConfig();

  if (file.size <= 0) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "请选择有效的 PDF 文件",
      400,
      {
        file: ["请选择有效的 PDF 文件"],
      },
    );
  }

  if (file.size > config.maxPdfBytes) {
    const sizeLimit = formatMegabytes(config.maxPdfBytes);

    throw new ApiError(
      "FILE_TOO_LARGE",
      `PDF 文件不能超过 ${sizeLimit} MB`,
      413,
      {
        file: [`PDF 文件不能超过 ${sizeLimit} MB`],
      },
    );
  }

  const input = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(input);

  if (!detected || detected.mime !== "application/pdf") {
    throw new ApiError(
      "UNSUPPORTED_FILE_TYPE",
      "仅支持 PDF 文件",
      400,
      {
        file: ["仅支持 PDF 文件"],
      },
    );
  }

  const { year, month } = getCurrentDatePath();
  const filename = `${randomBytes(16).toString("hex")}.pdf`;

  const relativePath =
    `${options.scope}/pdfs/${year}/${month}/${filename}`;

  try {
    await uploadToQiniu(relativePath, input, "application/pdf");
  } catch (error) {
    console.error("PDF upload failed", error);

    throw new ApiError(
      "UPLOAD_FAILED",
      "PDF 文件上传失败，请稍后重试",
      500,
    );
  }

  const url = `${config.qiniuDomain}/${relativePath}`;
  const checksum = createChecksum(input);

  try {
    return await prisma.mediaAsset.create({
      data: {
        type: MediaAssetType.PDF,
        url,
        relativePath,
        filename,
        originalName: file.name || null,
        mimeType: "application/pdf",
        size: input.length,
        checksum,
        width: null,
        height: null,
        alt: null,
        enabled: true,
        createdById: options.createdById ?? null,
      },
      select: mediaAssetSelect,
    });
  } catch (error) {
    console.error(
      "MediaAsset creation failed after PDF write",
      error,
    );

    throw new ApiError(
      "UPLOAD_FAILED",
      "PDF 文件上传失败，请稍后重试",
      500,
    );
  }
}

/**
 * 兼容原有新闻图片上传接口。
 *
 * 原调用方式无需修改：
 * processUploadedImage(file, alt)
 */
export async function processUploadedImage(
  file: File,
  alt?: string | null,
): Promise<UploadedImage> {
  return uploadImage(file, {
    scope: "news",
    alt,
    createdById: null,
  });
}

export function contentTypeForMediaPath(
  relativePath: string,
): string {
  const extension = path.extname(relativePath).toLowerCase();

  if (extension === ".webp") {
    return "image/webp";
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".gif") {
    return "image/gif";
  }

  if (extension === ".pdf") {
    return "application/pdf";
  }

  return "application/octet-stream";
}
