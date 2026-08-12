import path from "path";

import { ApiError } from "@/lib/api/errors";

export function assertSafeRelativePath(
  relativePath: string,
): string {
  if (
    !relativePath ||
    relativePath.includes("\0") ||
    path.isAbsolute(relativePath) ||
    relativePath
      .split(/[\\/]/)
      .includes("..")
  ) {
    throw new ApiError(
      "INVALID_MEDIA_PATH",
      "媒体文件路径不正确",
      400,
    );
  }

  return relativePath
    .replaceAll("\\", "/")
    .replace(/^\/+/, "");
}
