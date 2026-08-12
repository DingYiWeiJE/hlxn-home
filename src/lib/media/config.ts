export function getUploadConfig() {
  const maxImageBytes = Number(
    process.env.MAX_IMAGE_UPLOAD_BYTES ?? 10 * 1024 * 1024,
  );

  const qiniuDomain = (
    process.env.QINIU_DOMAIN ??
    process.env.NEXT_PUBLIC_QINIU_DOMAIN ??
    ""
  ).replace(/\/+$/, "");

  return {
    maxImageBytes,

    // Backward-compatible alias used by older upload callers.
    maxBytes: maxImageBytes,

    maxPdfBytes: Number(
      process.env.MAX_PDF_UPLOAD_BYTES ?? 50 * 1024 * 1024,
    ),

    imageMaxWidth: Number(process.env.IMAGE_MAX_WIDTH ?? 1920),
    imageMaxInputPixels: Number(
      process.env.IMAGE_MAX_INPUT_PIXELS ?? 268_000_000,
    ),
    webpQuality: Number(process.env.IMAGE_WEBP_QUALITY ?? 82),

    qiniuAccessKey: process.env.QINIU_ACCESS_KEY ?? "",
    qiniuSecretKey: process.env.QINIU_SECRET_KEY ?? "",
    qiniuBucket: process.env.QINIU_BUCKET ?? "",
    qiniuDomain,
  };
}
