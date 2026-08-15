# 缓存失效机制文档

## 概述
当执行编辑操作（创建、更新、删除、恢复）时，系统会自动清除相关的缓存，确保数据的实时性。

## 缓存失效映射

### 产品 (products)
| 操作 | API 路由 | 缓存清除 |
|------|---------|--------|
| 创建 | POST /api/admin/products | ✅ clearCacheByNamespace("products") |
| 更新 | PATCH /api/admin/products/:id | ✅ clearCacheByNamespace("products") |
| 删除 | DELETE /api/admin/products/:id | ✅ clearCacheByNamespace("products") |

### 解决方案 (solutions)
| 操作 | API 路由 | 缓存清除 |
|------|---------|--------|
| 创建 | POST /api/admin/solutions | ✅ clearCacheByNamespace("solutions") |
| 更新 | PATCH /api/admin/solutions/:id | ✅ clearCacheByNamespace("solutions") |
| 删除 | DELETE /api/admin/solutions/:id | ✅ clearCacheByNamespace("solutions") |
| 恢复 | POST /api/admin/solutions/:id/restore | ✅ clearCacheByNamespace("solutions") |

### 新闻 (news)
| 操作 | API 路由 | 缓存清除 |
|------|---------|--------|
| 创建 | POST /api/news | ✅ clearCacheByNamespace("news") + revalidatePath |
| 更新 | PATCH /api/news/:id | ✅ clearCacheByNamespace("news") + revalidatePath |
| 删除 | DELETE /api/news/:id | ✅ clearCacheByNamespace("news") + revalidatePath |
| 恢复 | POST /api/news/:id/restore | ✅ clearCacheByNamespace("news") + revalidatePath |

### 应用案例 (application-cases)
| 操作 | API 路由 | 缓存清除 |
|------|---------|--------|
| 创建 | POST /api/admin/application-cases | ✅ clearCacheByNamespace("application-cases") |
| 更新 | PATCH /api/admin/application-cases/:id | ✅ clearCacheByNamespace("application-cases") |
| 删除 | DELETE /api/admin/application-cases/:id | ✅ clearCacheByNamespace("application-cases") |
| 恢复 | POST /api/admin/application-cases/:id/restore | ✅ clearCacheByNamespace("application-cases") |

### 公司发展历程 (company-history)
| 操作 | API 路由 | 缓存清除 |
|------|---------|--------|
| 创建 | POST /api/admin/company-history | ✅ clearCacheByNamespace("company-history") |
| 更新 | PATCH /api/admin/company-history/:id | ✅ clearCacheByNamespace("company-history") |
| 删除 | DELETE /api/admin/company-history/:id | ✅ clearCacheByNamespace("company-history") |

### 分类 (categories)
| 操作 | API 路由 | 缓存清除 |
|------|---------|--------|
| 创建 | POST /api/admin/categories | ✅ clearCacheByNamespace("categories") |
| 更新 | PATCH /api/admin/categories/:id | ✅ clearCacheByNamespace("categories") |
| 删除 | DELETE /api/admin/categories/:id | ✅ clearCacheByNamespace("categories") |

### 战略布局 (strategic-locations)
| 操作 | API 路由 | 缓存清除 |
|------|---------|--------|
| 创建 | POST /api/admin/strategic-locations | ✅ clearCacheByNamespace("strategic-locations") |
| 更新 | PATCH /api/admin/strategic-locations/:id | ✅ clearCacheByNamespace("strategic-locations") |
| 删除 | DELETE /api/admin/strategic-locations/:id | ✅ clearCacheByNamespace("strategic-locations") |

## 工作原理

### 缓存管理器
- 位置: `src/lib/cache/manager.ts`
- 功能: 基于命名空间和参数键的内存缓存管理
- TTL: 默认 10 分钟

### 缓存清除函数
- 位置: `src/lib/cache/helpers.ts`
- `clearCacheByNamespace(namespace)`: 清除特定命名空间下的所有缓存
- `clearCache(namespace, params)`: 清除特定查询的缓存
- `clearAllCache()`: 清除所有缓存

### 与 Next.js 缓存的协调
- 新闻编辑同时调用 `revalidatePath()` 来清除 Next.js 路由缓存
- 其他内容类型使用 `clearCacheByNamespace()` 清除应用级别缓存

## 示例流程

**场景**: 用户编辑了一个产品

1. 用户在后台编辑产品信息
2. 前端发送 PATCH 请求到 `/api/admin/products/:id`
3. 后端更新数据库
4. **自动执行**: `clearCacheByNamespace("products")`
5. 所有关于 "products" 命名空间的缓存被清除
6. 下次查询时，会从数据库重新获取最新数据并重新缓存

## 验证

要验证缓存清除是否生效：

```typescript
// 1. 查询产品列表（缓存数据）
const products = await fetch('/api/products');

// 2. 编辑产品（自动清除缓存）
await fetch('/api/admin/products/123', {
  method: 'PATCH',
  body: JSON.stringify({ name: '新产品名称' })
});

// 3. 再次查询（从数据库获取最新数据）
const updatedProducts = await fetch('/api/products');
// 将看到最新的产品信息
```
