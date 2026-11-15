# KfuPet Web

KfuPet 的配套网站平台，承载 **社区交流** 与 **模型包分发** 两大核心业务，为 KfuPet 客户端提供在线资源与账号生态。

## 功能特性

- **社区**：帖子（发帖 / 列表 / 详情 / 删除）、评论、点赞（禁止自赞）、分类、标签、搜索与排序
- **模型包**：上传 / 列表 / 详情 / 下载 / 版本管理 / 审核状态流转 / 我的模型
- **账号**：注册 / 登录（JWT）、个人资料与头像上传，社区与模型板块账号互通
- **管理后台**：模型包审核、社区帖子管理（隐藏 / 置顶 / 精华 / 删除）、用户管理（角色调整 / 禁用与解禁）、举报处理
- **站点内容**：发帖规范、审核规则、帖子与模型包举报

## 技术栈

| 部分 | 技术 |
| --- | --- |
| 前端 | Vue 3 · TypeScript · Vite · Vue Router · Naive UI · Tailwind CSS（接口使用原生 fetch 封装） |
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
cp .env.example .env           # 填 DATABASE_URL / JWT_SECRET / POSTGRES_PASSWORD / SEED_*

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

> 没有 Docker 时，先安装 PostgreSQL 16 并创建空库 `kfupet`，把连接串写入根目录 `.env` 的 `DATABASE_URL`，然后同样执行 `npx prisma generate`、`npm run prisma:deploy`、`npm run prisma:seed`。

启动后可自检：

```bash
curl http://localhost:3000/api/health   # 返回 {"status":"ok",...}
curl -I http://localhost:5173/          # 返回 HTTP 200
```

停止服务：在对应终端按 `Ctrl+C`；数据库用 `docker compose stop postgres`，全部容器用 `docker compose down`（加 `-v` 会同时删除数据卷，谨慎使用）。

### 服务器部署

```bash
cp .env.example .env
# 务必修改 POSTGRES_PASSWORD / JWT_SECRET / SEED_ADMIN_PASSWORD / SEED_USER_PASSWORD；首次部署可保持 SEED_ON_START=true
docker compose up -d --build
docker compose ps
```

后端容器启动时会先执行 `prisma migrate deploy`；`SEED_ON_START=true` 时再执行一次幂等种子脚本。访问 `http://<服务器IP>/` 即可。

## 使用说明

### 第一次使用（5 分钟上手）

| 步骤 | 操作 |
| --- | --- |
| 1 | 打开 `http://localhost:5173`（或局域网地址），首页可浏览推荐帖子、模型包、更新日志与客户端下载 |
| 2 | 点右上「注册」创建账号（用户名 3-24 位字母 / 数字 / 下划线 / 连字符，密码至少 8 位），注册成功后自动登录 |
| 3 | 进入「社区」→「发布帖子」，选择分类并填写标题、正文，提交后立即可见 |
| 4 | 进入「模型包」→「上传模型包」，填写信息并选择 `.kfupet` 文件，提交后进入待审核 |
| 5 | 管理员进入「管理后台 → 模型审核」通过后，模型包才会出现在公开列表并开放下载 |

### 页面导航

- **顶部导航**：首页 / 社区 / 模型包 / 更新 / 客户端；窄屏会自动收起导航，可通过页脚链接进入相应页面。
- **客户端下载**（`/download`）：提供 GitHub 官方、GitCode 镜像、Gitee 镜像三个下载源，任选其一获取 Windows 安装包。
- **更新与公告**：首页「最近更新的模型包 → 查看全部」进入更新日志页（`/updates`）；点击「站点公告」条目进入公告详情（`/notices/:id`），可查看正文与其他公告。
- **右上角（未登录）**：登录、注册、下载客户端。
- **右上角（已登录）**：点击头像打开菜单 —— 个人信息、发布帖子、上传模型包、我的模型、管理后台（仅管理员可见）、退出登录。
- **页脚**：发帖规范、审核规则与相关文档入口。

### 访问地址

| 场景 | 地址 |
| --- | --- |
| 本机访问 | `http://localhost:5173` |
| 局域网其他设备 | `http://<本机局域网IP>:5173` |
| 后端 API | `http://localhost:3000/api`（前端已代理，浏览器中一般无需直接访问） |

Vite 开发服务器监听 `0.0.0.0`，同一 Wi-Fi 下的手机、平板可直接通过局域网 IP 访问。若打不开，请检查设备是否在同一网段、系统防火墙是否允许 Node.js 入站；IP 变化后可用 `ipconfig` 重新确认。

