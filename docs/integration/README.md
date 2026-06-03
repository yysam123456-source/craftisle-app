# Craftisle 集成设计文档

> 版本：v1.0 | 更新日期：2026-06-03 | 维护者：操盘手 |

---

## 一、NextAuth v5 单点登录（SSO）集成

### 1.1 集成架构

```
用户登录请求
      │
      ▼
NextAuth Middleware（next-auth v5）
      │
      ├── Google OAuth Provider
      │     ├── clientId: GOOGLE_CLIENT_ID
      │     ├── clientSecret: GOOGLE_CLIENT_SECRET
      │     └── allowDangerousEmailAccountLinking: true
      │
      ├── Credentials Provider
      │     └── authorize() → JWT 模式（无 DB 时）
      │
      └── Session Strategy: "jwt"
            │
            └── JWT Callback → 写入 user.id, role
                  │
                  └── Session Callback → 返回 session.user
```

### 1.2 环境变量配置

**Server-side（Vercel Dashboard 配置）：**

| 变量名 | 说明 | 状态 |
|--------|------|------|
| `AUTH_SECRET` | NextAuth JWT 签名密钥 | ✅ 已配置 |
| `NEXTAUTH_URL` | NextAuth 回调地址 | ✅ 已配置 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ 已配置 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ✅ 已配置 |

**获取 Google OAuth 凭证：**

1. 访问 [Google Cloud Console](https.example.com)
2. 创建 OAuth 2.0 Client ID
3. Authorized Redirect URIs: `https://craftisle.com/api/auth/callback/google`

### 1.3 数据库适配器集成

**条件激活模式：**（`auth.ts` 第 13-20 行）

```typescript
function isValidDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL
  if (!url || url.length < 20) return false
  if (url.includes("placeholder") || url.includes("localhost")) return false
  return /^(postgresql|postgres|mysql|mongodb)\+?\:\/\/[^@]+@/.test(url)
}

const hasValidDb = isValidDatabaseUrl()

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 仅当 DATABASE_URL 有效时才附加 PrismaAdapter
  ...(hasValidDb ? { adapter: PrismaAdapter(prisma) } : {}),
  callbacks: {
    async jwt({ token }) {
      if (!token.sub) return token
      if (!hasValidDb) return token
      const dbUser = await getUserById(token.sub)
      if (dbUser) {
        token.name = dbUser.name
        token.email = dbUser.email
        token.role = dbUser.role
      }
      return token
    },
  },
})
```

**设计意图：** 防止 Vercel Preview 环境（DATABASE_URL 为 placeholder）下 NextAuth 每次页面加载都崩溃。

### 1.4 登录页面设计

**路径：** `app/login/page.tsx`

**功能：**
- Google OAuth 按钮（使用 `signIn("google")`）
- Email/Password 表单（Credentials Provider）
- 错误提示（从 `?error=` 读取）

---

## 二、Ghost CMS 集成

### 2.1 集成架构

```
Ghost CMS (ghost.io 或自托管）
      │
      ├── Content API (只读，公开）
      │     └── GHOST_URL + GHOST_CONTENT_API_KEY
      │
      └── Admin API (读写，需 OAuth）
            └── GHOST_ADMIN_API_KEY (待配置）
                  │
                  ▼
Next.js Frontend (craftisle.com)
      │
      ├── lib/ghost.ts (API 封装）
      ├── app/api/ghost/[...path]/route.ts (Proxy）
      └── content/blog/ (ContentLayer 同步）
```

### 2.2 环境变量配置

| 变量名 | 说明 | 状态 |
|--------|------|------|
| `GHOST_URL` | Ghost CMS URL | ⚠️ 待配置 |
| `GHOST_CONTENT_API_KEY` | Ghost Content API Key | ⚠️ 待配置 |
| `NEXT_PUBLIC_GHOST_URL` | 客户端可访问的 Ghost URL | ⚠️ 待配置 |

**next.config.js 中的配置：**

```javascript
const nextConfig = {
  env: {
    GHOST_URL: process.env.GHOST_URL || "",
    GHOST_CONTENT_API_KEY: process.env.GHOST_CONTENT_API_KEY || "",
  },
}
```

### 2.3 ContentLayer 集成

**状态：** `@tryghost/content-api` 已安装，`contentlayer2` + `next-contentlayer2` 已安装

**配置示例（待实现）：**

```typescript
// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer2"
import { Post } from "./types"

export default makeSource({
  contentDirPath: "content/blog",
  documentTypes: [Post],
})
```

