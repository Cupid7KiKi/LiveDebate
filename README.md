# Live 直播辩论平台

一个支持多直播流管理的实时辩论互动平台，包含 H5 小程序端、后台管理系统、Node.js 中间层网关和 Go 后端 API。用户可以观看直播、参与投票、查看 AI 实时语音识别内容并评论互动；管理员可以控制直播流、管理辩题、查看数据统计。整体采用网关层统一入口的架构，由 live-gateway 承担请求路由、CORS 统一处理和静态资源托管的职责。

## 演示地址

| 服务 | 地址 |
|------|------|
| H5 小程序端 | http://1.15.95.154:8081 |
| 后台管理系统 | http://1.15.95.154:8082/admin/ |
| 后端 API | http://1.15.95.154:8000 |

## 技术栈说明

### 后端框架
- **语言**: Go 1.22+
- **HTTP框架**: Gin
- **ORM**: GORM
- **数据库**: SQLite
- **认证**: golang-jwt (JWT HS256, 72小时过期)
- **端口**: 8000

### 中间层网关 (live-gateway)
- **运行时**: Node.js + Express 4.x
- **职责**: 替代 Nginx 作为统一入口，负责请求路由转发、CORS 统一处理、直播日程定时调度、Mock 数据模拟、管理端静态资源托管
- **端口**: 8090

### 前端
- **H5小程序端**: UniApp + Vue3 (HBuilderX 打包)
- **后台管理系统**: 原生 HTML/CSS/JS + Express 中间层

### Mock 数据生成方案
采用**代码内置模拟**方式，在 Go 后端 `database/database.go` 的 `seedMockData()` 函数中，首次启动时自动检测数据库是否为空，若为空则注入完整的模拟数据：
- 9 个用户（1 管理员 + 8 普通用户），使用 DiceBear API 生成头像
- 3 个直播流，各自关联独立的辩题、投票、AI 内容
- 3 个辩题（AI取代工作 / 基因编辑 / 高考存废）
- 105 条投票记录 + 3 个投票汇总（自动计算百分比）
- 13 条 AI 语音识别/分析内容
- 16 条评论 + 60 个点赞
- 所有数据通过 UUID 关联，时间戳按天/小时错开模拟真实场景

### 部署平台与方式
- **服务器**: 腾讯云 Ubuntu 24.04 (x86_64)
- **进程管理**: pm2（已配置开机自启）
- **部署方式**: rsync 本地同步 + 服务器编译

## 项目结构

```
test/
├── backend/                   # Go 后端
│   ├── main.go                # Gin 引擎、CORS、路由注册、静态文件
│   ├── go.mod
│   ├── config/
│   │   └── config.go          # JWT/微信常量配置
│   ├── database/
│   │   └── database.go        # GORM 初始化 + AutoMigrate + Mock 数据注入
│   ├── models/
│   │   ├── user.go            # 用户模型
│   │   ├── stream.go          # 直播流模型
│   │   ├── debate.go          # 辩题模型
│   │   ├── vote.go            # 投票 + 投票汇总模型
│   │   ├── ai_content.go      # AI内容 + 评论 + 点赞模型
│   │   └── statistics.go      # 统计模型
│   ├── handlers/
│   │   ├── auth.go            # 微信登录 (1 路由)
│   │   ├── votes.go           # 投票系统 (12 路由)
│   │   ├── debate.go          # 辩题管理 (8 路由)
│   │   ├── ai_content.go      # AI内容 (10 路由)
│   │   ├── comments.go        # 评论+点赞 (6 路由)
│   │   ├── streams.go         # 直播流+辩题关联 (13 路由)
│   │   ├── live.go            # 直播控制+AI控制+观看人数 (16 路由)
│   │   ├── dashboard.go       # Dashboard+统计 (4 路由)
│   │   ├── users.go           # 用户管理 (3 路由)
│   │   └── debate_flow.go     # 辩论流程+评委 (5 路由)
│   └── services/
│       ├── vote_service.go    # 投票逻辑
│       └── stream_resolver.go # stream_id 自动解析
├── live-gateway/              # Node.js 中间层网关（替代 Nginx）
│   ├── gateway.js             # 网关主入口，Express 服务
│   ├── package.json           # 依赖：express, ws, cors, uuid
│   ├── config/
│   │   └── server-mode.node.js # 运行模式配置（Mock/Real 切换）
│   └── admin/
│       ├── index.html         # 管理端入口页（网关托管）
│       └── db.js              # 文件型数据存储模块
├── froneted/                  # 前端项目
│   ├── server.js              # Express 中间层 (管理端)
│   ├── admin/                 # 后台管理系统 (HTML/JS)
│   ├── pages/                 # UniApp 页面源码
│   ├── config/                # 服务器地址配置
│   └── static/                # 静态资源
└── README.md
```

