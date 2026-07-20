# 部署指南

本项目已从 GitHub Pages 静态站点迁移为全栈 Next.js 应用。本文档说明如何在自己的服务器上部署和运行该项目。

## 前置要求

- Node.js 20 或更高版本
- npm 或 pnpm
- PM2（进程管理）
- Nginx（反向代理）
- SSL 证书（可选但推荐）

## 本地开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 `http://localhost:3000` 开发预览。

### 构建生产版本

```bash
npm run build
```

## 服务器部署

### 1. 上传项目文件

将项目上传到服务器，例如：

```bash
scp -r /path/to/hlxn-home user@server:/home/user/apps/hlxn-home
```

### 2. 安装依赖

在服务器上执行：

```bash
cd /home/user/apps/hlxn-home
npm install
```

### 3. 构建应用

```bash
npm run build
```

### 4. 使用 PM2 启动应用

#### 安装 PM2（如果未安装）

```bash
npm install -g pm2
```

#### 启动应用

```bash
# 方式一：直接启动
pm2 start npm --name "hlxn-home" -- start

# 方式二：使用 ecosystem 配置文件（推荐）
pm2 start ecosystem.config.js
```

#### 查看应用状态

```bash
pm2 status
pm2 logs hlxn-home
```

#### 设置开机自启

```bash
pm2 startup
pm2 save
```

#### 重启/停止/删除应用

```bash
pm2 restart hlxn-home
pm2 stop hlxn-home
pm2 delete hlxn-home
```

### 5. 配置 Nginx 反向代理

编辑 Nginx 配置文件（通常位于 `/etc/nginx/sites-available/default` 或创建新配置文件）：

```nginx
# HTTP 配置 - 自动重定向到 HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 反向代理配置
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态资源缓存（可选）
    location /_next/static {
        proxy_pass http://localhost:3000/_next/static;
        proxy_cache_valid 365d;
        proxy_cache_bypass $http_upgrade;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

#### 测试 Nginx 配置

```bash
sudo nginx -t
```

#### 重新加载 Nginx

```bash
sudo systemctl reload nginx
# 或
sudo service nginx reload
```

### 6. SSL 证书配置

#### 使用 Let's Encrypt（免费）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 申请证书
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

#### 手动配置 SSL 证书

如果已有证书文件，在 Nginx 配置中指定证书路径：

```nginx
ssl_certificate /path/to/certificate.crt;
ssl_certificate_key /path/to/private.key;
```

## API 路由

### 联系表单 API

**端点**：`POST /api/contact`

**请求体**：

```json
{
  "name": "Your Name",
  "email": "your@email.com",
  "message": "Your message"
}
```

**响应（成功）**：

```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**响应（错误）**：

```json
{
  "error": "Missing required fields"
}
```

**错误状态码**：
- `400` - 验证失败（缺少字段、格式错误等）
- `500` - 服务器错误

## 监控和日志

### 查看 PM2 日志

```bash
# 查看实时日志
pm2 logs hlxn-home

# 查看特定行数的日志
pm2 logs hlxn-home --lines 100
```

### PM2 日志位置

默认日志存储在 `~/.pm2/logs/` 目录。

### Nginx 日志

```bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
```

## 性能优化

### 1. 启用 Gzip 压缩

在 Nginx 配置中添加：

```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json application/javascript;
gzip_min_length 1000;
```

### 2. 配置缓存策略

在 Nginx 配置中为静态资源添加缓存头（见上面的 SSL 配置示例）。

### 3. 监控内存使用

```bash
# 查看 PM2 内存使用
pm2 monit

# 设置最大内存限制（防止内存溢出）
pm2 start npm --name "hlxn-home" --max-memory-restart 500M -- start
```

## 常见问题

### Q: 应用无法启动
**A**: 检查日志：`pm2 logs hlxn-home`，确保 Node.js 版本正确且依赖已安装。

### Q: 访问超时
**A**: 检查防火墙设置和 Nginx 反向代理配置，确保 3000 端口开放。

### Q: SSL 证书过期
**A**: 使用 Let's Encrypt 自动续期，或手动更新证书路径。

### Q: 表单提交失败
**A**: 查看 PM2 日志和浏览器控制台，检查 API 响应和网络错误。

## 更新部署

当需要更新应用时：

```bash
# 1. 拉取最新代码
cd /home/user/apps/hlxn-home
git pull origin main

# 2. 重新构建
npm run build

# 3. 重启应用
pm2 restart hlxn-home
```

## 卸载和清理

如需完全删除应用：

```bash
# 停止应用
pm2 stop hlxn-home
pm2 delete hlxn-home

# 删除项目文件
rm -rf /home/user/apps/hlxn-home

# 删除 Nginx 配置
rm /etc/nginx/sites-available/hlxn-home
sudo systemctl reload nginx
```

## 技术栈

- **框架**: Next.js 16.2.10
- **运行时**: Node.js
- **样式**: Tailwind CSS
- **国际化**: next-intl
- **进程管理**: PM2
- **Web 服务器**: Nginx

## 支持

如有问题，请检查：
1. 应用日志：`pm2 logs hlxn-home`
2. Nginx 日志：`/var/log/nginx/error.log`
3. 系统日志：`journalctl -xe`
