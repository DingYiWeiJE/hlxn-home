import {
  MediaAssetType,
  ProductStatus,
} from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { buildMediaUrl } from "@/lib/media/asset-url";
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
    fileSize: asset.size,
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
      asset,
      fileSize,
      downloadName,
    } = await getDownloadAsset(assetId);

    const headers = createDownloadHeaders({
      fileSize,
      downloadName,
    });

    return new Response(null, {
      status: 307,
      headers: {
        ...headers,
        Location: buildMediaUrl(asset.relativePath),
      },
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