# 七牛图床集成指南

## 📦 已完成的集成

✅ 已安装 `qiniu` 包  
✅ 已配置 Next.js Image 组件白名单 (img.aact.pw)  
✅ 已创建七牛上传接口 (`/api/uploads/images`)  
✅ 已创建前端上传组件和工具函数  

## 🎯 三大使用场景

### 1️⃣ 页面直接显示已有图片（推荐）

#### 使用 Next.js Image 组件（最优性能）
```typescript
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="https://img.aact.pw/your-image.jpg"
      alt="图片描述"
      width={800}
      height={400}
      priority // 如果是首屏图片，加上这个
    />
  )
}
```

#### 或使用自定义 QiniuImage 组件
```typescript
import { QiniuImage } from '@/components/QiniuImage'

export default function Page() {
  return (
    <QiniuImage
      src="your-image.jpg" // 支持 key 或完整 URL
      alt="图片描述"
      width={800}
      height={600}
    />
  )
}
```

#### 普通 img 标签（不推荐，没有优化）
```tsx
<img src="https://img.aact.pw/your-image.jpg" alt="图片" />
```

---

### 2️⃣ 前端上传图片

#### 完整组件示例
```typescript
import { QiniuUpload } from '@/components/QiniuUpload'

export default function Admin() {
  return (
    <div>
      <h1>上传图片</h1>
      <QiniuUpload />
    </div>
  )
}
```

#### 自定义上传
```typescript
'use client'
import { uploadImageToQiniu } from '@/lib/qiniu/client'

export function MyUpload() {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadImageToQiniu(file, '图片描述')
      console.log('上传成功:', result.url)
      // 将 result.url 保存到数据库
    } catch (error) {
      console.error('上传失败:', error)
    }
  }

  return <input type="file" onChange={handleUpload} accept="image/*" />
}
```

---

### 3️⃣ 后端接口上传（NodeJS）

#### 直接调用上传接口
```typescript
import { uploadImageToQiniu } from '@/lib/qiniu/client'

// 在服务端组件中
const file = await someSourceOfFile() // 获取文件
const result = await uploadImageToQiniu(file)
console.log(result.url) // https://img.aact.pw/...
```

#### 使用工具函数库

```typescript
import {
  uploadImageToQiniu,
  uploadMultipleImages,
  getQiniuImageUrl,
  isValidImageFile,
} from '@/lib/qiniu/client'

// 单文件上传
const result = await uploadImageToQiniu(file, 'alt描述')

// 批量上传
const results = await uploadMultipleImages([file1, file2, file3])

// 生成带处理参数的URL（七牛图片处理）
const url = getQiniuImageUrl('image-key', {
  width: 400,
  height: 300,
  quality: 80,
  format: 'webp',
})
// 返回: https://img.aact.pw/image-key?imageView2/2/w/400/h/300|/quality/80|/format/webp

// 验证文件
if (isValidImageFile(file)) {
  const result = await uploadImageToQiniu(file)
}
```

---

## 📝 存储方式对比

### 旧方案（本地存储）
```
./data/uploads/
└── 20240802_xxx.jpg
```
❌ 需要备份和迁移  
❌ 本地磁盘容量限制  
❌ 无法跨服务器共享  

### 新方案（七牛 CDN）
```
https://img.aact.pw/20240802-abc123.jpg
```
✅ 自动备份和分发  
✅ 无容量限制  
✅ 全球 CDN 加速  
✅ 支持图片处理和优化  

---

## 🔐 安全特性

- ✅ 前端无法访问 AK/SK（环境变量保护）
- ✅ 所有上传请求都要求管理员认证
- ✅ CSRF 防护检查
- ✅ 文件类型和大小验证
- ✅ 上传文件使用时间戳 + 随机数命名

---

## 📊 API 接口详情

### 上传端点
**POST** `/api/uploads/images`

#### 请求
```json
{
  "file": File,        // 图片文件
  "alt": "图片描述"    // 可选
}
```

#### 成功响应 (201)
```json
{
  "success": true,
  "data": {
    "id": "1722584...-abc123.jpg",
    "url": "https://img.aact.pw/1722584...-abc123.jpg",
    "alt": "图片描述",
    "mimeType": "image/jpeg",
    "sizeBytes": 102400
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

## 🛠️ 配置文件

### next.config.ts
已配置七牛域名白名单，Image 组件可直接加载 img.aact.pw 的图片

### .env
```env
# 服务端密钥（不会暴露到前端）
QINIU_ACCESS_KEY=BV-uLEkxqetnbcyEm6srSkhziUaQG2CF7EigpL9s
QINIU_SECRET_KEY=41FNHAPCVwmR2V9msN-kPfryPsuoVgVBNdLWrCu0
QINIU_BUCKET=evay-hanly
QINIU_DOMAIN=https://img.aact.pw

# 前端可访问（NEXT_PUBLIC_ 前缀）
NEXT_PUBLIC_QINIU_DOMAIN=https://img.aact.pw
```

---

## ⚡ 最佳实践

### 1. 在数据库中存储 key 而不是完整 URL
```typescript
// ❌ 不好
db.image.create({ url: 'https://img.aact.pw/abc123.jpg' })

// ✅ 好
db.image.create({ key: 'abc123.jpg' })
// 需要时构造: `${QINIU_DOMAIN}/${key}`
```

### 2. 批量上传大量图片
```typescript
const files = await getFilesFromSomewhere()
const results = await uploadMultipleImages(files)
```

### 3. 前端验证后再上传
```typescript
import { isValidImageFile } from '@/lib/qiniu/client'

if (!isValidImageFile(file)) {
  alert('文件格式或大小不符')
  return
}
```

### 4. 使用 Next.js Image 的 priority 属性
```typescript
<Image
  src="https://img.aact.pw/hero.jpg"
  alt="banner"
  priority // 首屏图片用 priority 跳过懒加载
  width={1200}
  height={600}
/>
```

---

## 🔍 调试

### 检查环境变量
```bash
# 在 Node REPL 中
process.env.QINIU_DOMAIN      // https://img.aact.pw
process.env.NEXT_PUBLIC_QINIU_DOMAIN // https://img.aact.pw
```

### 检查上传是否成功
在浏览器开发者工具中：
1. Network 标签查看 POST `/api/uploads/images` 的响应
2. 检查返回的 `url` 字段
3. 尝试直接访问该 URL

### 常见问题

#### Q: 上传后看不到图片？
A: 
- 检查七牛bucket名称是否正确
- 检查七牛 AK/SK 是否有效
- 验证 QINIU_DOMAIN 设置是否正确

#### Q: Image 组件显示 403？
A:
- 检查 next.config.ts 是否配置了 img.aact.pw 白名单
- 检查重启了 Next.js 开发服务器

#### Q: 上传 401 Unauthorized？
A:
- 验证是否以管理员身份登录
- 检查 CSRF token 是否有效

---

## 📚 相关文件

- 上传接口：`src/app/api/uploads/images/route.ts`
- 前端组件：`src/components/QiniuUpload.tsx`
- 图片组件：`src/components/QiniuImage.tsx`
- 工具函数：`src/lib/qiniu/client.ts`
