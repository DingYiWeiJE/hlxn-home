/**
 * 七牛图床工具函数库
 */

import { qiniuConfig } from '../config';
import { uploadAssetDirect } from './upload-client';

export interface UploadResult {
  url: string
  id: string
  alt?: string
  mimeType: string
  sizeBytes: number
}

/**
 * 上传图片到七牛（客户端直传，走 /api/admin/assets/upload-token + finalize）
 */
export async function uploadImageToQiniu(
  file: File,
  alt?: string
): Promise<UploadResult> {
  const asset = await uploadAssetDirect(file, {
    type: 'IMAGE',
    purpose: 'GENERAL',
    alt,
  })

  return {
    url: asset.url,
    id: asset.id,
    alt: asset.alt ?? undefined,
    mimeType: asset.mimeType,
    sizeBytes: asset.size,
  }
}

/**
 * 生成七牛图片URL
 * 支持添加七牛图片处理参数
 */
export function getQiniuImageUrl(
  key: string,
  options?: {
    width?: number
    height?: number
    quality?: number // 1-100
    format?: 'jpg' | 'png' | 'gif' | 'webp'
  }
): string {
  const baseUrl = `${qiniuConfig.domain}/${key}`

  if (!options) return baseUrl

  const params: string[] = []

  if (options.width || options.height) {
    const w = options.width || '-'
    const h = options.height || '-'
    params.push(`imageView2/2/w/${w}/h/${h}`)
  }

  if (options.quality) {
    params.push(`/quality/${Math.min(Math.max(options.quality, 1), 100)}`)
  }

  if (options.format) {
    params.push(`/format/${options.format}`)
  }

  return params.length > 0 ? `${baseUrl}?${params.join('|')}` : baseUrl
}

/**
 * 批量上传图片
 */
export async function uploadMultipleImages(
  files: File[]
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file) =>
      uploadImageToQiniu(file).catch((error) => {
        console.error(`Failed to upload ${file.name}:`, error)
        return null
      })
    )
  )

  return results.filter((result): result is UploadResult => result !== null)
}

/**
 * 验证文件是否为有效的图片
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  return validTypes.includes(file.type) && file.size <= maxSize
}
