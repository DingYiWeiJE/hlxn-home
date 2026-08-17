/**
 * 应用配置 - 集中管理所有环境变量和配置常量
 */

// 七牛云配置
export const qiniuConfig = {
  domain: process.env.NEXT_PUBLIC_QINIU_DOMAIN || 'https://img.aact.pw',
  accessKey: process.env.QINIU_ACCESS_KEY,
  secretKey: process.env.QINIU_SECRET_KEY,
  bucket: process.env.QINIU_BUCKET,
  enabled: process.env.USE_QINIU === 'true',
} as const;

// 获取七牛域名主机名（用于 Next.js 远程图片配置）
export const getQiniuHostname = (): string => {
  try {
    const url = new URL(qiniuConfig.domain);
    return url.hostname;
  } catch {
    // 如果 URL 解析失败，提取默认域名
    return 'img.aact.pw';
  }
};

// 检查 URL 是否来自七牛（用于 Image 组件的 unoptimized 属性）
export const isQiniuUrl = (url?: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    const qiniuUrl = new URL(qiniuConfig.domain);
    return urlObj.hostname === qiniuUrl.hostname;
  } catch {
    // 如果解析失败，尝试简单的字符串匹配
    return url.includes(getQiniuHostname());
  }
};

// API 配置
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost',
} as const;

// 文件上传配置
export const uploadConfig = {
  maxImageSize: parseInt(process.env.MAX_IMAGE_UPLOAD_BYTES || '10485760'),
  maxImageWidth: parseInt(process.env.IMAGE_MAX_WIDTH || '1920'),
  webpQuality: parseInt(process.env.IMAGE_WEBP_QUALITY || '82'),
  allowedExternalHosts: (process.env.ALLOWED_EXTERNAL_IMAGE_HOSTS || '').split(',').filter(Boolean),
} as const;