### 演示账号

| 角色 | 用户名 | 密码 | 可用功能 |
| --- | --- | --- | --- |
| 管理员 | `admin` | 见 `.env` 的 `SEED_ADMIN_PASSWORD` | 全部功能 + 模型包审核 |
| 普通用户 | `luye` | 见 `.env` 的 `SEED_USER_PASSWORD` | 发帖、评论、点赞、上传模型、维护个人信息 |
| 其他演示用户 | `quansi`、`shiguang`、`qinghe`、`nuonuo`、`pix_studio`、`alan`、`kafu`、`baize`、`neo`、`zhenzi`、`xiaoman` | 同 `SEED_USER_PASSWORD` | 同普通用户 |

> 种子脚本不再内置默认密码：首次执行前必须在 `.env` 中设置 `SEED_ADMIN_PASSWORD` 与 `SEED_USER_PASSWORD`（至少 8 位）。种子只会创建缺失账号，不会覆盖已有账号的密码。

### 社区操作

1. **发布帖子**：`社区` → 右上「发布帖子」。标题 3-120 个字符，正文 1-20000 个字符，分类必选；标签用逗号分隔，最多 6 个，每个不超过 24 个字符。
2. **浏览与筛选**：社区列表支持关键词搜索（标题与正文）、最新 / 热门排序、分类筛选与分页。
3. **帖子详情**：展示作者、发布时间、浏览量、评论数与正文；登录后可在底部发表评论，作者或管理员可删除评论。
4. **点赞**：详情页心形按钮，点击点赞、再次点击取消；不能给自己的帖子点赞（按钮位置会显示提示）。
5. **删除帖子**：作者或管理员在详情页点「删除帖子」，删除后不可恢复。
6. **举报**：详情页点赞区右侧「举报」，流程见下方「举报与内容处置」。
7. **规则**：页脚「发帖规范」「审核规则」提供完整规则，发帖前建议先阅读。

### 模型包操作

1. **上传模型包**：登录后进入 `模型包` → 「上传模型包」。
   - 必填：名称（2-80 字）、简介（2-200 字）、详细说明（1-20000 字）、分类、版本号（`1.0.0` 或 `v1.0.0`）、更新日志（1-5000 字）、`.kfupet` 文件；
   - 可选：标签（逗号分隔）、封面（PNG / JPG / WebP / SVG）、最低客户端版本（最多 32 字）；
   - 限制：模型包文件后缀必须为 `.kfupet`，单个文件不超过 256 MB（由 `.env` 的 `UPLOAD_MAX_SIZE` 控制）。
2. **审核状态**：提交后为「待审核」，不会出现在公开列表；管理员「通过并发布」后出现在模型列表、首页推荐与搜索中并开放下载；被「拒绝」后可在「我的模型」查看原因并修改后重新提交；违规内容会被「下架」，公开页面与下载入口同步关闭。
3. **我的模型**：头像菜单 →「我的模型」（`/me/models`），查看全部提交记录、审核状态与历史版本。
4. **发布新版本**：已发布模型详情页 →「上传新版本」。版本号必须递增且不能重复，更新日志必填；发布后立即替换公开下载入口，旧版本保留在版本历史中。
5. **下载**：模型详情页「下载 vX.Y.Z」按钮，或版本历史中对应版本的「下载」。
6. **审核后台**：管理员头像菜单 →「管理后台 → 模型审核」，按「待审核 / 审核中 / 已发布 / 已拒绝 / 已下架 / 全部」筛选，执行「通过并发布」「拒绝」「下架」「重新发布」。

### 举报与内容处置

- **入口**：帖子详情页点赞区右侧、模型包详情页操作区的「举报」按钮；未登录会先跳转登录并回到原页面。
- **填写**：选择违规类型（广告引流、人身攻击、侵权盗版、色情或暴力、违法内容、其他），并补充至少 10 个字的说明。
- **限制**：不能举报自己发布的内容；同一内容处于「待处理 / 处理中」时不能重复举报。
- **管理员处理**：在「管理后台 → 举报处理」点「开始处理」后判定是否违规。
  - 判定违规：帖子立即隐藏、模型包立即下架，举报状态变为「已处理」；
  - 判定无违规：举报状态变为「已驳回」，内容保持不变；
  - 已处理 / 已驳回的举报可「重新打开」后再次判定。
