/**
 * 已弃用：所有文件现在存储在七牛云。此函数仅保留用于向后兼容。
 */
export function buildMediaUrl(relativePath: string) {
  const normalizedPath = relativePath
    .replaceAll("\\", "/")
    .replace(/^\/+/, "");

  return `/media/${normalizedPath}`;
}