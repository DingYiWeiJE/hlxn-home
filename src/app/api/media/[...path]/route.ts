import { ApiError } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function fetchQiniuImage(url: string) {
  const originalEnv =
    process.env
      .NODE_TLS_REJECT_UNAUTHORIZED;

  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED =
      "0";

    return await fetch(url, {
      redirect: "follow",
    });
  } finally {
    if (
      originalEnv !== undefined
    ) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED =
        originalEnv;
    } else {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    }
  }
}

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function serveMedia(
  context: RouteContext,
  head = false,
) {
  try {
    const { path } = await context.params;

    const relativePath = decodeURIComponent(
      path.join("/"),
    );

    const asset =
      await prisma.mediaAsset.findFirst({
        where: {
          relativePath,
          type: "IMAGE",
          enabled: true,
          deletedAt: null,
        },
        select: {
          id: true,
          url: true,
          mimeType: true,
        },
      });

    if (!asset) {
      throw new ApiError(
        "MEDIA_NOT_FOUND",
        "图片文件不存在",
        404,
      );
    }

    if (head) {
      return new Response(null, {
        status: 200,
        headers: {
          "Content-Type": asset.mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const qiniuResponse =
      await fetchQiniuImage(
        asset.url,
      );

    if (!qiniuResponse.ok) {
      throw new ApiError(
        "INTERNAL_SERVER_ERROR",
        "无法获取图片",
        qiniuResponse.status,
      );
    }

    const buffer = await qiniuResponse.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return fail(error);
  }
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  return serveMedia(context);
}

export async function HEAD(
  _request: Request,
  context: RouteContext,
) {
  return serveMedia(context, true);
}