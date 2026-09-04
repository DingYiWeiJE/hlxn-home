import {
  MediaAssetType,
  ProductStatus,
} from "@prisma/client";

import { ApiError } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { buildMediaUrl } from "@/lib/media/asset-url";
import {
  createDownloadHeaders,
  fetchQiniuFile,
  resolveDisposition,
} from "@/lib/media/pdf-download";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    assetId: string;
  }>;
};

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

/**
 * 下载/查看产品详情 PDF
 *
 * GET /api/downloads/:assetId          -> 触发下载（attachment）
 * GET /api/downloads/:assetId?mode=view -> 浏览器内预览（inline）
 */
export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const { assetId } = await context.params;

    const {
      asset,
      downloadName,
    } = await getDownloadAsset(assetId);

    const qiniuResponse =
      await fetchQiniuFile(
        buildMediaUrl(asset.relativePath),
      );

    if (!qiniuResponse.ok) {
      throw new ApiError(
        "INTERNAL_SERVER_ERROR",
        "无法获取产品详情文件",
        qiniuResponse.status,
      );
    }

    const buffer =
      await qiniuResponse.arrayBuffer();

    const headers = createDownloadHeaders({
      fileSize: buffer.byteLength,
      downloadName,
      disposition:
        resolveDisposition(request),
    });

    return new Response(buffer, {
      status: 200,
      headers,
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
  request: Request,
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
        disposition:
          resolveDisposition(request),
      }),
    });
  } catch (error) {
    return fail(error);
  }
}