### 2.4 Ghost 内容同步策略

**方案 A：Build-time 同步（推荐）**

```typescript
// lib/ghost.ts
import GhostContentAPI from "@tryghost/content-api"

const api = new GhostContentAPI({
  url: process.env.GHOST_URL!,
  key: process.env.GHOST_CONTENT_API_KEY!,
  version: "v5.0"
})

export async function getAllPosts() {
  return await api.posts
    .browse({ limit: "all", include: "tags,authors" })
    .catch(err => console.error(err))
}
```

**方案 B：Runtime Proxy（待实现）**

```typescript
// app/api/ghost/[...path]/route.ts
export async function GET(req: Request) {
  const ghostUrl = process.env.GHOST_URL
  const url = `${ghostUrl}/ghost/api/content/${params.path}`
  const res = await fetch(url, {
    headers: { "Authorization": `Ghost ${process.env.GHOST_CONTENT_API_KEY}` }
  })
  return new Response(await res.text(), { status: res.status })
}
```

---

## 三、Stripe 订阅集成

### 3.1 集成架构

```
用户点击"升级到 Pro"
      │
      ▼
/app/pricing/page.tsx
      │
      ▼
/api/stripe/checkout/route.ts
      │
      ├── Stripe Checkout Session 创建
      │     ├── mode: "subscription"
      │     ├── price: STRIPE_PRICE_ID
      │     └── success_url: /dashboard?success=true
      │
      └── 返回 checkout_url
            │
            ▼
Stripe Hosted Checkout Page
      │
      ▼
用户完成支付
      │
      ▼
Stripe Webhook (POST /api/stripe/webhook)
      │
      ├── event.type === "checkout.session.completed"
      │     └── 更新 Prisma User 表
      │           ├── stripeCustomerId
      │           ├── stripeSubscriptionId
      │           ├── stripePriceId
      │           └── stripeCurrentPeriodEnd
      │
      └── event.type === "invoice.payment_failed"
            └── 发送邮件提醒（Resend）
```

### 3.2 环境变量配置

| 变量名 | 说明 | 状态 |
|--------|------|------|
| `STRIPE_API_KEY` | Stripe Secret Key | ⚠️ 待配置 |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret | ⚠️ 待配置 |
| `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID` | 月度套餐 Price ID | ⚠️ 待配置 |
| `NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID` | 年度套餐 Price ID | ⚠️ 待配置 |
| `NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID` | 商业版月度 Price ID | ⚠️ 待配置 |
| `NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID` | 商业版年度 Price ID | ⚠️ 待配置 |

### 3.3 Prisma User 模型中的 Stripe 字段

```prisma
model User {
  id                     String   @id @default(cuid())
  stripeCustomerId       String?  @unique  @map("stripe_customer_id")
  stripeSubscriptionId   String?  @unique  @map("stripe_subscription_id")
  stripePriceId          String?           @map("stripe_price_id")
  stripeCurrentPeriodEnd DateTime?          @map("stripe_current_period_end")
}
```

### 3.4 Webhook 处理流程

```typescript
// app/api/stripe/webhook/route.ts
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")
  const event = stripe.webhooks.constructEvent(
    await req.text(),
    sig!,
    process.env.STRIPE_WEBHOOK_SECRET!
  )

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session
      await prisma.user.update({
        where: { stripeCustomerId: session.customer as string },
        data: {
          stripeSubscriptionId: session.subscription as string,
          stripeCurrentPeriodEnd: new Date(session.expires_at! * 1000),
        },
      })
      break
    case "invoice.payment_succeeded":
      // 更新 stripeCurrentPeriodEnd
      break
    case "customer.subscription.deleted":
      // 设置 stripeCurrentPeriodEnd = now()
      break
  }

  return new Response("ok", { status: 200 })
}
```

---

## 四、Resend 邮件集成

### 4.1 集成架构

```
Next.js API Route
      │
      ▼
/lib/mail.ts (Resend 封装）
      │
      ▼
Resend API (https://api.resend.com)
      │
      ▼
用户邮箱
```

### 4.2 环境变量配置

| 变量名 | 说明 | 状态 |
|--------|------|------|
| `RESEND_API_KEY` | Resend API Key | ⚠️ 待配置 |
| `EMAIL_FROM` | 发件人地址（需验证域名） | ⚠️ 待配置 |

### 4.3 邮件模板设计

**已安装：** `@react-email/components` + `react-email`

**使用模式：**

