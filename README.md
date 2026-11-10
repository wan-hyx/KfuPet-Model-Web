# KfuPet Web

KfuPet 的配套网站平台，承载 **社区交流** 与 **模型包分发** 两大核心业务，为 KfuPet 客户端提供在线资源与账号生态。

## 功能特性

- **社区**：帖子（发帖 / 列表 / 详情 / 编辑 / 删除）、评论（含回复）、分类、标签
- **模型包**：上传 / 列表 / 详情 / 下载 / 版本管理、分类、审核状态流转
- **账号**：注册 / 登录（JWT）、个人资料，社区与模型板块账号互通
- **管理后台**：用户管理、帖子管理、模型包审核

## 技术栈

| 部分 | 技术 |
| --- | --- |
| 前端 | Vue 3 · TypeScript · Vite · Naive UI · Tailwind CSS · Axios |
| 后端 | NestJS · TypeScript · Prisma · JWT (Passport) |
| 数据库 | PostgreSQL 16 |
| 文件存储 | 本地磁盘，经 `storage` 抽象层访问（后续可换 MinIO / OSS / R2） |
| 反向代理 | Nginx（TLS · 静态文件 · `/api` 反代 · `X-Accel-Redirect` 大文件直出） |
| 部署 | 单台服务器 · Docker Compose；宝塔面板仅用于运维（防火墙 / 监控 / 计划任务） |

## 目录结构

```text
KfuPet-Model-Web/
├── backend/                    # NestJS 后端（prisma/、uploads/）
├── frontend/                   # Vue 3 前端
├── deploy/
│   └── nginx/                  # Nginx 配置 + 镜像（多阶段构建前端产物）
├── docs/                       # 功能规格、架构
├── docker-compose.yml          # postgres + backend + nginx
├── .env.example                # 环境变量模板
├── LICENSE
└── README.md
```

## 快速开始

### 本地开发

```bash
cp .env.example .env           # 填 DATABASE_URL / JWT_SECRET / POSTGRES_PASSWORD

docker compose up -d postgres  # 只起数据库

cd backend
npm install
npx prisma generate
npm run prisma:deploy          # 从根目录 .env 读取 DATABASE_URL
npm run prisma:seed            # 首次运行时写入分类、演示帖子与模型包
npm run start:dev              # http://localhost:3000，接口前缀 /api

cd ../frontend
npm install
npm run dev                    # http://localhost:5173，/api 与 /media 代理到 3000
```

### 服务器部署

```bash
cp .env.example .env
# 务必修改 POSTGRES_PASSWORD / JWT_SECRET；首次部署可保持 SEED_ON_START=true
docker compose up -d --build
docker compose ps
```

后端容器启动时会先执行 `prisma migrate deploy`；`SEED_ON_START=true` 时再执行一次幂等种子脚本。访问 `http://<服务器IP>/` 即可。

## 环境变量

只有一份 `.env`（根级），模板见 `.env.example`。由 Docker Compose 注入后端；本地直跑时后端通过 `@nestjs/config` 同时查找 `backend/.env` 与根目录 `.env`。

| 变量 | 说明 |
| --- | --- |
| `POSTGRES_PASSWORD` | 数据库密码（Compose 使用） |
| `POSTGRES_PORT` | 仅绑定到 `127.0.0.1` 的数据库端口，供本地后端连接，默认 5432 |
| `DATABASE_URL` | PostgreSQL 连接串（Compose 会覆盖为容器内地址） |
| `JWT_SECRET` | JWT 签名密钥，**生产环境务必更换** |
| `JWT_EXPIRES_IN` | Token 有效期，默认 `7d` |
| `PORT` | 后端监听端口（默认 3000） |
| `CORS_ORIGIN` | 允许的前端来源，多个用逗号分隔 |
| `STORAGE_DRIVER` | 存储驱动，默认 `local` |
| `UPLOAD_DIR` | 上传根目录（Compose 内为 `/app/uploads`） |
| `UPLOAD_MAX_SIZE` | 单文件上传上限（MB） |
| `DOWNLOAD_MODE` | `direct`（本地直发）或 `nginx`（`X-Accel-Redirect`） |
| `SEED_ON_START` | 容器启动时是否执行种子脚本 |
| `SEED_ADMIN_PASSWORD` | 种子管理员密码，默认 `admin1234`，**部署前修改** |
| `SEED_USER_PASSWORD` | 种子演示账号密码，默认 `demo1234` |
| `HTTP_PORT` | Nginx 对外端口，默认 80 |

