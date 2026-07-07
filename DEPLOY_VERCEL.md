# Deploy Cap to Vercel

支持两种存储后端：

| 后端 | 推荐场景 | 免费额度 |
|------|---------|---------|
| **Neon Postgres**（默认） | 新用户首选，Vercel 原生集成 | 0.5 GB, 100h/mo |
| **Upstash Redis** | 从 Vercel KV 迁移的存量用户 | 10k 命令/月 |

> Vercel KV 已停服，不再可用。

---

## Option A: Neon Postgres（推荐）

### Vercel Dashboard

**1.** 把代码推送到 GitHub

```bash
git add cloud/ && git commit -m "add cloud deployment" && git push
```

**2.** Vercel 导入项目
- https://vercel.com/new → 选择你的仓库
- **Root Directory** 设为 `cap/cloud`
- Framework Preset → **Other**

**3. 在 Vercel 创建 Postgres 数据库**
- 在项目 Dashboard → **Storage** → **Create → Postgres**（由 Neon 提供）
- 创建后 Vercel 会自动注入 `DATABASE_URL`
- 如果你的 Vercel 项目没有 Storage 选项，可以直接在 [console.neon.tech](https://console.neon.tech) 创建，然后手动添加 `DATABASE_URL`

**4.** 添加 `ADMIN_KEY`

| 变量 | 值 |
|------|-----|
| `ADMIN_KEY` | 管理员密码（至少 12 位） |

**5.** 点击 **Deploy**

**6.** 验证
```
https://你的项目.vercel.app/health
→ {"ok":true,"version":"3.1.5"}
```

---

## Option B: Upstash Redis（从 Vercel KV 迁移）

**1-2.** 同上

**3.** 注册 Upstash
- 打开 https://console.upstash.com → **Create Database**
- 区域选 **Global** 或最近的地域
- 拿到 **REST URL** 和 **REST Token**

**4.** 添加环境变量

| 变量 | 值 |
|------|-----|
| `ADMIN_KEY` | 管理员密码（至少 12 位） |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST Token |

**5.** 点击 **Deploy**

---

## Option C: Vercel CLI

```bash
cd cap/cloud
npm install

# 添加环境变量
vercel env add ADMIN_KEY
vercel env add DATABASE_URL   # 或者 UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN

vercel --prod
```

---

## 环境变量一览

| 变量 | 必填 | 说明 |
|------|------|------|
| `ADMIN_KEY` | **是** | 管理员密码（至少 12 位） |
| `DATABASE_URL` | 选一 | Neon Postgres 连接串 |
| `UPSTASH_REDIS_REST_URL` | 选一 | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | 选一 | Upstash Redis REST Token |

可选：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MEMORY_STORAGE` | `false` | 强制使用内存存储（开发调试） |
| `DEMO_MODE` | `false` | 演示模式（内存存储 + 假数据） |
| `CORS_ORIGIN` | `*` | 允许的 CORS 域名 |
| `IPINFO_TOKEN` | - | IPInfo API Token（地理定位） |
| `REDIS_PREFIX` | `""` | （仅 Upstash）Redis 键前缀 |
| `RSW_BITS` | `2048` | RSW 挑战 RSA 密钥大小 |
| `WIDGET_VERSION` | `latest` | Widget CDN 版本 |
| `WASM_VERSION` | `latest` | WASM CDN 版本 |

---

## 部署后验证

```bash
# 健康检查
curl https://你的项目.vercel.app/health

# 登录
curl -X POST https://你的项目.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"admin_key":"你的密码"}'

# 创建站点密钥
curl -X POST https://你的项目.vercel.app/server/keys \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

---

## 架构

```
请求 → Vercel Edge → Serverless Function (api/index.js)
                            │
                    ┌───────┴───────┐
                    │  Hono Router   │
                    ├────────────────┤
                    │  /health       │  ← 公开
                    │  /auth/*       │  ← 公开
                    │  /:sk/challenge│  ← 公开
                    │  /:sk/redeem   │  ← 公开
                    │  /:sk/siteverify│ ← 公开
                    │  /server/*     │  ← 需认证
                    │  /assets/*     │  ← 公开
                    └───────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              │    Neon Postgres          │
              │  (或 Upstash Redis)       │
              └───────────────────────────┘
```
