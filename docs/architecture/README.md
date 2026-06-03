# Craftisle 架构设计文档

> 版本：v1.0 | 更新日期：2026-06-03 | 维护者：操盘手

---

## 一、架构总览

```
┌─────────────────────────────────────────────────────────┐
│                     用户层                           │
│  浏览器 / 移动端 / PWA                              │
└──────────────────────┬──────────────────────────────┘
                         │ HTTPS
┌────────────────────────┴─────────────────────────────┐
│              Next.js 16 App Router (Vercel)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ (marketing)│ │  /play/  │ │  /tools/ │         │
│  │  营销页    │ │  游戏站   │ │  工具站  │         │
│  └──────────┘ └──────────┘ └──────────┘         │
│  ┌─────────────────────────────────────────────┐     │
│  │  Middleware: NextAuth v5 (JWT Session)    │     │
│  └─────────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
┌─────────┴────────┐ ┌┴────────────┐ ┌┴─────────────┐
│   Neon DB         │ │  Ghost CMS  │ │  Stripe      │
│   (PostgreSQL)   │ │  (内容管理)  │ │  (订阅支付)  │
└──────────────────┘ └─────────────┘ └──────────────┘
          │              │              │
┌─────────┴────────┐ ┌┴────────────┐ ┌┴─────────────┐
│  Cloudflare      │ │  Resend     │ │  Google      │
│  DNS + CDN       │ │  (邮件服务) │ │  OAuth       │
└──────────────────┘ └─────────────┘ └──────────────┘
```

---

## 二、技术栈详解

### 2.1 前端框架

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.1.0-canary.19 | App Router，SSR/SSG |
| React | 18.3.1 | UI 组件库 |
| TypeScript | 5.5.3 | 类型安全 |
| Tailwind CSS | 3.4.6 | 样式系统 |
| next-themes | 0.3.0 | 暗色模式 |
| Radix UI | latest | 无障碍组件库 |

### 2.2 数据层

| 技术 | 版本 | 用途 |
|------|------|------|
| Prisma | 5.22.0 | ORM |
| Neon DB | Serverless | PostgreSQL 数据库 |
| next-contentlayer2 | 0.5.0 | Markdown 内容管理 |

### 2.3 认证与支付

| 技术 | 版本 | 用途 |
|------|------|------|
| NextAuth v5 | 5.0.0-beta.30 | 认证框架 |
| @auth/prisma-adapter | 2.4.1 | Prisma 适配器 |
| Stripe JS | 15.12.0 | 前端支付 |
| Stripe Node | 15.12.0 | 后端支付 |

### 2.4 部署与运维

| 技术 | 用途 |
|------|------|
| Vercel | 自动部署（Git push 触发） |
| Cloudflare | DNS 管理 + CDN 加速 |
| GitHub | 代码仓库（SSH 连接） |

---

## 三、目录结构

```
craftisle-app/
├── app/                        # Next.js App Router
│   ├── (marketing)/           # 营销页面路由组
│   │   ├── page.tsx           # 首页
│   │   ├── tools/             # 工具站页面
│   │   └── pricing/           # 定价页面
│   ├── api/                  # API Routes
│   │   ├── auth/[...nextauth]/# NextAuth 路由
│   │   ├── stripe/            # Stripe Webhook
│   │   └── ghost/            # Ghost CMS Proxy
│   ├── play/                 # 游戏站路由
│   │   ├── island-builder/
│   │   ├── tiny-world-builder/
│   │   └── the-last-glimmer/
│   ├── tools/                # 工具详情页
│   │   └── [tool]/
│   ├── login/                # 登录页面
│   ├── layout.tsx            # 根布局（字体、主题）
│   └── globals.css          # 全局样式
├── components/               # React 组件
│   ├── ads/                 # 广告组件
│   │   └── AdSlot.tsx       # Google AdSense 插槽
│   ├── tools-client.tsx     # 工具站客户端组件
│   ├── header.tsx           # 站点头部
│   ├── footer.tsx           # 站点底部
│   └── ui/                 # Radix UI 基础组件
├── lib/                     # 工具函数库
│   ├── tools.ts              # 工具元数据（ToolMeta 接口）
│   ├── db.ts                # Prisma Client 单例
│   ├── user.ts              # 用户查询函数
│   └── utils.ts             # 通用工具函数
├── content/                 # ContentLayer 内容
│   └── blog/               # Ghost CMS 同步内容
├── prisma/
│   └── schema.prisma       # 数据模型定义
├── public/                  # 静态资源
├── docs/                    # 项目文档
├── next.config.js            # Next.js 配置
├── tailwind.config.ts       # Tailwind 配置
├── env.mjs                  # 环境变量校验（t3-env）
└── package.json
```

---

## 四、数据流架构

### 4.1 用户认证流程

```
用户访问受保护页面
        │
        ▼
NextAuth Middleware（JWT Session）
        │
        ├── 已登录 → 放行
        │
        └── 未登录 → 重定向到 /login
                    │
                    ▼
            Google OAuth / Credentials
                    │
                    ▼
            NextAuth JWT Callback
            （写入 user.id, role）
                    │
                    ▼
            Session 可用（session.user.id）
```

### 4.2 工具站数据流

```
用户访问 /tools/[tool]
        │
        ▼
app/tools/[tool]/page.tsx（Server Component）
        │
        ├── 读取 lib/tools.ts（ToolMeta 元数据）
        │   ├── seoTitle / seoDesc / seoKeywords
        │   └── component: LazyComponent
        │
        └── 生成静态元数据（generateMetadata）
                    │
                    ▼
Client Component  hydrate
        │
        ▼
工具交互（纯客户端，无服务器 API 调用）
```