种子账号：管理员 `admin`，普通演示账号 `luye` / `quansi` / `shiguang` 等，密码见上。种子仅在数据为空时写入帖子与模型包，可重复执行。

## API 概览

所有接口统一前缀 `/api`，需要登录的接口通过 `Authorization: Bearer <accessToken>` 传 Token。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康检查（含数据库连通性） |
| `GET` | `/api/home` | 首页聚合：统计、帖子、模型包、更新、公告 |
| `POST` | `/api/auth/register` | 注册 |
| `POST` | `/api/auth/login` | 登录，返回 JWT |
| `GET` | `/api/auth/me` | 当前登录用户 |
| `GET` | `/api/users/:id` | 用户 / 作者公开主页 |
| `PATCH` | `/api/users/me` | 修改个人资料 |
| `GET` | `/api/community/posts` | 帖子列表（`sort`、`category`、`tag`、`q`、分页） |
| `GET` | `/api/community/posts/:id` | 帖子详情 |
| `POST` | `/api/community/posts` | 发帖 |
| `PATCH` / `DELETE` | `/api/community/posts/:id` | 编辑 / 删除自己的帖子 |
| `GET` / `POST` | `/api/community/posts/:id/comments` | 评论列表 / 发表评论 |
| `DELETE` | `/api/community/comments/:id` | 删除自己的评论 |
| `GET` | `/api/models` | 模型包列表（`sort=latest\|hot\|updated`、`q`、`category`） |
| `GET` | `/api/models/:id` | 模型包详情 |
| `GET` | `/api/models/:id/versions` | 版本列表 |
| `GET` | `/api/models/:id/versions/:versionId/download` | 下载模型包 |
| `POST` | `/api/models` | 上传模型包（multipart：`package`、`cover` + 元数据） |
| `POST` | `/api/models/:id/versions` | 上传新版本 |
| `GET` / `PATCH` | `/api/admin/models`、`/api/admin/models/:id/status` | 管理员审核模型包 |

模型包上传字段：`name`、`summary`、`description`、`categorySlug`、`tags`（逗号分隔）、`version`、`changelog`、`minClientVersion`，文件字段 `package`（`.kfupet`）与可选 `cover`。

## 常用命令

**后端（backend）**

| 命令 | 说明 |
| --- | --- |
| `npm run start:dev` | 开发模式（热重载） |
| `npm run build` | 编译 |
| `npm run start:prod` | 生产模式 |
| `npx prisma generate` | 生成 Prisma Client |
| `npx prisma migrate dev` | 开发迁移 |
| `npm run prisma:deploy` | 应用已有迁移（生产） |
| `npm run prisma:seed` | 写入种子数据（幂等） |
| `npm run typecheck` | TypeScript 类型检查 |
| `npx prisma studio` | 打开 Prisma Studio |

**前端（frontend）**

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建产物 |

**Docker**

| 命令 | 说明 |
| --- | --- |
| `docker compose up -d` | 启动全部服务 |
| `docker compose ps` | 查看容器状态 |
| `docker compose logs -f backend` | 跟踪后端日志 |

## 开发阶段

| 阶段 | 内容 |
| --- | --- |
| P0 | 骨架跑通：Docker Compose + PostgreSQL + NestJS + Nginx + Vue |
| P1 | 账号（注册 / 登录 / JWT）+ 社区（帖子 / 评论 / 分类 / 标签） |
| P2 | 模型包（上传 / 审核 / 下载）+ `storage` 抽象层 + `X-Accel-Redirect` |
| P3 | 分发：`manifest.json` 的 `sha256` 校验 + Go 镜像节点 agent + 调度 |
| P4 | 贡献激励：排行 / 徽章 / 贡献值 |

## 相关文档

- [功能规格说明](docs/KfuPet_Website_Function_Specification.md)
- [架构说明](docs/架构.md)