## 系统架构

```
                         客户端（H5 小程序 / 管理后台）
                                    |
                                    v
                      ┌─────────────────────────────┐
                      │    live-gateway (port 8090)  │
                      │   Node.js + Express           │
                      │                              │
                      │  - 统一入口 & 请求路由        │
                      │  - CORS 统一处理             │
                      │  - 直播日程定时调度           │
                      │  - Mock 模式数据模拟          │
                      │  - 管理端静态资源托管         │
                      └──────────┬──────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    v                         v
          ┌─────────────────┐     ┌──────────────────┐
          │  Go 后端 (8000)  │     │ 管理端静态资源     │
          │  Gin + GORM     │     │ (网关直接托管)     │
          │  SQLite         │     └──────────────────┘
          │  业务逻辑 & 持久化│
          └─────────────────┘
```

**请求流转**: 客户端所有请求统一发往网关层 (8090)，网关根据路径前缀进行路由分发：`/api/` 请求转发至 Go 后端处理业务逻辑和数据持久化；`/admin/` 请求由网关直接提供管理端静态资源。

### 网关层核心能力

| 能力 | 说明 |
|------|------|
| 请求路由 | 替代 Nginx，按路径前缀将请求分发至 Go 后端或本地静态资源 |
| CORS 处理 | 在网关层统一配置跨域策略，后端无需重复处理 |
| 直播日程调度 | 每 60 秒轮询日程配置，自动触发直播开始/停止 |
| Mock 数据模拟 | 开发阶段可切换至 Mock 模式，每 3 秒模拟投票变化、每 15 秒生成 AI 内容 |
| 静态资源托管 | 直接托管管理后台的 HTML/JS/CSS，减少部署复杂度 |

## 接口说明

### 认证

| 功能 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 微信登录 | POST | `/api/wechat-login` | 传入 code + userInfo，返回 JWT token 和用户信息 |

### 直播流管理

| 功能 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取所有直播流 | GET | `/api/v1/admin/streams` | 返回直播流列表，含播放地址和直播状态 |
| 创建直播流 | POST | `/api/v1/admin/streams` | 创建新的直播流配置 |
| 获取单个直播流 | GET | `/api/admin/streams/:stream_id` | 返回指定直播流详情 |
| 更新直播流 | PUT | `/api/admin/streams/:stream_id` | 更新直播流配置 |
| 删除直播流 | DELETE | `/api/admin/streams/:stream_id` | 删除指定直播流 |
| 切换启用状态 | POST | `/api/admin/streams/:stream_id/toggle` | 切换直播流启用/禁用 |

### 直播控制

| 功能 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取直播状态 | GET | `/api/v1/admin/live/status` | 返回当前直播状态、流地址、日程 |
| 开始直播 | POST | `/api/v1/admin/live/start` | 传入 streamId，开始指定流的直播 |
| 停止直播 | POST | `/api/v1/admin/live/stop` | 停止当前直播 |
| 通用直播控制 | POST | `/api/admin/live/control` | action: start/stop |
| 获取 RTMP 地址 | GET | `/api/admin/rtmp/urls` | 返回推流/拉流地址 |
| 创建日程 | POST | `/api/admin/live/schedule` | 创建直播日程 |
| 获取日程 | GET | `/api/admin/live/schedule` | 获取当前日程 |
| 取消日程 | POST | `/api/admin/live/schedule/cancel` | 取消直播日程 |
| 获取观看人数 | GET | `/api/v1/admin/live/viewers` | 返回当前在线观看人数 |

### 投票系统

| 功能 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取投票汇总 | GET | `/api/v1/votes` | 返回指定流的正反方票数和百分比 |
| 用户投票 | POST | `/api/v1/user-vote` | 提交投票，支持直接格式和 wrapper 格式 |
| 获取用户投票记录 | GET | `/api/v1/user-votes` | 返回用户最近一次投票 |
| 投票统计 | GET | `/api/v1/admin/votes/statistics` | 返回投票汇总+时间线+增长率 |
| 管理端设置票数 | PUT | `/api/admin/votes` | 直接设置正反方票数 |
| 重置票数 | POST | `/api/admin/votes/reset` | 票数归零 |
| 更新票数(增量/覆盖) | POST | `/api/v1/admin/live/update-votes` | action: set/add |
| 重置票数(指定值) | POST | `/api/v1/admin/live/reset-votes` | 重置到指定票数 |

