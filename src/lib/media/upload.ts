import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { buildMediaUrl } from "./url";
import { getUploadConfig } from "./config";
import { resolveUploadPath } from "./paths";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type UploadedImage = {
  id: string;
  url: string;
  relativePath: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
};

export async function processUploadedImage(file: File, alt?: string | null): Promise<UploadedImage> {
  const config = getUploadConfig();
  if (file.size > config.maxBytes) {
    throw new ApiError("FILE_TOO_LARGE", "图片不能超过 10 MB", 413);
  }

  const input = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(input);
  if (!detected || !allowedMimeTypes.has(detected.mime)) {
    throw new ApiError("UNSUPPORTED_FILE_TYPE", "仅支持 JPG、PNG、WebP 和 GIF 图片", 400);
  }

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const extension = detected.mime === "image/gif" ? "gif" : "webp";
  const filename = `${randomBytes(16).toString("hex")}.${extension}`;
  const relativePath = `news/${yyyy}/${mm}/${filename}`;
  const { absolutePath } = resolveUploadPath(relativePath);
  const directory = path.dirname(absolutePath);
  const temporaryPath = path.join(directory, `.${filename}.${process.pid}.tmp`);

  await fs.mkdir(directory, { recursive: true });

  let output = input;
  let mimeType = detected.mime;
  let width: number | null = null;
  let height: number | null = null;

  try {
    if (detected.mime !== "image/gif") {
      output = await sharp(input)
        .rotate()
        .resize({ width: config.imageMaxWidth, withoutEnlargement: true })
        .webp({ quality: config.webpQuality })
        .toBuffer();
      mimeType = "image/webp";
    }

    const metadata = await sharp(output, { animated: detected.mime === "image/gif" }).metadata();
    width = metadata.width ?? null;
    height = metadata.height ?? null;

    await fs.writeFile(temporaryPath, output, { flag: "wx" });
    await fs.rename(temporaryPath, absolutePath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
    console.error("Image upload failed", error);
    throw new ApiError("UPLOAD_FAILED", "图片上传失败，请稍后再试", 500);
  }

  const url = buildMediaUrl(relativePath);

  try {
    return await prisma.mediaAsset.create({
      data: {
        url,
        relativePath,
        filename,
        originalName: file.name || null,
        mimeType,
        size: output.length,
        width,
        height,
        alt: alt?.trim() || null,
      },
      select: {
        id: true,
        url: true,
        relativePath: true,
        filename: true,
        mimeType: true,
        size: true,
        width: true,
        height: true,
        alt: true,
      },
    });
  } catch (error) {
    await fs.rm(absolutePath, { force: true }).catch(() => undefined);
    console.error("MediaAsset create failed after file write", error);
    throw new ApiError("UPLOAD_FAILED", "图片上传失败，请稍后再试", 500);
  }
}

export function contentTypeForMediaPath(relativePath: string) {
  const extension = path.extname(relativePath).toLowerCase();
  if (extension === ".webp") return "image/webp";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".gif") return "image/gif";
  return "application/octet-stream";
}