- 违规内容在公开页面无法访问，但管理员仍可在「社区管理」或「模型审核」中查看并恢复。

### 管理后台

入口：管理员头像菜单 →「管理后台」，页面顶部可在四个标签间切换。

1. **模型审核**（`/admin/models`）：按状态筛选提交记录，查看作者、文件大小与版本信息后执行「通过并发布」「拒绝」「下架」「重新发布」。下架后公开页面与下载立即失效，重新发布即可恢复。
2. **社区管理**（`/admin/posts`）：搜索帖子，按全部 / 已隐藏 / 已置顶 / 精华筛选；可隐藏、置顶、设为精华或删除帖子。隐藏后帖子从公开列表与详情页移除，置顶与精华会影响列表排序与标记。
3. **用户管理**（`/admin/users`）：按关键词、角色、状态搜索，查看用户发帖 / 评论 / 模型数量；可调整管理员权限、禁用或解禁账号。禁用后该账号无法登录，已签发的 Token 也会立即失效；不能修改自己的角色或禁用自己。
4. **举报处理**（`/admin/reports`）：按待处理 / 处理中 / 已处理 / 已驳回筛选；「开始处理」进入处理中后判定是否违规：判定违规会直接隐藏帖子或下架模型包，判定无违规则驳回举报，已处理的记录可重新打开。列表中的标题可跳转到原内容，已不可访问的内容会标注「（不可访问）」。

### 个人信息

- 入口：头像菜单 →「个人信息」（`/me/profile`）。
- 可修改昵称、个人简介和头像；头像支持 JPG / PNG / WebP，最大 5 MB，选择本地文件后会立即预览，保存后生效。
- 页面同时展示发帖数、模型数、累计下载与最近发布内容，可点击跳转到对应帖子或模型。
- 保存后，社区帖子、评论与模型包列表中的作者头像会同步更新。

### 权限对照

| 操作 | 游客 | 登录用户 | 管理员 |
| --- | --- | --- | --- |
| 浏览社区 / 模型包 | ✓ | ✓ | ✓ |
| 发帖 / 评论 / 点赞 | ✗（跳转登录） | ✓（不能自赞） | ✓ |
| 上传模型包 / 管理版本 | ✗ | ✓ | ✓ |
| 删除自己的帖子 / 评论 | ✗ | ✓ | ✓ |
| 删除任意帖子 / 评论 | ✗ | ✗ | ✓ |
| 隐藏 / 置顶 / 精华帖子 | ✗ | ✗ | ✓ |
| 调整用户角色 / 禁用账号 | ✗ | ✗ | ✓ |
| 举报帖子 / 模型包 | ✗ | ✓（不能举报自己的内容） | ✓ |
| 处理举报 | ✗ | ✗ | ✓ |
| 模型包审核 / 下架 | ✗ | ✗ | ✓ |

### 常见问题

| 问题 | 处理方式 |
| --- | --- |
| 登录提示用户名或密码错误 | 演示账号密码由 `.env` 的 `SEED_*` 决定；忘记密码可重新设置后执行种子脚本，或直接注册新账号 |
| 登录提示账号已被禁用 | 联系管理员在「用户管理」中解禁；禁用状态对所有已登录设备立即生效 |
| 模型包上传失败 | 确认文件后缀为 `.kfupet`，版本号符合 `1.0.0` / `v1.0.0`，更新日志已填写，文件不超过 256 MB |
| 上传后在列表看不到 | 新模型处于「待审核」，需管理员在审核后台通过 |
| 提示「你已举报过该内容」 | 同一内容存在待处理或处理中的举报，等管理员处理完或驳回后可再次举报 |
| 举报后内容消失了 | 管理员判定违规会自动隐藏帖子或下架模型；如属误判，管理员可在对应后台页恢复 |
| 点赞没有反应 | 未登录会跳转登录页；自己的帖子不能点赞 |
| 头像没有更新 | 保存后刷新页面；确认图片为 JPG / PNG / WebP 且不超过 5 MB |
| 局域网设备打不开 | 确认同一网段；允许 Node.js 通过防火墙（专用网络）；IP 变化后用 `ipconfig` 重新确认 |
| 端口被占用 | 前端 5173 / 后端 3000 / 数据库 5432，关闭占用进程或修改配置 |
| 后端启动报数据库连接失败 | 确认 PostgreSQL 已启动、`DATABASE_URL` 正确，并已执行 `npm run prisma:deploy` |
| 重置演示数据 | 后端执行 `npm run prisma:seed` 可幂等补数据；`npx prisma migrate reset` 会清空数据库，谨慎使用 |
| 如何停止服务 | 终端 `Ctrl+C`；Docker 用 `docker compose stop`（`down` 会移除容器） |

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
| `SEED_ADMIN_PASSWORD` | 管理员初始密码，**必填**（至少 8 位），无默认值 |
| `SEED_USER_PASSWORD` | 演示用户初始密码，**必填**（至少 8 位），无默认值 |
| `HTTP_PORT` | Nginx 对外端口，默认 80 |