```typescript
// emails/verify-email.tsx
import { Button, Heading, Text } from "@react-email/components"

export function VerifyEmail({ url }: { url: string }) {
  return (
    <Button href={url}>
      Verify Email
    </Button>
  )
}

// lib/mail.ts
import { Resend } from "resend"
import { VerifyEmail } from "@/emails/verify-email"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(to: string, url: string) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Verify your email",
    react: <VerifyEmail url={url} />,
  })
}
```

---

## 五、Google AdSense 集成

### 5.1 集成架构

```
NEXT_PUBLIC_ADSENSE_CLIENT 环境变量
      │
      ├── 有值（ca-pub-xxxx）→ 加载 Google AdSense 脚本
      │     └── 所有 <AdSlot /> 组件渲染
      │
      └── 空值 → 所有 <AdSlot /> 组件静默不渲染
```

### 5.2 组件设计

**路径：** `components/ads/AdSlot.tsx`

```typescript
"use client"

import { useEffect, useRef } from "react"

export function AdSlot({ slot }: { slot: "leaderboard" | "rectangle" | "halfpage" | "responsive" }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT) return
    if (!ref.current) return

    const script = document.createElement("script")
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js`
    script.async = true
    document.head.appendChild(script)

    ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
    ;(window as any).adsbygoogle.push({})
  }, [])

  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT) return null

  return (
    <div ref={ref}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        data-ad-slot={getSlotId(slot)}
        data-ad-format={slot === "responsive" ? "auto" : undefined}
      />
    </div>
  )
}

function getSlotId(slot: string) {
  // 从 Vercel Dashboard 获取 Ad Slot ID
  switch (slot) {
    case "leaderboard": return "1234567890"
    case "rectangle": return "2345678901"
    case "halfpage": return "3456789012"
    case "responsive": return "4567890123"
  }
}
```

### 5.3 使用方式

```tsx
// app/(marketing)/tools/page.tsx
import { AdSlot } from "@/components/ads/AdSlot"

export default function ToolsPage() {
  return (
    <div>
      <AdSlot slot="leaderboard" />
      {/* 工具列表 */}
      <AdSlot slot="rectangle" />
    </div>
  )
}
```

### 5.4 一键开关原理

**核心机制：** `NEXT_PUBLIC_ADSENSE_CLIENT` 为空时，`AdSlot` 组件直接 `return null`，不加载任何 AdSense 脚本。

**操作步骤：**

1. **开启广告：** 在 Vercel Dashboard 设置 `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxx`（你的 AdSense Client ID）
2. **关闭广告：** 在 Vercel Dashboard 删除 `NEXT_PUBLIC_ADSENSE_CLIENT` 或设为空值
3. **重新部署：** `git push origin main` 触发 Vercel 重新构建

---

## 六、Vercel 部署集成

### 6.1 自动部署流程

```
Git Push → Vercel Build → Production Deploy
      │
      ├── 检测 package.json → 运行 `next build`
      ├── 检测 next.config.js → 应用配置
      ├── 注入环境变量（Vercel Dashboard 配置）
      └── 部署到 .vercel.app 或自定义域名
```

### 6.2 自定义域名配置

**当前配置：**

| 域名 | 环境 | 状态 |
|------|------|------|
| `craftisle.com` | Production | ✅ 已配置 |
| `pdf.craftisle.com` | Production（独立项目） | ✅ 已配置 |
| `viewer.craftisle.com` | Production（独立项目） | ✅ 已配置 |

**DNS 配置（Cloudflare）：**

| 记录类型 | 名称 | 值 | 说明 |
|-----------|------|-----|------|
| `CNAME` | `www` | `cname.vercel-dns.com` | WWW 重定向 |
| `A` | `@` | `76.76.21.21` | 根域名 Apex |
| `CNAME` | `pdf` | `cname.vercel-dns.com` | PDF 站点子域名 |
| `CNAME` | `viewer` | `cname.vercel-dns.com` | File Viewer 子域名 |

### 6.3 环境变量管理

**本地开发：** `.env.local`（已被 `.gitignore` 排除）

**生产环境：** Vercel Dashboard → Settings → Environment Variables

**重要：** 不要将 `.env.local` 提交到 Git 仓库！

---

## 七、扩展阅读

- [架构设计文档](./README.md)
- [详细设计文档](./design.md)
- [UI 设计规范](./ui.md)
- [SEO 优化文档](./seo.md)
- [PRD 产品需求文档](../prd/PRD.md)
