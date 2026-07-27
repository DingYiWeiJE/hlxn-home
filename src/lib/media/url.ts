import { getUploadConfig } from "./config";

export function buildMediaUrl(relativePath: string) {
  const normalizedPath = relativePath
    .replaceAll("\\", "/")
    .replace(/^\/+/, "");

  const publicPrefix = getUploadConfig()
    .publicPrefix
    .replace(/\/+$/, "");

  return `${publicPrefix}/${normalizedPath}`;
}