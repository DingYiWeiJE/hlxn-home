import path from "path";

import { ApiError } from "@/lib/api/errors";

import { getUploadConfig } from "./config";

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

export function resolveUploadPath(
  relativePath: string,
) {
  const safePath =
    assertSafeRelativePath(relativePath);

  const root = path.resolve(
    getUploadConfig().uploadRoot,
  );

  const absolutePath = path.resolve(
    root,
    safePath,
  );

  const relative = path.relative(
    root,
    absolutePath,
  );

  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new ApiError(
      "INVALID_MEDIA_PATH",
      "媒体文件路径不正确",
      400,
    );
  }

  return {
    root,
    absolutePath,
    relativePath: safePath,
  };
}