### 4.3 支付订阅流程

```
用户点击"升级到 Pro"
        │
        ▼
/stripe/checkout API Route
        │
        ▼
Stripe Checkout Session 创建
        │
        ▼
用户完成支付（Stripe Hosted Page）
        │
        ▼
Stripe Webhook（/api/stripe/webhook）
        │
        ▼
更新 Prisma User 表：
  stripeCustomerId
  stripeSubscriptionId
  stripePriceId
  stripeCurrentPeriodEnd
        │
        ▼
用户下次登录，JWT Callback 读取 role = "PRO"
```

---

## 五、部署架构

### 5.1 Vercel 部署设计

| 环境 | 分支 | 域名 | 说明 |
|------|------|------|------|
| Production | `main` | craftisle.com | 生产环境 |
| Preview | PR 分支 | `*.vercel.app` | PR 预览 |
| Development | `dev` | local | 本地开发 |

### 5.2 环境变量配置清单

#### Server-side（Vercel Dashboard 配置）

| 变量名 | 说明 | 状态 |
|--------|------|------|
| `DATABASE_URL` | Neon DB 连接串 | ✅ 已配置 |
| `AUTH_SECRET` | NextAuth JWT 密钥 | ✅ 已配置 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ 已配置 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ✅ 已配置 |
| `NEXTAUTH_URL` | NextAuth 回调地址 | ✅ 已配置 |
| `STRIPE_API_KEY` | Stripe 私密 API Key | ⚠️ 待配置 |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 签名密钥 | ⚠️ 待配置 |
| `RESEND_API_KEY` | Resend 邮件 API Key | ⚠️ 待配置 |
| `EMAIL_FROM` | 发件人地址 | ⚠️ 待配置 |
| `GHOST_URL` | Ghost CMS URL | ⚠️ 待配置 |
| `GHOST_CONTENT_API_KEY` | Ghost Content API Key | ⚠️ 待配置 |

#### Client-side（NEXT_PUBLIC_ 前缀）

| 变量名 | 说明 | 状态 |
|--------|------|------|
| `NEXT_PUBLIC_APP_URL` | 应用根 URL | ✅ 已配置 |
| `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID` | Stripe 月度套餐 ID | ⚠️ 待配置 |
| `NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID` | Stripe 年度套餐 ID | ⚠️ 待配置 |
| `NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID` | 商业版月度 ID | ⚠️ 待配置 |
| `NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID` | 商业版年度 ID | ⚠️ 待配置 |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Google AdSense Client ID | ⚠️ 待配置（一键开关）|

### 5.3 构建与部署流程

```bash
# 自动部署（推荐）
git push origin main  →  Vercel Build  →  Production Deploy

# 手动部署（紧急修复）
vercel --prod  →  使用 ~/.workbuddy/memory/vercel-team-token.txt

# 预览部署（PR 检查）
git push origin feature/xxx  →  Vercel Preview URL
```

---

## 六、安全架构

### 6.1 认证安全

- **JWT Strategy**：Session 存在 JWT 里，不查数据库（性能优化）
- **CSRF 保护**：NextAuth 内置 CSRF Token
- **OAuth State**：Google OAuth 使用 `allowDangerousEmailAccountLinking: true`（需评估安全风险）

### 6.2 数据库安全

- **Prisma ORM**：防止 SQL 注入
- **Neon Serverless**：自动连接池管理
- **环境变量隔离**：`DATABASE_URL` 不在客户端暴露

### 6.3 CSP 策略（待配置）

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval' https://apis.google.com https://pagead2.googlesyndication.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  frame-src https://pagead2.googlesyndication.com;
```

---

## 七、性能优化策略

### 7.1 构建优化

- **Turbopack**：Next.js 16 默认启用
- **ContentLayer**：Markdown 预构建（`.contentlayer` 目录）
- **next/config.js**：`transpilePackages: ["@prisma/client"]`（修复 Edge Runtime）

### 7.2 运行时优化

- **SSR/SSG 混合**：营销页 SSG，工具页 SSR（SEO 友好）
- **图片优化**：`next/image` + Cloudflare CDN
- **代码分割**：App Router 自动按页分割
- **懒加载**：`React.lazy()` + `Suspense`（工具组件）

### 7.3 广告性能影响

- **AdSense 异步加载**：`AdSlot.tsx` 使用 `@google/adsense` 异步脚本
- **一键关闭**：`NEXT_PUBLIC_ADSENSE_CLIENT` 为空时完全不加载广告脚本

---

## 八、监控与日志（待实施）

### 8.1 错误监控

| 工具 | 用途 | 状态 |
|------|------|------|
| Vercel Analytics | 页面性能 | ✅ `@vercel/analytics` 已安装 |
| Vercel OG | Open Graph 图片生成 | ✅ `@vercel/og` 已安装 |
| Sentry | 错误追踪 | ⚠️ 待接入 |

### 8.2 日志策略

- **开发环境**：Console.log（NextAuth 回调错误）
- **生产环境**：Vercel Function Logs（保留 7 天）

---

## 九、扩展阅读

- [详细设计文档](./design.md)
- [集成设计文档](./integration.md)
- [UI 设计规范](./ui.md)
- [SEO 优化文档](./seo.md)
- [PRD 产品需求文档](../prd/PRD.md)
