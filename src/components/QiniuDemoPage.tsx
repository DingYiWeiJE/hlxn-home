'use client'

import { useState } from 'react'
import { QiniuUpload } from '@/components/QiniuUpload'
import { uploadImageToQiniu, getQiniuImageUrl } from '@/lib/qiniu/client'

/**
 * 这是七牛图床集成的示例页面
 * 展示三种常见用法：
 * 1. 使用 QiniuUpload 组件
 * 2. 手动调用上传函数
 * 3. 显示已上传的图片
 */
export function QiniuDemoPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  // 演示手动上传
  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadProgress('上传中...')
      const result = await uploadImageToQiniu(file, '示例图片')
      setImageUrl(result.url)
      setUploadProgress(`✓ 上传成功！URL: ${result.url}`)
    } catch (error) {
      setUploadProgress(`✗ 上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  return (
    <div className="container mx-auto p-8 space-y-12">
      <h1 className="text-3xl font-bold mb-8">七牛图床集成示例</h1>

      {/* 方式1: 使用完整组件 */}
      <section className="border rounded-lg p-6 bg-gray-50">
        <h2 className="text-xl font-bold mb-4">方式1: 使用完整组件</h2>
        <p className="text-gray-600 mb-4">
          直接使用 QiniuUpload 组件，包含验证、预览、错误处理等完整功能
        </p>
        <QiniuUpload />
      </section>

      {/* 方式2: 手动调用函数 */}
      <section className="border rounded-lg p-6 bg-gray-50">
        <h2 className="text-xl font-bold mb-4">方式2: 手动调用函数</h2>
        <p className="text-gray-600 mb-4">
          自定义上传逻辑，使用 uploadImageToQiniu 函数
        </p>
        <input
          type="file"
          onChange={handleManualUpload}
          accept="image/*"
          className="block border rounded p-2 mb-4"
        />
        {uploadProgress && (
          <div
            className={`p-4 rounded ${
              uploadProgress.includes('✓')
                ? 'bg-green-50 text-green-700'
                : uploadProgress.includes('✗')
                  ? 'bg-red-50 text-red-700'
                  : 'bg-blue-50 text-blue-700'
            }`}
          >
            {uploadProgress}
          </div>
        )}
      </section>

      {/* 显示已上传的图片 */}
      {imageUrl && (
        <section className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-bold mb-4">上传的图片预览</h2>
          <img
            src={imageUrl}
            alt="已上传的图片"
            className="max-w-md rounded-lg shadow-lg"
          />
          <p className="text-sm text-gray-600 mt-4 break-all">{imageUrl}</p>
        </section>
      )}

      {/* 代码示例 */}
      <section className="border rounded-lg p-6 bg-gray-50">
        <h2 className="text-xl font-bold mb-4">📝 代码示例</h2>
        <div className="space-y-4 text-sm font-mono">
          <div>
            <h3 className="font-bold mb-2">上传单个图片：</h3>
            <pre className="bg-black text-green-400 p-3 rounded overflow-x-auto">
{`import { uploadImageToQiniu } from '@/lib/qiniu/client'

const file = e.target.files[0]
const result = await uploadImageToQiniu(file, '图片描述')
console.log(result.url) // https://img.aact.pw/...`}
            </pre>
          </div>

          <div>
            <h3 className="font-bold mb-2">显示图片（Next.js Image）：</h3>
            <pre className="bg-black text-green-400 p-3 rounded overflow-x-auto">
{`import Image from 'next/image'

<Image
  src="https://img.aact.pw/image.jpg"
  alt="描述"
  width={800}
  height={600}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-bold mb-2">生成处理后的URL：</h3>
            <pre className="bg-black text-green-400 p-3 rounded overflow-x-auto">
{`import { getQiniuImageUrl } from '@/lib/qiniu/client'

const url = getQiniuImageUrl('image.jpg', {
  width: 400,
  height: 300,
  quality: 80,
  format: 'webp'
})`}
            </pre>
          </div>
        </div>
      </section>

      {/* 信息卡 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-blue-50">
          <h3 className="font-bold text-blue-900 mb-2">✅ 已配置</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• qiniu 包已安装</li>
            <li>• API 端点：/api/uploads/images</li>
            <li>• 域名白名单已配置</li>
            <li>• 环境变量已设置</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4 bg-green-50">
          <h3 className="font-bold text-green-900 mb-2">🔐 安全特性</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• 管理员认证保护</li>
            <li>• CSRF 防护</li>
            <li>• 文件验证</li>
            <li>• 服务端签名</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4 bg-purple-50">
          <h3 className="font-bold text-purple-900 mb-2">📊 存储优势</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• CDN 全球加速</li>
            <li>• 自动备份</li>
            <li>• 无容量限制</li>
            <li>• 图片处理能力</li>
          </ul>
        </div>
      </section>

      {/* 文档链接 */}
      <section className="border-t pt-6">
        <p className="text-gray-600">
          📚 详细文档请查看项目根目录的{' '}
          <code className="bg-gray-100 px-2 py-1 rounded">QINIU_GUIDE.md</code>
        </p>
      </section>
    </div>
  )
}
