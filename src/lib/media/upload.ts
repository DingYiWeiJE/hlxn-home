import { createHash, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { MediaAssetType } from "@prisma/client";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

import { getUploadConfig } from "./config";
import { resolveUploadPath } from "./paths";
import { buildMediaUrl } from "./url";

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
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

async function removeFile(filePath: string) {
  await fs.rm(filePath, { force: true }).catch(() => undefined);
}

async function writeFileAtomically(
  absolutePath: string,
  filename: string,
  content: Buffer,
) {
  const directory = path.dirname(absolutePath);
  const temporaryPath = path.join(
    directory,
    `.${filename}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`,
  );

  await fs.mkdir(directory, {
    recursive: true,
  });

  try {
    await fs.writeFile(temporaryPath, content, {
      flag: "wx",
    });

    await fs.rename(temporaryPath, absolutePath);
  } catch (error) {
    await removeFile(temporaryPath);
    throw error;
  }
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

  const isGif = detected.mime === "image/gif";
  const extension = isGif ? "gif" : "webp";
  const filename = `${randomBytes(16).toString("hex")}.${extension}`;

  const relativePath =
    `${options.scope}/images/${year}/${month}/${filename}`;

  const { absolutePath } = resolveUploadPath(relativePath);

  let output = input;
  let outputMimeType = detected.mime;
  let width: number | null = null;
  let height: number | null = null;

  try {
    if (!isGif) {
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

    const metadata = await sharp(output, {
      animated: isGif,
    }).metadata();

    width = metadata.width ?? null;
    height = metadata.height ?? null;

    await writeFileAtomically(
      absolutePath,
      filename,
      output,
    );
  } catch (error) {
    console.error("Image upload failed", error);

    throw new ApiError(
      "UPLOAD_FAILED",
      "图片上传失败，请稍后重试",
      500,
    );
  }

  const url = buildMediaUrl(relativePath);
  const checksum = createChecksum(output);

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
    await removeFile(absolutePath);

    console.error(
      "MediaAsset creation failed after image write",
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

  const { absolutePath } = resolveUploadPath(relativePath);

  try {
    await writeFileAtomically(
      absolutePath,
      filename,
      input,
    );
  } catch (error) {
    console.error("PDF upload failed", error);

    throw new ApiError(
      "UPLOAD_FAILED",
      "PDF 文件上传失败，请稍后重试",
      500,
    );
  }

  const url = buildMediaUrl(relativePath);
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
    await removeFile(absolutePath);

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
