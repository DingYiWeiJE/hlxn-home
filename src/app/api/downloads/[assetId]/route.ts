import { createReadStream, promises as fs } from "fs";
import { Readable } from "stream";

import {
  MediaAssetType,
  ProductStatus,
} from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { resolveUploadPath } from "@/lib/media/paths";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    assetId: string;
  }>;
};

/**
 * 清理 ASCII 备用文件名，防止响应头注入。
 */
function createAsciiFilename(filename: string): string {
  const extension = filename
    .toLowerCase()
    .endsWith(".pdf")
    ? ".pdf"
    : "";

  const baseName = filename
    .replace(/\.pdf$/i, "")
    .replace(/[\r\n"]/g, "")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/[\\/:*?<>|]/g, "_")
    .trim();

  return `${baseName || "product-document"}${extension || ".pdf"}`;
}

/**
 * 对 UTF-8 文件名进行 RFC 5987 编码。
 */
function encodeDownloadFilename(filename: string): string {
  return encodeURIComponent(filename).replace(
    /['()*]/g,
    (character) =>
      `%${character
        .charCodeAt(0)
        .toString(16)
        .toUpperCase()}`,
  );
}

async function getDownloadAsset(assetId: string) {
  const asset = await prisma.mediaAsset.findFirst({
    where: {
      id: assetId,
      type: MediaAssetType.PDF,
      enabled: true,
      deletedAt: null,

      // 只允许公开下载已发布产品正在使用的 PDF
      productPdfs: {
        some: {
          status: ProductStatus.PUBLISHED,
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      originalName: true,
      filename: true,
      relativePath: true,
      mimeType: true,
      size: true,
    },
  });

  if (!asset) {
    throw new ApiError(
      "MEDIA_NOT_FOUND",
      "产品详情文件不存在或暂不可下载",
      404,
    );
  }

  const resolved = resolveUploadPath(
    asset.relativePath,
  );

  const stat = await fs
    .stat(resolved.absolutePath)
    .catch(() => null);

  if (!stat?.isFile()) {
    throw new ApiError(
      "MEDIA_NOT_FOUND",
      "产品详情文件不存在",
      404,
    );
  }

  const originalName =
    asset.originalName?.trim() ||
    asset.filename;

  const downloadName = originalName
    .toLowerCase()
    .endsWith(".pdf")
    ? originalName
    : `${originalName}.pdf`;

  return {
    asset,
    absolutePath: resolved.absolutePath,
    fileSize: stat.size,
    downloadName,
  };
}

function createDownloadHeaders(input: {
  fileSize: number;
  downloadName: string;
}) {
  const asciiFilename = createAsciiFilename(
    input.downloadName,
  );

  const encodedFilename =
    encodeDownloadFilename(
      input.downloadName,
    );

  return {
    "Content-Type": "application/pdf",
    "Content-Length": String(
      input.fileSize,
    ),
    "Content-Disposition":
      `attachment; filename="${asciiFilename}"; ` +
      `filename*=UTF-8''${encodedFilename}`,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

/**
 * 下载产品详情 PDF
 *
 * GET /api/downloads/:assetId
 */
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { assetId } = await context.params;

    const {
      absolutePath,
      fileSize,
      downloadName,
    } = await getDownloadAsset(assetId);

    const nodeStream =
      createReadStream(absolutePath);

    const webStream = Readable.toWeb(
      nodeStream,
    ) as ReadableStream<Uint8Array>;

    return new Response(webStream, {
      status: 200,
      headers: createDownloadHeaders({
        fileSize,
        downloadName,
      }),
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * 获取 PDF 响应头，不返回文件内容。
 *
 * HEAD /api/downloads/:assetId
 */
export async function HEAD(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { assetId } = await context.params;

    const {
      fileSize,
      downloadName,
    } = await getDownloadAsset(assetId);

    return new Response(null, {
      status: 200,
      headers: createDownloadHeaders({
        fileSize,
        downloadName,
      }),
    });
  } catch (error) {
    return fail(error);
  }
}