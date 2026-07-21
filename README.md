# Hanli Chuneng 官网新闻系统

本项目是 Next.js + TypeScript 公司官网，新闻系统使用 App Router Route Handlers、PostgreSQL、Prisma、Tiptap JSON、服务器本地图片目录和 PM2 单实例运行。

## 本地开发

1. 安装依赖：

```bash
npm install
```

2. 复制环境变量：

```bash
cp .env.example .env
```

3. 启动本地 PostgreSQL：

```bash
docker compose -f docker-compose.dev.yml up -d
```

4. 创建 migration 并生成 Prisma Client：

```bash
npm run prisma:migrate:dev
npm run prisma:generate
npm run seed
```

5. 生成管理员凭据，不要把明文密码写入仓库：

```bash
npm exec tsx scripts/generate-admin-credentials.ts -- "你的管理员密码"
```

把输出的 `ADMIN_PASSWORD_HASH` 和 `ADMIN_SESSION_SECRET` 填入 `.env`。

6. 启动开发服务：

```bash
npm run dev
```

后台入口：`/admin/login`。公开新闻入口：`/news`。

## 环境变量

必需变量见 `.env.example`：

- `DATABASE_URL`
- `APP_ORIGIN`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `ADMIN_SESSION_TTL_SECONDS`
- `UPLOAD_ROOT`
- `MEDIA_PUBLIC_PREFIX`
- `MAX_IMAGE_UPLOAD_BYTES`
- `IMAGE_MAX_WIDTH`
- `IMAGE_WEBP_QUALITY`
- `ALLOWED_EXTERNAL_IMAGE_HOSTS`

生产环境变量固定放在 `/etc/hanly/hanly.env`，不要放进发布包。

生产示例：

```bash
DATABASE_URL=postgresql://hanly_app:强密码@127.0.0.1:5432/hanly?schema=public
APP_ORIGIN=https://example.com
UPLOAD_ROOT=/var/lib/hanly/uploads
MEDIA_PUBLIC_PREFIX=/media
```

## 图片存储

上传图片真实写入 `UPLOAD_ROOT`，生产为 `/var/lib/hanly/uploads`。数据库只保存：

- `relativePath`：例如 `news/2026/07/example.webp`
- `url`：例如 `/media/news/2026/07/example.webp`

图片不会写入 `public`、`.next`、`.next/standalone`、`out` 或 release 目录。重新构建、替换 release、回滚、删除旧 release、PM2 重启、服务器重启都不会删除上传图片。

开发环境通过 Next.js rewrite 将 `/media/*` 转发到 `/api/media/*`。生产由 Nginx 直接 alias `/media/` 到 `/var/lib/hanly/uploads/`。

## API

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET /api/news`
- `POST /api/news`
- `GET /api/admin/news`
- `GET /api/news/[id]`
- `PATCH /api/news/[id]`
- `DELETE /api/news/[id]`
- `POST /api/news/[id]/restore`
- `GET /api/news/slug/[slug]`
- `POST /api/uploads/images`
- `GET|HEAD /api/media/[...path]`
- `GET /api/health`

后台写接口使用 HttpOnly 签名 Cookie、Origin/Referer 校验和进程内登录失败限流。PM2 默认单实例，因为限流记录不跨进程共享。

## 构建发布

本项目不再使用 `out` 作为生产运行产物。使用 Next.js Node.js standalone：

```bash
npm run build:release
```

发布包包含：

- `server.js`
- `.next/static`
- `public`
- `prisma/schema.prisma`
- `prisma/migrations`
- `package.json`
- `package-lock.json`
- `ecosystem.config.cjs`

发布包不包含 `.env`、本地上传文件或 `out`。

必须在 WSL/Linux 构建，且 Node.js 主版本和 CPU 架构要与生产服务器一致。可用环境变量阻止不匹配：

```bash
PRODUCTION_NODE_MAJOR=20 PRODUCTION_ARCH=x64 npm run build:release
```

## 生产初始化

示例步骤，应用进程不要使用 root：

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin hanly
sudo mkdir -p /var/www/hanly/releases /var/www/hanly/shared/logs /var/lib/hanly/uploads/news /etc/hanly
sudo chown -R hanly:hanly /var/www/hanly /var/lib/hanly/uploads
sudo chmod 750 /etc/hanly
```

安装 Node.js、PM2、PostgreSQL、Nginx。PostgreSQL 如果和应用在同一台服务器，优先只监听 `127.0.0.1`。

创建数据库和低权限用户：

```sql
CREATE DATABASE hanly;
CREATE USER hanly_app WITH PASSWORD '强密码';
GRANT CONNECT ON DATABASE hanly TO hanly_app;
\c hanly
GRANT USAGE, CREATE ON SCHEMA public TO hanly_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hanly_app;
```

创建 `/etc/hanly/hanly.env` 后执行部署：

```bash
bash scripts/deploy.sh /path/to/release-YYYYmmdd-HHMMSS.tar.gz
pm2 save
pm2 startup
```

`deploy.sh` 会执行发布包内的 `./node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma`，生产不要使用 `prisma db push`。

## PM2

配置文件：`ecosystem.config.cjs`。

- `cwd`: `/var/www/hanly/current`
- `script`: `server.js`
- `instances`: `1`
- `exec_mode`: `fork`
- 日志：`/var/www/hanly/shared/logs`

命令：

```bash
pm2 startOrReload /var/www/hanly/current/ecosystem.config.cjs
pm2 save
pm2 startup
```

## Nginx

生产示例见 `nginx.hanly.conf`。其中 `/media/` alias 到 `/var/lib/hanly/uploads/`，`/_next/static/` alias 到 `/var/www/hanly/current/.next/static/`，普通请求代理到 `127.0.0.1:3000`。HTTPS 证书路径按服务器实际证书配置，不要直接复制示例域名。

## 回滚

版本目录结构：

```text
/var/www/hanly/
├── releases/
├── current -> /var/www/hanly/releases/某个版本
└── shared/logs/
```

手工回滚：

```bash
ln -sfn /var/www/hanly/releases/上一个版本 /var/www/hanly/current
pm2 startOrReload /var/www/hanly/current/ecosystem.config.cjs
curl -fsS http://127.0.0.1:3000/api/health
```

不要删除 `/var/lib/hanly/uploads`、`/etc/hanly` 或 PostgreSQL 数据目录。

## 备份与恢复

必须同时备份数据库和上传图片：

```bash
pg_dump -Fc -d hanly > hanly-db-$(date +%F).dump
tar -czf hanly-uploads-$(date +%F).tar.gz /var/lib/hanly/uploads
```

数据库和图片最好在同一时间窗口备份。仅备份数据库不够，仅备份图片目录也不够。迁移新服务器时必须迁移两者，release 目录不是业务数据备份重点。

恢复示例：

```bash
pg_restore -d hanly --clean --if-exists hanly-db-YYYY-MM-DD.dump
sudo tar -xzf hanly-uploads-YYYY-MM-DD.tar.gz -C /
```

## 测试和校验

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

数据库集成测试和图片上传端到端验证需要本地 PostgreSQL 运行并配置 `.env`。Seed 中的 `/media/news/demo/example-1.webp` 仅用于展示数据格式，不保证文件存在。

## 已知限制

- 管理员只有一个密码，没有用户、角色、注册、找回密码。
- 登录失败限流是进程内实现，单实例 PM2 可用；进程重启后记录清空，多实例模式下不共享。
- 新闻不实现分类、标签、评论、审核流、历史版本、对象存储或定时发布。
