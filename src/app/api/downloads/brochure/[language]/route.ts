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
    language: string;
  }>;
};

async function getBrochure(language: string) {
  if (language !== "zh" && language !== "en") {
    throw new ApiError("VALIDATION_ERROR", "不支持的语言", 400);
  }

  const brochure = await prisma.cmsBrochure.findFirst({
    where: { language, deletedAt: null },
    select: {
      filename: true,
      relativePath: true,
      size: true,
    },
  });

  if (!brochure) {
    throw new ApiError("MEDIA_NOT_FOUND", "企业画册暂未上传", 404);
  }

  const downloadName = brochure.filename.toLowerCase().endsWith(".pdf")
    ? brochure.filename
    : `${brochure.filename}.pdf`;

  return { brochure, downloadName };
}

/**
 * 下载/查看企业画册 PDF
 *
 * GET /api/downloads/brochure/:language          -> 触发下载（attachment）
 * GET /api/downloads/brochure/:language?mode=view -> 浏览器内预览（inline）
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { language } = await context.params;
    const { brochure, downloadName } = await getBrochure(language);

    const qiniuResponse = await fetchQiniuFile(
      buildMediaUrl(brochure.relativePath),
    );

    if (!qiniuResponse.ok) {
      throw new ApiError(
        "INTERNAL_SERVER_ERROR",
        "无法获取企业画册文件",
        qiniuResponse.status,
      );
    }

    const buffer = await qiniuResponse.arrayBuffer();

    const headers = createDownloadHeaders({
      fileSize: buffer.byteLength,
      downloadName,
      disposition: resolveDisposition(request),
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
 * HEAD /api/downloads/brochure/:language
 */
export async function HEAD(request: Request, context: RouteContext) {
  try {
    const { language } = await context.params;
    const { brochure, downloadName } = await getBrochure(language);

    return new Response(null, {
      status: 200,
      headers: createDownloadHeaders({
        fileSize: brochure.size,
        downloadName,
        disposition: resolveDisposition(request),
      }),
    });
  } catch (error) {
    return fail(error);
  }
}
