# Cap Cloud

服务端部署包。支持两个平台，在站点面板上操作即可。

| 平台 | 部署方式 | 推荐存储 | 免费额度 |
|------|---------|---------|---------|
| **Vercel** | Serverless Function | Neon Postgres 或 Upstash Redis | 0.5 GB / 100h mo |
| **Cloudflare Pages** | Pages + Functions | Upstash Redis | 10 万请求/天 |

> Vercel KV 已停服，不再可用。

---

## Vercel 部署

### 1. 推送代码

将 `cloud/` 目录推送到 GitHub：

```bash
git add cloud/ && git commit -m "add cloud" && git push
```

### 2. 导入项目

- 打开 [vercel.com/new](https://vercel.com/new) → 选择你的仓库
- **Root Directory** 设为 `cloud`
- Framework Preset → **Other**

### 3. 创建数据库

**Neon Postgres（推荐）：** 在项目 Dashboard → **Storage** → **Create → Postgres**，Vercel 会自动注入 `DATABASE_URL`。

**Upstash Redis：** 打开 [console.upstash.com](https://console.upstash.com) → Create Database（区域选 Global），拿到 REST URL 和 Token。

### 4. 添加环境变量

在项目 Dashboard → **Settings → Environment Variables** 添加：

| 变量 | 必填 | 值 |
|------|------|----|
| `ADMIN_KEY` | **是** | 管理员密码（至少 12 位） |
| `DATABASE_URL` | 选一 | Neon Postgres 连接串（自动注入） |
| `UPSTASH_REDIS_REST_URL` | 选一 | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | 选一 | Upstash Redis REST Token |

可选：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEMO_MODE` | `false` | 演示模式（内存 + 假数据，不用数据库） |
| `CORS_ORIGIN` | `*` | 管理端 CORS 域名 |
| `IPINFO_TOKEN` | - | IPInfo API Token（IP 地理定位） |
| `WIDGET_VERSION` | `latest` | Widget CDN 版本 |
| `WASM_VERSION` | `latest` | WASM CDN 版本 |

### 5. 部署

点击 **Deploy**。部署后验证：

```
https://你的项目.vercel.app/health
→ {"ok":true,"version":"3.1.5"}
```

---

## Cloudflare Pages 部署

> Pages 自动托管管理面板静态文件（index.html、dashboard.js），API 路由由 `functions/[[path]].js` 处理，和 Vercel 一样一个入口搞定。

### 1. 推送代码

```bash
git add cloud/ && git commit -m "add cloud" && git push
```

### 2. 创建 Upstash Redis 数据库

打开 [console.upstash.com](https://console.upstash.com) → **Create Database**，区域选 **Global**，拿到 REST URL 和 REST Token。

### 3. 导入仓库

打开 [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**：

| 设置 | 值 |
|------|-----|
| 仓库 | 选择你的 GitHub 仓库 |
| **Root Directory** | `cloud/` |
| Build command | `npm run pages-build` |
| Build output | `public` |

### 4. 添加环境变量

部署后，在 Pages 项目 → **Settings → Environment variables** 添加：

| 变量 | 类型 | 值 |
|------|------|----|
| `ADMIN_KEY` | Secret | 管理员密码（至少 12 位） |
| `UPSTASH_REDIS_REST_URL` | Secret | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Secret | Upstash Redis REST Token |

> Pages 不支持 Neon Postgres（TCP 连接），只能用 Upstash Redis。

可选变量（Plain text）：

| 变量 | 值 |
|------|-----|
| `DEMO_MODE` | `false` |
| `CORS_ORIGIN` | `*` |
| `IPINFO_TOKEN` | IPInfo API Token |
| `WIDGET_VERSION` | `latest` |
| `WASM_VERSION` | `latest` |

### 5. 部署

回到 **Deployments** 标签，点 **Retry deployment** 或重新推送代码。Pages 会自动读取 `wrangler.toml` 中的 `nodejs_compat` 标志。

之后每次 `git push` 自动构建部署。

验证：

```
https://你的项目名.pages.dev/health
→ {"ok":true,"version":"3.1.5"}
```

---

## 部署后验证

```bash
# 健康检查
curl https://你的域名/health

# 登录
curl -X POST https://你的域名/auth/login \
  -H "Content-Type: application/json" \
  -d '{"admin_key":"你的密码"}'

# 打开管理面板
# 浏览器访问 https://你的域名/
```

---

## 架构

```
Vercel:                           Cloudflare Pages:
请求 → Serverless Function        请求 → Pages CDN → 静态文件命中 → 直接返回
       │                                     └→ 未命中 → functions/[[path]].js
       │  Hono Router                               │  Hono Router
       ├──────────────                              ├──────────────
       │  /health     │  公开                        │  /health     │  公开
       │  /auth/*     │  公开                        │  /auth/*     │  公开
       │  /:sk/*      │  公开（验证接口）             │  /:sk/*      │  公开
       │  /server/*   │  需认证                      │  /server/*   │  需认证
       │  /assets/*   │  公开                        │  /assets/*   │  公开
       └──────┬───────                              └──────┬───────
              │                                             │
    ┌────────┴────────┐                           ┌────────┴────────┐
    │  Upstash Redis  │                           │  Upstash Redis  │
    │  (或 Neon PG)   │                           │  (只 Redis)     │
    └─────────────────┘                           └─────────────────┘
```