### 辩题管理

| 功能 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取辩题 | GET | `/api/v1/debate-topic` | 返回当前流的辩题（自动创建默认） |
| 更新辩题 | PUT | `/api/admin/debate` | 更新辩题标题、正反方立场 |
| 创建辩题 | POST | `/api/v1/admin/debates` | 创建新辩题 |
| 获取指定辩题 | GET | `/api/v1/admin/debates/:debate_id` | 按 ID 获取辩题 |
| 更新指定辩题 | PUT | `/api/v1/admin/debates/:debate_id` | 按 ID 更新辩题 |
| 关联辩题到流 | PUT | `/api/v1/admin/streams/:stream_id/debate` | 将辩题绑定到直播流 |
| 解除关联 | DELETE | `/api/v1/admin/streams/:stream_id/debate` | 解除辩题与流的关联 |

### AI 内容

| 功能 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取 AI 内容列表 | GET | `/api/v1/ai-content` | 返回 AI 识别内容+评论（含 text、side 字段） |
| 管理端列表 | GET | `/api/v1/admin/ai-content/list` | 同上，管理端使用 |
| 获取单条内容 | GET | `/api/admin/ai-content/:content_id` | 返回指定内容+评论 |
| 创建 AI 内容 | POST | `/api/admin/ai-content` | 创建语音识别/分析内容 |
| 更新 AI 内容 | PUT | `/api/admin/ai-content/:content_id` | 更新内容文本或类型 |
| 删除 AI 内容 | DELETE | `/api/admin/ai-content/:content_id` | 删除指定内容 |

### 评论与点赞

| 功能 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 添加评论 | POST | `/api/comment` | 对 AI 内容发表评论 |
| 删除评论 | DELETE | `/api/comment/:comment_id` | 删除指定评论 |
| 点赞 | POST | `/api/like` | 对内容或评论点赞 |
| 获取评论列表 | GET | `/api/admin/ai-content/:content_id/comments` | 获取指定内容的评论 |

### AI 控制

| 功能 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 启动 AI 识别 | POST | `/api/v1/admin/ai/start` | 启动 AI，返回 sessionId |
| 停止 AI 识别 | POST | `/api/v1/admin/ai/stop` | 停止 AI 识别 |
| 暂停/恢复 AI | POST | `/api/v1/admin/ai/toggle` | action: pause/resume |

### Dashboard 与统计

| 功能 | 方法 | 路径 | 描述 |
|------|------|------|------|
| Dashboard 概览 | GET | `/api/v1/admin/dashboard` | 返回用户数、投票、评论、直播状态等汇总 |
| 统计摘要 | GET | `/api/admin/statistics/summary` | 返回总用户/评论/点赞数 |
| 日统计 | GET | `/api/admin/statistics/daily` | 返回最近 N 天的统计数据 |

### 用户管理

| 功能 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取用户列表 | GET | `/api/admin/users` | 分页返回用户列表 |
| 获取单个用户 | GET | `/api/admin/users/:user_id` | 返回指定用户详情 |

### 辩论流程与评委

| 功能 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取辩论流程 | GET | `/api/admin/debate-flow` | 返回辩论环节配置（默认7环节） |
| 保存辩论流程 | POST | `/api/admin/debate-flow` | 保存自定义环节配置 |
| 流程控制 | POST | `/api/admin/debate-flow/control` | action: start/pause/resume/reset/next/prev |
| 获取评委 | GET | `/api/v1/admin/judges` | 返回评委列表 |
| 保存评委 | POST | `/api/admin/judges` | 保存评委配置 |

### 通用响应格式

```json
// 成功
{ "success": true, "data": { ... } }

// 失败
{ "success": false, "message": "错误描述" }
```

## 项目开发过程笔记

### 项目实现思路

本项目采用**网关 + 后端 + 多前端**的分层架构，围绕"直播辩论"核心场景展开：

1. **中间层网关 (live-gateway)**: 作为整个系统的统一入口，替代传统 Nginx 方案。负责请求路由分发、CORS 统一处理、直播日程定时调度、管理端静态资源托管，并在开发阶段提供 Mock 数据模拟能力，使前端可以脱离后端独立开发调试。
2. **后端 (Go + Gin)**: 提供核心业务逻辑和数据持久化。使用 GORM + SQLite 简化数据层，JWT 实现认证，Mock 数据在首次启动时自动注入，降低开发调试成本。
3. **前端 H5 小程序端 (UniApp + Vue3)**: 面向用户，提供直播观看、投票、评论互动等功能。通过轮询接口获取最新数据。
4. **后台管理系统 (HTML/JS)**: 面向管理员，提供直播流管理、辩题配置、AI 控制、数据统计等功能。由网关层直接托管静态资源，减少独立部署成本。

