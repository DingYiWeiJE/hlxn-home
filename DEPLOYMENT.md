# 部署说明

本项目已切换为 Next.js Node.js standalone 运行模式，不再使用 `out` 作为生产网站产物。

完整部署、服务器初始化、PM2、Nginx、PostgreSQL migration、回滚、备份和恢复步骤见 `README.md`。

关键生产约定：

- 发布目录：`/var/www/hanly/releases/*`
- 当前版本：`/var/www/hanly/current`
- 生产环境变量：`/etc/hanly/hanly.env`
- 上传图片：`/var/lib/hanly/uploads`
- PM2 单实例：`ecosystem.config.cjs`
- 数据库迁移：`./node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma`
