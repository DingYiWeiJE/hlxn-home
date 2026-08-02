/**
 * 七牛图床工具函数库
 */

export interface UploadResult {
  url: string
  id: string
  alt?: string
  mimeType: string
  sizeBytes: number
}

/**
 * 上传图片到七牛
 */
export async function uploadImageToQiniu(
  file: File,
  alt?: string
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  if (alt) {
    formData.append('alt', alt)
  }

  const response = await fetch('/api/uploads/images', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || '上传失败')
  }

  const result = await response.json()
  return result.data
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
  const domain = process.env.NEXT_PUBLIC_QINIU_DOMAIN || 'https://img.aact.pw'
  const baseUrl = `${domain}/${key}`

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
