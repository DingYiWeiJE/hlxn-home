export function getUploadConfig() {
  const maxImageBytes = Number(
    process.env.MAX_IMAGE_UPLOAD_BYTES ?? 10 * 1024 * 1024,
  );

  return {
    // 文件持久化根目录
    uploadRoot: process.env.UPLOAD_ROOT ?? "./data/uploads",

    // 对外媒体访问前缀
    publicPrefix: process.env.MEDIA_PUBLIC_PREFIX ?? "/media",

    // 图片最大 10 MB
    maxImageBytes,

    // 暂时保留，兼容现有新闻图片上传逻辑
    maxBytes: maxImageBytes,

    // PDF 最大 50 MB
    maxPdfBytes: Number(
      process.env.MAX_PDF_UPLOAD_BYTES ?? 50 * 1024 * 1024,
    ),

    // 图片处理配置
    imageMaxWidth: Number(process.env.IMAGE_MAX_WIDTH ?? 1920),
    imageMaxInputPixels: Number(
      process.env.IMAGE_MAX_INPUT_PIXELS ?? 268_000_000,
    ),
    webpQuality: Number(process.env.IMAGE_WEBP_QUALITY ?? 82),
  };
}
