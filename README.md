# Hanli Chuneng 官网新闻系统

本项目是 Next.js + TypeScript 公司官网，新闻系统使用 App Router Route Handlers、PostgreSQL、Prisma、Tiptap JSON 和服务器本地图片目录。生产环境推荐通过 Docker 镜像打包部署，应用容器保持单实例运行。

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

生产环境变量固定放在 `/etc/hanly/hanly.env`，不要写入镜像，也不要提交到仓库。

生产示例：

```bash
DATABASE_URL=postgresql://hanly_app:强密码@127.0.0.1:5432/hanly?schema=public
APP_ORIGIN=https://example.com
UPLOAD_ROOT=/app/data/uploads
MEDIA_PUBLIC_PREFIX=/media
ADMIN_PASSWORD_HASH=替换为生成结果
ADMIN_SESSION_SECRET=替换为生成结果
ADMIN_SESSION_TTL_SECONDS=28800
MAX_IMAGE_UPLOAD_BYTES=10485760
IMAGE_MAX_WIDTH=1920
IMAGE_WEBP_QUALITY=82
ALLOWED_EXTERNAL_IMAGE_HOSTS=
```

如果 PostgreSQL 也运行在 Docker 网络内，`DATABASE_URL` 中的主机名应改为数据库服务名，例如 `postgres`。

## 图片存储

上传图片真实写入 `UPLOAD_ROOT`。Docker 部署时建议容器内使用 `/app/data/uploads`，并把宿主机目录挂载进去：

```bash
-v /var/lib/hanly/uploads:/app/data/uploads
```

数据库只保存：

- `relativePath`：例如 `news/2026/07/example.webp`
- `url`：例如 `/media/news/2026/07/example.webp`

图片不会写入 `public`、`.next`、`.next/standalone`、`out` 或镜像层。重新构建镜像、替换容器、回滚版本、删除旧镜像或服务器重启都不应删除上传图片。

开发环境通过 Next.js rewrite 将 `/media/*` 转发到 `/api/media/*`。生产环境可由 Nginx 直接 alias `/media/` 到宿主机的 `/var/lib/hanly/uploads/`，也可以统一反代给应用容器。

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

后台写接口使用 HttpOnly 签名 Cookie、Origin/Referer 校验和进程内登录失败限流。生产容器建议保持单实例运行，因为限流记录不跨进程、跨容器共享。

## Docker 镜像构建

生产部署使用 Next.js Node.js standalone 输出构建 Docker 镜像，不再使用 `out` 作为生产运行产物。

镜像构建前建议先在本地或 CI 中完成校验：

```bash
npm run lint
npm run typecheck
npm run test
```

构建镜像：

```bash
docker build -t hanly-home:20260725-001 .
```

也可以同时打一个稳定标签，方便 `docker compose` 或服务器脚本引用：

```bash
docker tag hanly-home:20260725-001 hanly-home:latest
```

生产镜像需要包含：

- Next.js standalone 运行产物
- `.next/static`
- `public`
- `prisma/schema.prisma`
- `prisma/migrations`
- Prisma Client
- 可执行的 Prisma CLI，用于生产迁移

镜像不要包含 `.env`、本地上传文件、数据库备份或 `out`。

## 生产初始化

示例步骤：

```bash
sudo mkdir -p /var/lib/hanly/uploads/news /etc/hanly
sudo chmod 750 /etc/hanly
```

安装 Docker、Docker Compose、PostgreSQL 和 Nginx。PostgreSQL 可以运行在宿主机或独立容器中；如果和应用在同一台服务器，优先只监听内网地址或 Docker 网络。

创建数据库和低权限用户：

```sql
CREATE DATABASE hanly;
CREATE USER hanly_app WITH PASSWORD '强密码';
GRANT CONNECT ON DATABASE hanly TO hanly_app;
\c hanly
GRANT USAGE, CREATE ON SCHEMA public TO hanly_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hanly_app;
```

