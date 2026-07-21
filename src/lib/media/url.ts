export function buildMediaUrl(relativePath: string) {
  const normalized = relativePath.replaceAll("\\", "/").replace(/^\/+/, "");
  return `/media/${normalized}`;
}
