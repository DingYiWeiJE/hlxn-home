# Hanly Home v3 镜像包部署文档

本文档用于运维同事拿到 `hanly-home-v3.tar.gz` 后，在一台清空后的 Linux 服务器上部署上线，并保证服务器重启后服务自动启动。

## 1. 部署目标

- 应用镜像：`hanly-home:v3`
- 应用容器端口：容器内 `3000`
- 对外访问：推荐宿主机 `80 -> 3000`
- 数据库：PostgreSQL 16
- 数据库名：`hanly`
- 数据库用户：`hanly_app`
- 上传文件持久化目录：`/opt/hanly/uploads`
- 部署目录：`/opt/hanly`
- 启动方式：`docker compose up -d`
- 自启动方式：`restart: unless-stopped`

## 2. 前置要求

服务器需要已安装：

```bash
docker --version
docker compose version
```

如果服务器已有 Nginx 占用 80 端口，不要直接映射 `80:3000`，改用 `127.0.0.1:3000:3000`，再由 Nginx 反代到 `127.0.0.1:3000`。

## 3. 上传并导入镜像

把 `hanly-home-v3.tar.gz` 上传到服务器，例如：

```bash
/opt/hanly/hanly-home-v3.tar.gz
```

创建目录：

```bash
sudo mkdir -p /opt/hanly/uploads
sudo chown -R "$USER":"$USER" /opt/hanly
cd /opt/hanly
```

导入镜像：

```bash
gzip -dc hanly-home-v3.tar.gz | docker load
```

确认镜像存在：

```bash
docker images | grep hanly-home
```

应看到类似：

```text
hanly-home   v3   ...
```

## 4. 创建 .env

在 `/opt/hanly/.env` 创建生产环境变量：

```bash
cd /opt/hanly
vi .env
```

示例内容如下，正式上线请修改密码、域名和密钥：

```dotenv
# PostgreSQL
POSTGRES_USER=hanly_app
POSTGRES_PASSWORD=请替换为强密码
POSTGRES_DB=hanly

# 应用连接数据库。使用 docker compose 内置 postgres 服务时，主机名必须是 postgres。
DATABASE_URL=postgresql://hanly_app:请替换为强密码@postgres:5432/hanly?schema=public

# 站点访问地址。生产必须改成真实域名或公网 IP，多个来源用英文逗号分隔。
APP_ORIGIN=https://你的域名
NEXT_PUBLIC_SITE_URL=https://你的域名
NEXT_PUBLIC_API_BASE_URL=https://你的域名
NEXT_PUBLIC_API_URL=https://你的域名

# 后台登录会话密钥，必须至少 32 位。建议用 openssl rand -hex 32 生成。
USER_SESSION_SECRET=请替换为随机密钥
USER_SESSION_TTL_SECONDS=28800

# 上传文件持久化
UPLOAD_ROOT=/app/data/uploads
MEDIA_PUBLIC_PREFIX=/media
MAX_IMAGE_UPLOAD_BYTES=10485760
MAX_PDF_UPLOAD_BYTES=52428800
IMAGE_MAX_WIDTH=1920
IMAGE_MAX_INPUT_PIXELS=268000000
IMAGE_WEBP_QUALITY=82

# 可选：允许富文本引用的外部图片域名，多个用英文逗号分隔。
ALLOWED_EXTERNAL_IMAGE_HOSTS=

# 可选：联系表单安全与通知。不配置时，生产环境 Turnstile 校验会失败，应按实际业务补齐。
TURNSTILE_SECRET_KEY=
CONTACT_IP_HASH_SECRET=请替换为随机密钥
CONTACT_CUSTOMER_RECIPIENTS=
CONTACT_MEDIA_RECIPIENTS=
CONTACT_EVENT_RECIPIENTS=

# 可选：地图备案/数据来源展示
NEXT_PUBLIC_MAP_DATA_ATTRIBUTION=
NEXT_PUBLIC_MAP_APPROVAL_NUMBER=
```

生成随机密钥：

```bash
openssl rand -hex 32
```

注意：`POSTGRES_PASSWORD` 和 `DATABASE_URL` 中的密码必须完全一致。如果密码中包含 `@`、`#`、`/`、`:` 等特殊字符，`DATABASE_URL` 里需要 URL 编码。为减少出错，建议数据库密码只使用大小写字母、数字、点、下划线和中划线。

## 5. 创建 docker-compose.yml

在 `/opt/hanly/docker-compose.yml` 创建编排文件：

```yaml
services:
  app:
    image: hanly-home:v3
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "80:3000"
    volumes:
      - /opt/hanly/uploads:/app/data/uploads
    command: sh -c "npx prisma migrate deploy && npx prisma db seed && npm start"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "--timeout=5", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s

  postgres:
    image: postgres:16
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - hanly_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \"$${POSTGRES_USER}\" -d \"$${POSTGRES_DB}\""]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  hanly_postgres_data:
```

如果服务器有 Nginx 占用 80 端口，把 app 的 ports 改成：

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