创建 `/etc/hanly/hanly.env` 后，先执行数据库迁移：

```bash
docker run --rm \
  --env-file /etc/hanly/hanly.env \
  --network host \
  hanly-home:20260725-001 \
  ./node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma
```

生产不要使用 `prisma db push`。

## 运行容器

宿主机 PostgreSQL 示例：

```bash
docker run -d \
  --name hanly-home \
  --restart unless-stopped \
  --env-file /etc/hanly/hanly.env \
  --network host \
  -v /var/lib/hanly/uploads:/app/data/uploads \
  hanly-home:20260725-001
```

如果不使用 `--network host`，可以改为端口映射：

```bash
docker run -d \
  --name hanly-home \
  --restart unless-stopped \
  --env-file /etc/hanly/hanly.env \
  -p 127.0.0.1:3000:3000 \
  -v /var/lib/hanly/uploads:/app/data/uploads \
  hanly-home:20260725-001
```

健康检查：

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

更新版本时先构建新镜像，执行迁移，再替换容器：

```bash
docker build -t hanly-home:20260725-002 .
docker run --rm --env-file /etc/hanly/hanly.env --network host hanly-home:20260725-002 ./node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma
docker rm -f hanly-home
docker run -d --name hanly-home --restart unless-stopped --env-file /etc/hanly/hanly.env --network host -v /var/lib/hanly/uploads:/app/data/uploads hanly-home:20260725-002
curl -fsS http://127.0.0.1:3000/api/health
```

## Docker Compose 示例

如果应用和数据库都由 Docker Compose 管理，可参考：

```yaml
services:
  app:
    image: hanly-home:latest
    restart: unless-stopped
    env_file:
      - /etc/hanly/hanly.env
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - /var/lib/hanly/uploads:/app/data/uploads
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: hanly
      POSTGRES_USER: hanly_app
      POSTGRES_PASSWORD: 强密码
    volumes:
      - hanly_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hanly_app -d hanly"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  hanly_postgres_data:
```

此模式下 `DATABASE_URL` 示例：

```bash
DATABASE_URL=postgresql://hanly_app:强密码@postgres:5432/hanly?schema=public
```

迁移命令：

```bash
docker compose run --rm app ./node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma
docker compose up -d
```

## Nginx

生产示例见 `nginx.hanly.conf`。Docker 部署时建议把普通请求代理到 `127.0.0.1:3000`，上传文件仍可由 Nginx 从宿主机目录直接返回：

```nginx
location /media/ {
    alias /var/lib/hanly/uploads/;
    try_files $uri =404;
}

location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

HTTPS 证书路径按服务器实际证书配置，不要直接复制示例域名。

## 回滚

Docker 回滚以镜像标签为单位。保留最近几个可用镜像标签，例如：

```bash
docker images hanly-home
```

回滚到上一个版本：

```bash
docker rm -f hanly-home
docker run -d --name hanly-home --restart unless-stopped --env-file /etc/hanly/hanly.env --network host -v /var/lib/hanly/uploads:/app/data/uploads hanly-home:上一个标签
curl -fsS http://127.0.0.1:3000/api/health
```

不要删除 `/var/lib/hanly/uploads`、`/etc/hanly` 或 PostgreSQL 数据目录。

## 备份与恢复

必须同时备份数据库和上传图片：

```bash
pg_dump -Fc -d hanly > hanly-db-$(date +%F).dump
tar -czf hanly-uploads-$(date +%F).tar.gz /var/lib/hanly/uploads
```

数据库和图片最好在同一时间窗口备份。仅备份数据库不够，仅备份图片目录也不够。迁移新服务器时必须迁移两者，Docker 镜像不是业务数据备份重点。

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
- 登录失败限流是进程内实现，单实例容器可用；容器重启后记录清空，多实例模式下不共享。
- 新闻不实现分类、标签、评论、审核流、历史版本、对象存储或定时发布。