### 遇到的问题与解决方案

| 问题 | 解决方案 |
|------|----------|
| **待补充** | 开发过程中遇到的具体问题和解决方案记录在此 |

<!-- 示例格式：
| CORS 跨域请求被拦截 | Gin 中间件配置 AllowAllOrigins，并放行 Authorization header |
| Mock 数据重复注入 | seedMockData() 中增加数据库非空检测，仅首次启动注入 |
-->

### 本地联调经验

1. **后端启动**: 进入 `backend/` 目录，执行 `go run main.go`，服务默认监听 `localhost:8000`
2. **网关启动**: 进入 `live-gateway/` 目录，执行 `npm run dev`（开发模式，nodemon 自动重启），服务监听 `localhost:8090`
3. **前端 H5 端**: 使用 HBuilderX 打开 `froneted/` 目录，运行到浏览器或微信开发者工具；API 地址配置指向网关 `http://localhost:8090`，由网关统一转发至后端
4. **后台管理系统**: 网关启动后直接访问 `http://localhost:8081/admin/` 即可，无需额外启动
5. **Mock 模式开发**: 修改 `live-gateway/config/server-mode.node.js` 中的 `USE_MOCK_SERVER` 为 `true`，网关将使用内置 Mock 数据（每 3 秒模拟投票、每 15 秒生成 AI 内容），前端无需依赖后端即可开发
7. **注意事项**:
   - 首次启动后端会自动注入 Mock 数据，无需手动导入
   - JWT token 有效期 72 小时，本地调试时注意 token 过期问题
   - 跨域由网关层统一处理，后端和前端无需单独配置 CORS
   - 本地联调推荐启动顺序：后端 (8000) -> 网关 (8090) -> 前端

### 部署步骤与踩坑记录

#### 部署步骤

1. **服务器环境**: 腾讯云 Ubuntu 24.04，安装 Go 1.22+、Node.js、pm2
2. **代码同步**: 使用 rsync 将本地代码同步到服务器
3. **后端编译与启动**:
   ```bash
   cd backend && go build -o server main.go
   pm2 start ./server --name live-backend
   ```
4. **网关部署**:
   ```bash
   cd live-gateway && npm install
   pm2 start gateway.js --name live-gateway
   ```
5. **前端部署**:
   ```bash
   cd froneted && pm2 start server.js --name live-frontend
   ```
6. **pm2 持久化**: `pm2 save && pm2 startup` 配置开机自启
7. **端口映射**: 外部流量统一进入网关 8090 端口，由网关分发至后端 8000 和管理端静态资源

#### 踩坑记录

| 问题 | 解决方案 |
|------|----------|
| 服务器 Go 版本过低（1.18）导致编译失败 | 手动安装 Go 1.22二进制包，更新 PATH |
| Mock 模式与真实后端数据冲突，前端数据混乱 | 在 `live-gateway/config/server-mode.node.js` 中增加模式标识，Mock 模式下接口返回增加 `mock: true` 标记； 前端请求拦截器根据标记区分数据来源，避免混淆；3. 联调时统一切换为 Real 模式，关闭 Mock 定时任务 |
| 直播流 ID 自动解析失败，接口返回 stream_id 不存在 | 检查 `backend/services/stream_resolver.go` 中解析逻辑，补充空值判断；网关层转发请求时，确保 `stream_id` 参数通过 query/body 正确传递；3. 增加接口参数校验，返回明确的错误提示（如 “stream_id 不能为空”） |
| rsync 同步代码时，忽略了 node_modules 导致网关启动失败 | 在本地创建 `.rsync-filter` 文件，添加 `+ node_modules/` 确保依赖目录同步；同步命令补充 `--include='node_modules/'`；服务器端执行 `npm install` 重新安装依赖，验证网关启动 |

## 个人介绍

本人热爱学习计算机热门前沿技术且对AI开发工具有一定使用经验

+ **主语言**Go、Java、C++，兼顾前端基础

+ **擅长方向**：后端开发、Gin 框架、Docker 容器运维、Linux服务部署、机器视觉等计算机技术

+ **学习目标**：深耕 Go 后端与 Gin 生态，探索 Go 结合 AI 的应用开发，持续提升工程化与实战能力；学习入门人工智能领域，为深化AI工程师做铺垫
