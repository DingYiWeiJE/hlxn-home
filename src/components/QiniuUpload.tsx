'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface UploadResponse {
  success: boolean
  url?: string
  error?: string
}

export function QiniuUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploadedUrl(null)

    // 本地预览
    const reader = new FileReader()
    reader.onload = (event) => {
      setPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    // 上传
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', file.name)

      const response = await fetch('/api/uploads/images', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '上传失败')
      }

      setUploadedUrl(data.data.url)
      setError(null)

      // 复制到剪贴板
      if (navigator.clipboard && data.data.url) {
        navigator.clipboard.writeText(data.data.url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传出错')
      setPreview(null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 border rounded-lg bg-white">
      <h2 className="text-lg font-semibold mb-4">七牛图床上传</h2>

      <div className="space-y-4">
        {/* 上传区域 */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            disabled={uploading}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-600">上传中...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-600">点击选择或拖拽图片</p>
                <p className="text-xs text-gray-400">支持 JPG, PNG, GIF 等格式</p>
              </>
            )}
          </div>
        </div>

        {/* 预览 */}
        {preview && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">预览：</p>
            <img src={preview} alt="preview" className="w-full rounded max-h-48 object-cover" />
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* 成功提示和URL */}
        {uploadedUrl && (
          <div className="space-y-2">
            <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700">上传成功！链接已复制到剪贴板</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg break-all">
              <p className="text-xs text-gray-500 mb-1">图片链接：</p>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {uploadedUrl}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
