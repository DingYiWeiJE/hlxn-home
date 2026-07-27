import { promises as fs } from "fs";

import { ApiError } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import {
  contentTypeForMediaPath,
} from "@/lib/media/upload";
import {
  resolveUploadPath,
} from "@/lib/media/paths";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

    const resolved =
      resolveUploadPath(relativePath);

    const asset =
      await prisma.mediaAsset.findFirst({
        where: {
          relativePath:
            resolved.relativePath,
          type: "IMAGE",
          enabled: true,
          deletedAt: null,
        },
        select: {
          id: true,
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

    const stat = await fs
      .stat(resolved.absolutePath)
      .catch(() => null);

    if (!stat?.isFile()) {
      throw new ApiError(
        "MEDIA_NOT_FOUND",
        "图片文件不存在",
        404,
      );
    }

    return new Response(
      head
        ? null
        : await fs.readFile(
            resolved.absolutePath,
          ),
      {
        headers: {
          "Content-Type":
            asset.mimeType ||
            contentTypeForMediaPath(
              resolved.relativePath,
            ),

          "Content-Length": String(
            stat.size,
          ),

          "Cache-Control":
            "public, max-age=2592000",

          "X-Content-Type-Options":
            "nosniff",
        },
      },
    );
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