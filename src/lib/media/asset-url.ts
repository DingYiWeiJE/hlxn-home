import "server-only";

export function buildMediaUrl(
  relativePath: string | null | undefined,
): string {
  if (!relativePath) {
    return "";
  }
  const domain = (process.env.QINIU_DOMAIN ?? "").replace(/\/+$/, "");
  return `${domain}/${relativePath}`;
}

export function withMediaUrl<T extends { relativePath: string }>(
  asset: T,
): T & { url: string };
export function withMediaUrl<T extends { relativePath: string }>(
  asset: T | null | undefined,
): (T & { url: string }) | null;
export function withMediaUrl<T extends { relativePath: string }>(
  asset: T | null | undefined,
): (T & { url: string }) | null {
  if (!asset) {
    return null;
  }
  return { ...asset, url: buildMediaUrl(asset.relativePath) };
}
