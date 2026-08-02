# 七牛图床集成完成

## ✅ 现状

所有图片上传已全部迁移到七牛，包括：

### 1️⃣ 应用案例（Application Cases）
- **页面**：`http://localhost:3000/admin/application-cases/new`
- **组件**：`ApplicationCaseImageUploader.tsx`
- **接口**：`POST /api/admin/assets/upload`
- **状态**：✅ 已切换七牛

### 2️⃣ 新闻编辑器（News Editor）
- **页面**：新闻编辑页面
- **组件**：`NewsEditor.tsx`
- **接口**：`POST /api/uploads/images`
- **状态**：✅ 已切换七牛

### 3️⃣ 产品管理（Products）
- **页面**：`http://localhost:3000/admin/products/...`
- **组件**：`MediaAssetPicker.tsx`
- **接口**：`POST /api/admin/assets/upload`
- **状态**：✅ 已切换七牛

### 4️⃣ 公司历史（Company History）
- **页面**：公司历史编辑页面
- **组件**：`CompanyHistoryImagePicker.tsx`
- **接口**：`POST /api/admin/assets/upload`
- **状态**：✅ 已切换七牛

### 5️⃣ 策略位置（Strategic Locations）
- **页面**：策略位置编辑页面
- **组件**：`StrategicLocationImagePicker.tsx`
- **接口**：`POST /api/admin/assets/upload`
- **状态**：✅ 已切换七牛

### 6️⃣ 资源管理（Assets Management）
- **页面**：`http://localhost:3000/admin/assets`
- **接口**：`POST /api/admin/assets/upload`
- **状态**：✅ 已切换七牛

---

## 📊 上传接口对比

| 接口 | 用途 | 数据库记录 | 状态 |
|------|------|---------|------|
| `/api/admin/assets/upload` | 后台资源管理（应用案例、产品等） | ✅ 保存 MediaAsset | 七牛 |
| `/api/uploads/images` | 新闻编辑器、通用上传 | ❌ 不保存 | 七牛 |

---

## 🔄 数据流转

### 应用案例上传流程
```
用户选择图片
    ↓
ApplicationCaseImageUploader.tsx
    ↓
POST /api/admin/assets/upload
    ↓
七牛上传（qiniu SDK）
    ↓
保存 MediaAsset 到数据库
    ↓
返回 mediaAsset 记录给前端
    ↓
保存 applicationCase 记录（imageAssetId）
```

### 新闻编辑器上传流程
```
用户粘贴图片或点击上传
    ↓
NewsEditor.tsx
    ↓
POST /api/uploads/images
    ↓
七牛上传（qiniu SDK）
    ↓
返回七牛 URL 给前端
    ↓
插入富文本编辑器
```

---

## 🔐 安全性

所有上传接口都包含：
- ✅ 管理员认证验证（`requireAdminActor()`）
- ✅ CSRF 防护（`assertSameOriginRequest()`）
- ✅ 文件类型验证（仅允许 JPG、PNG、WebP）
- ✅ 文件大小限制（≤ 10MB）
- ✅ 服务端七牛签名（AK/SK 不暴露）

---

## 📝 修改的文件

1. **`src/app/api/admin/assets/upload/route.ts`** ⭐️ 重要
   - 修改为使用七牛上传
   - 保留数据库记录功能

2. **`src/app/api/uploads/images/route.ts`** ⭐️ 重要
   - 新建七牛上传接口

3. **`next.config.ts`**
   - 添加 img.aact.pw 白名单

4. **`.env`**
   - 添加 NEXT_PUBLIC_QINIU_DOMAIN

---

## 🧪 测试清单

测试上传是否成功调用七牛：

- [ ] 应用案例上传
- [ ] 新闻图片上传
- [ ] 产品图片上传
- [ ] 公司历史图片上传
- [ ] 策略位置上传
- [ ] 资源管理页面上传

### 验证方法

在浏览器开发者工具中：
1. 打开 Network 标签
2. 尝试上传图片
3. 查看请求：
   - 请求 URL：`/api/admin/assets/upload` 或 `/api/uploads/images`
   - 响应中应该包含 `https://img.aact.pw/...` 的 URL

---

## 📚 文档位置

- 完整使用指南：`QINIU_GUIDE.md`
- 前端组件示例：`src/components/QiniuUpload.tsx`
- 工具函数库：`src/lib/qiniu/client.ts`

---

## 💾 存储统计

现在所有新上传的图片都会：
- 📁 存储在七牛 CDN (evay-hanly bucket)
- 🌍 通过 img.aact.pw 域名访问
- 🔄 自动备份和分发
- ⚡ 享受 CDN 全球加速

旧的本地文件仍保留在 `./data/uploads/`，可以逐步迁移或清理。