然后 Nginx 反代到：

```text
http://127.0.0.1:3000
```

## 6. 启动服务

首次启动：

```bash
cd /opt/hanly
docker compose up -d
```

查看状态：

```bash
docker compose ps
```

查看应用日志：

```bash
docker compose logs -f app
```

应用容器每次启动会自动执行：

```bash
npx prisma migrate deploy
npx prisma db seed
npm start
```

其中 `prisma db seed` 会创建默认后台管理员：

```text
用户名：admin
初始密码：changeme123
```

上线后必须登录后台修改初始密码。

## 7. 验证上线

本机验证：

```bash
curl -I http://127.0.0.1/
curl http://127.0.0.1/api/health
```

健康接口正常返回：

```json
{"status":"ok"}
```

外部验证：

```text
http://服务器公网IP/
http://服务器公网IP/admin
```

如果配置了域名和 HTTPS：

```text
https://你的域名/
https://你的域名/admin
```

## 8. 服务器重启自动启动

本文档中的 compose 已配置：

```yaml
restart: unless-stopped
```

Docker 服务随系统启动后，容器会自动恢复。确认 Docker 自启动：

```bash
sudo systemctl enable docker
sudo systemctl is-enabled docker
```

重启演练：

```bash
sudo reboot
```

服务器回来后验证：

```bash
cd /opt/hanly
docker compose ps
curl http://127.0.0.1/api/health
```

## 9. 常用运维命令

查看容器：

```bash
docker compose ps
```

查看 app 最近日志：

```bash
docker compose logs --tail=200 app
```

查看数据库日志：

```bash
docker compose logs --tail=100 postgres
```

重启应用：

```bash
docker compose restart app
```

停止服务：

```bash
docker compose down
```

停止服务但保留数据库数据：

```bash
docker compose down
```

停止服务并删除数据库数据，谨慎使用：

```bash
docker compose down -v
```

## 10. 使用外部 PostgreSQL 的配置

如果数据库不由 compose 创建，而是使用外部 PostgreSQL，只保留 app 服务即可。

`.env` 中配置：

```dotenv
DATABASE_URL=postgresql://hanly_app:数据库密码@数据库地址:5432/hanly?schema=public
```

外部数据库需要提前创建：

```sql
CREATE USER hanly_app WITH PASSWORD '数据库密码';
CREATE DATABASE hanly OWNER hanly_app;
GRANT ALL PRIVILEGES ON DATABASE hanly TO hanly_app;
```

app-only compose 示例：

```yaml
services:
  app:
    image: hanly-home:v3
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "80:3000"
    volumes:
      - /opt/hanly/uploads:/app/data/uploads
    command: sh -c "npx prisma migrate deploy && npx prisma db seed && npm start"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "--timeout=5", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
```

## 11. Nginx 反代参考

如果由 Nginx 负责 80/443，app 只监听本机 `127.0.0.1:3000`。Nginx 示例：

```nginx
server {
    listen 80;
    server_name 你的域名;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用 HTTPS 后，`.env` 中的 `APP_ORIGIN`、`NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_API_BASE_URL`、`NEXT_PUBLIC_API_URL` 都应使用 `https://你的域名`。

## 12. 故障排查

端口被占用：

```bash
sudo ss -lntp | grep ':80'
```

如果 80 被 Nginx 占用，compose 改用：

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

数据库连接失败：

```bash
docker compose logs --tail=100 postgres
docker compose logs --tail=200 app
```

重点检查：

- `POSTGRES_PASSWORD` 和 `DATABASE_URL` 密码是否一致
- `DATABASE_URL` 主机名是否正确，compose 内置数据库必须使用 `postgres`
- PostgreSQL healthcheck 是否 healthy

后台无法登录：

- 确认 `USER_SESSION_SECRET` 已配置且长度至少 32 位
- 确认 `APP_ORIGIN` 与浏览器访问的协议、域名、端口一致
- 确认 seed 日志已执行成功
- 默认账号是 `admin`，默认密码是 `changeme123`

上传图片失败：

```bash
ls -ld /opt/hanly/uploads
docker compose exec app sh -c "test -w /app/data/uploads && echo writable"
```

如果不可写：

```bash
sudo chown -R 1001:1001 /opt/hanly/uploads
docker compose restart app
```

健康检查 unhealthy：

```bash
docker compose logs --tail=200 app
curl -v http://127.0.0.1/api/health
```

如果 `/api/health` 返回 `503`，通常是数据库连接或迁移失败。

## 13. 升级新镜像

收到新镜像包后：

```bash
cd /opt/hanly
gzip -dc hanly-home-v4.tar.gz | docker load
```

修改 `docker-compose.yml`：

```yaml
image: hanly-home:v4
```

重建应用容器：

```bash
docker compose up -d app
docker compose logs -f app
```

数据库数据在 Docker volume `hanly_postgres_data`，上传文件在 `/opt/hanly/uploads`，升级镜像不会删除这些数据。