前端可选变量放在 `frontend/.env.local`（已被忽略）——当前无必需的前端环境变量。

种子账号：管理员 `admin`，普通演示账号 `luye` / `quansi` / `shiguang` 等，密码由 `.env` 的 `SEED_*` 变量在首次种子时写入。种子仅在数据为空时写入帖子与模型包，可重复执行。

## API 概览

所有接口统一前缀 `/api`，需要登录的接口通过 `Authorization: Bearer <accessToken>` 传 Token。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康检查（含数据库连通性） |
| `GET` | `/api/home` | 首页聚合：统计、帖子、模型包、更新、公告 |
| `GET` | `/api/notices` | 站点公告列表（含正文） |
| `GET` | `/api/notices/:id` | 站点公告详情 |
| `POST` | `/api/auth/register` | 注册 |
| `POST` | `/api/auth/login` | 登录，返回 JWT |
| `GET` | `/api/auth/me` | 当前登录用户 |
| `GET` | `/api/users/me` | 当前用户完整资料 |
| `GET` | `/api/users/:id` | 用户 / 作者公开主页 |
| `PATCH` | `/api/users/me` | 修改昵称、简介等个人资料 |
| `POST` | `/api/users/me/avatar` | 上传头像（multipart：`avatar`，JPG / PNG / WebP） |
| `GET` | `/api/community/posts` | 帖子列表（`sort`、`category`、`tag`、`q`、分页） |
| `GET` | `/api/community/posts/:id` | 帖子详情（登录时返回 `liked`） |
| `POST` | `/api/community/posts` | 发帖 |
| `PATCH` / `DELETE` | `/api/community/posts/:id` | 编辑 / 删除自己的帖子 |
| `POST` | `/api/community/posts/:id/like` | 点赞 / 取消点赞（不能给自己点赞） |
| `GET` / `POST` | `/api/community/posts/:id/comments` | 评论列表 / 发表评论 |
| `DELETE` | `/api/community/comments/:id` | 删除自己的评论 |
| `GET` | `/api/models` | 模型包列表（`sort=latest\|hot\|updated`、`q`、`category`） |
| `GET` | `/api/models/updates` | 模型包版本更新日志（`limit`，最多 100 条） |
| `GET` | `/api/models/mine` | 我提交的模型包（含待审核，需登录） |
| `GET` | `/api/models/:id` | 模型包详情 |
| `GET` | `/api/models/:id/versions` | 版本列表 |
| `GET` | `/api/models/:id/versions/:versionId/download` | 下载模型包 |
| `POST` | `/api/models` | 上传模型包（multipart：`package`、`cover` + 元数据） |
| `POST` | `/api/models/:id/versions` | 上传新版本 |
| `GET` / `PATCH` | `/api/admin/models`、`/api/admin/models/:id/status` | 管理员审核模型包 |
| `GET` | `/api/admin/posts` | 管理员帖子列表（`filter=all\|hidden\|pinned\|featured`、`q`、分页） |
| `PATCH` | `/api/admin/posts/:id` | 管理员设置隐藏 / 置顶 / 精华（`isHidden`、`isPinned`、`isFeatured`） |
| `GET` | `/api/admin/users` | 管理员用户列表（`q`、`role`、`status`、分页） |
| `PATCH` | `/api/admin/users/:id` | 管理员调整角色或禁用账号（`role`、`isBanned`） |
| `POST` | `/api/reports` | 举报帖子或模型包（`targetType`、`targetId`、`reason`、`detail`） |
| `GET` | `/api/admin/reports` | 管理员举报列表（`status`、分页） |
| `PATCH` | `/api/admin/reports/:id` | 管理员更新举报状态（`status`） |
| `POST` | `/api/admin/reports/:id/verdict` | 管理员判定是否违规（`violation`）：违规自动隐藏帖子 / 下架模型包 |

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
