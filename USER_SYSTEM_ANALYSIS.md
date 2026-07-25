# 用户系统实现分析

## 当前状态
目前管理后台采用**仅密码认证**的简单方案：
- 单一管理员账户（通过 `ADMIN_PASSWORD_HASH` 环境变量配置）
- 基于密码的登录
- 会话通过 HMAC 签名 token 管理
- 存储在 HttpOnly Cookie 中

## 升级到完整用户系统的方案

### 方案对比

| 方案 | 复杂度 | 适用场景 | 迁移成本 |
|------|-------|--------|--------|
| **方案A：用户表 + 用户名密码** | 中 | 多管理员场景 | 中 |
| **方案B：用户表 + OAuth2** | 高 | 企业级应用 | 高 |
| **方案C：用户表 + LDAP/SSO** | 高 | 企业内网 | 高 |

---

## 推荐方案：用户表 + 用户名密码认证

**理由：** 
- 与现有架构兼容性好
- 实现难度适中
- 支持多管理员
- 无需外部依赖

### 1. 数据库schema扩展

在 `prisma/schema.prisma` 中添加：

```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  email     String?  @unique
  password  String   // bcrypt hash
  
  // 权限/角色
  role      UserRole @default(ADMIN)
  
  // 状态
  isActive  Boolean  @default(true)
  
  // 审计字段
  lastLogin DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 软删除
  deletedAt DateTime?
  
  @@index([username])
  @@index([deletedAt])
}

enum UserRole {
  SUPER_ADMIN  // 超级管理员：所有权限
  ADMIN        // 普通管理员：新闻管理
  EDITOR       // 编辑：仅查看和编辑新闻
  VIEWER       // 浏览者：仅查看
}
```

### 2. 项目结构扩展

```
src/lib/user-auth/
├── config.ts          // 用户认证配置
├── password.ts        // 密码加密/验证
├── session.ts         // 会话管理（保持现有）
├── require-auth.ts    // 认证检查中间件
└── permissions.ts     // 权限检查

src/app/api/auth/
├── login/route.ts     // 改进登录逻辑
├── logout/route.ts    // 保持现有
├── session/route.ts   // 保持现有
└── me/route.ts        // 获取当前用户信息

src/app/admin/users/
├── page.tsx           // 用户管理列表
├── [id]/edit/page.tsx // 用户编辑
└── create/page.tsx    // 创建用户
```

### 3. 迁移策略

#### Phase 1：添加用户表（向后兼容）
1. 创建 `User` 表
2. 修改登录逻辑支持用户名查询
3. 保留旧的环境变量密码支持（作为fallback）
4. 新部署自动创建默认管理员账户

#### Phase 2：创建用户管理界面
1. 超级管理员可创建/编辑/删除用户
2. 添加角色权限控制
3. 审计日志记录

#### Phase 3：移除密码环保变量
1. 确认所有用户通过表配置
2. 移除环境变量支持
3. 清理遗留代码

---

## 核心实现差异

### 当前登录流程
```
密码输入 → /api/admin/login → 对比 ADMIN_PASSWORD_HASH → 创建 token
```

### 新登录流程
```
用户名+密码 → /api/auth/login 
  → 查询 User 表 
  → bcrypt 验证密码 
  → 更新 lastLogin 
  → 创建 token 
  → 返回用户信息
```

### 会话验证差异
```diff
- 检查 cookie token 是否有效
+ 检查 cookie token 是否有效
+ 检查用户 isActive 状态
+ 检查用户 deletedAt 状态
```

---

## 权限控制设计

### 基于角色的访问控制（RBAC）

```typescript
// 权限映射
const rolePermissions = {
  SUPER_ADMIN: ['*'],  // 所有权限
  ADMIN: [
    'news:create',
    'news:read',
    'news:update',
    'news:delete',
    'news:publish',
    'media:upload',
    'users:read',  // 可查看其他用户
  ],
  EDITOR: [
    'news:read',
    'news:update',
    'media:upload',
  ],
  VIEWER: [
    'news:read',
    'media:read',
  ],
};
```

### 中间件检查
```typescript
// 在受保护路由前检查
export async function requireAuth(role?: UserRole) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  
  const user = await db.user.findUnique({
    where: { id: session.sub }
  });
  
  if (!user || !user.isActive || user.deletedAt) {
    redirect('/admin/login');
  }
  
  if (role && !hasPermission(user.role, role)) {
    throw new Error('Insufficient permissions');
  }
  
  return user;
}
```

---

## 安全考虑

### 已有保障（保持）
- ✅ HttpOnly Cookie（防 XSS）
- ✅ Same-origin CSRF 检查
- ✅ 速率限制（登录失败）
- ✅ HMAC 签名 token

### 新增保障
- ✅ bcrypt 密码加密（替代现有 bcryptjs）
- ✅ 用户状态检查（isActive, deletedAt）
- ✅ 会话与用户绑定（添加 userId）
- ✅ 登录日志（lastLogin）
- ✅ 权限检查（基于角色）
- ✅ 审计日志（可选）

### 修改建议
```typescript
// session.ts - 修改会话 payload
type SessionPayload = {
  sub: string;      // 改为 userId（UUID）
  username: string; // 新增
  role: UserRole;   // 新增
  exp: number;
  nonce: string;
};
```

---

## 初始化脚本

创建 `prisma/seed.ts` 初始化默认用户：

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 创建默认超级管理员
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@hanli.com",
      password: await bcrypt.hash("changeme123", 12),
      role: "SUPER_ADMIN",
    },
  });

  console.log("Default admin created:", admin.username);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 实现优先级

### 必须（MVP）
1. ✅ User 表 + 权限字段
2. ✅ 登录逻辑改为用户名查询
3. ✅ 用户管理基础界面

### 应该（1-2周）
4. 权限检查中间件
5. 审计日志
6. 密码重置功能

### 可以（3-4周）
7. 用户邀请系统
8. 双因素认证
9. OAuth 集成

---

## 环境变量调整

```bash
# 保留（兼容期）
ADMIN_PASSWORD_HASH=...
ADMIN_SESSION_SECRET=...

# 新增
USER_SESSION_SECRET=... # 可与上面相同
```

---

## 迁移检查清单

- [ ] 创建 User migration
- [ ] 添加权限中间件
- [ ] 修改登录 API
- [ ] 更新 session token 结构
- [ ] 创建用户管理页面
- [ ] 添加权限检查装饰器
- [ ] 编写测试
- [ ] 更新文档
- [ ] 数据迁移（环境变量 → User 表）
- [ ] 移除旧认证逻辑

