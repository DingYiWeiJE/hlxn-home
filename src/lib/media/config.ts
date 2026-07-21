export function getUploadConfig() {
  return {
    uploadRoot: process.env.UPLOAD_ROOT ?? "./data/uploads",
    publicPrefix: process.env.MEDIA_PUBLIC_PREFIX ?? "/media",
    maxBytes: Number(process.env.MAX_IMAGE_UPLOAD_BYTES ?? 10 * 1024 * 1024),
    imageMaxWidth: Number(process.env.IMAGE_MAX_WIDTH ?? 1920),
    webpQuality: Number(process.env.IMAGE_WEBP_QUALITY ?? 82),
  };
}
