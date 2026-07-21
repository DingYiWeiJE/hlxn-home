import { promises as fs } from "fs";
import { ApiError } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { resolveUploadPath } from "@/lib/media/paths";
import { contentTypeForMediaPath } from "@/lib/media/upload";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Params = { params: Promise<{ path: string[] }> };

async function serveMedia({ params }: Params, head = false) {
  try {
    const { path } = await params;
    const relativePath = decodeURIComponent(path.join("/"));
    const resolved = resolveUploadPath(relativePath);
    const asset = await prisma.mediaAsset.findFirst({
      where: {
        relativePath: resolved.relativePath,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!asset) {
      throw new ApiError("MEDIA_NOT_FOUND", "文件不存在", 404);
    }

    const stat = await fs.stat(resolved.absolutePath).catch(() => null);
    if (!stat?.isFile()) {
      throw new ApiError("MEDIA_NOT_FOUND", "文件不存在", 404);
    }

    return new Response(head ? null : await fs.readFile(resolved.absolutePath), {
      headers: {
        "Content-Type": contentTypeForMediaPath(resolved.relativePath),
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=2592000",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return fail(error);
  }
}

export async function GET(_request: Request, ctx: Params) {
  return serveMedia(ctx);
}

export async function HEAD(_request: Request, ctx: Params) {
  return serveMedia(ctx, true);
}
