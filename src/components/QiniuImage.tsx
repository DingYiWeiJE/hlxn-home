import Image from 'next/image'

interface QiniuImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down'
}

/**
 * 七牛图床图片组件
 * 自动处理懒加载、格式优化、响应式等
 */
export function QiniuImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  objectFit = 'cover',
}: QiniuImageProps) {
  // 如果src已经是完整URL，直接使用；否则拼接七牛域名
  const imageUrl = src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_QINIU_DOMAIN}/${src}`

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ objectFit }}
      loading="lazy"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 80vw"
    />
  )
}
