# Craftisle 详细设计文档

> 版本：v1.1 | 更新日期：2026-06-05 | 维护者：操盘手
> ⚠️ **本文档仅适用于主站 (craftisle-app)**，PDF 站 (pdfcraft-fork) 无数据库/无认证，架构不同。

---

## 一、数据模型设计（Prisma Schema）

### 1.1 User 模型

```prisma
model User {
  id                        String     @id @default(cuid())
  name                      String?
  email                     String?    @unique
  emailVerified             DateTime?   @map("email_verified")
  image                     String?
  createdAt                 DateTime   @default(now())  @map("created_at")
  updatedAt                 DateTime   @default(now())  @map("updated_at")
  role                      String     @default("USER")
  stripeCustomerId          String?    @unique  @map("stripe_customer_id")
  stripeSubscriptionId      String?    @unique  @map("stripe_subscription_id")
  stripePriceId             String?              @map("stripe_price_id")
  stripeCurrentPeriodEnd    DateTime?           @map("stripe_current_period_end")
  accounts                  Account[]
  sessions                  Session[]

  @@map("users")
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `String` | CUID，主键 |
| `role` | `String` | 默认 `"USER"`，硬编码，需优化为动态角色系统 |
| `stripeCustomerId` | `String?` | Stripe 客户 ID，用于订阅管理 |
| `stripeCurrentPeriodEnd` | `DateTime?` | 订阅到期时间，JWT Callback 中用于判断 Pro 权限 |

### 1.2 Account 模型（NextAuth）

```prisma
model Account {
  id                String   @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?  @db.Text
  access_token      String?  @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?  @db.Text
  session_state     String?
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}
```

### 1.3 Session 模型（NextAuth）

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}
```

### 1.4 VerificationToken 模型

```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

---

## 二、API 设计

### 2.1 NextAuth API Routes

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/auth/[...nextauth]` | `GET/POST` | NextAuth 统一入口 |
| `/api/auth/signin` | `POST` | 登录（Google OAuth + Credentials） |
| `/api/auth/session` | `GET` | 获取当前 Session |
| `/api/auth/signout` | `POST` | 登出 |

### 2.2 Stripe API Routes（待实现）

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/stripe/checkout` | `POST` | 创建 Stripe Checkout Session |
| `/api/stripe/webhook` | `POST` | Stripe Webhook 接收 |
| `/api/stripe/billing` | `GET` | 获取账单入口 URL |

### 2.3 Ghost CMS API Routes（待实现）

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/ghost/posts` | `GET` | 获取 Ghost 文章列表 |
| `/api/ghost/posts/[slug]` | `GET` | 获取单篇文章 |

---

## 三、组件设计

### 3.1 工具站组件架构

```
app/(marketing)/tools/page.tsx   ← Server Component（静态生成）
        │
        ├── generateMetadata()     ← SEO 元数据
        │
        └── <ToolsClient />      ← Client Component
                │
                ├── 工具分类展示
                ├── 搜索/筛选
                └── 工具卡片列表（ToolMeta）
```

### 3.2 工具详情页组件架构

```
app/tools/[tool]/page.tsx        ← Server Component
        │
        ├── generateMetadata()     ← 动态 SEO（lib/tools.ts）
        │   - seoTitle
        │   - seoDesc
        │   - seoKeywords
        │
        └── <ToolComponent />    ← Lazy Loaded Client Component
                │
                └── 工具交互逻辑（纯客户端）
```

### 3.3 广告组件设计

```tsx
// components/ads/AdSlot.tsx
interface AdSlotProps {
  slot: "leaderboard" | "rectangle" | "halfpage" | "responsive"
}

// 使用方式：
// 1. 设置 NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxx
// 2. 页面任意位置插入 <AdSlot slot="leaderboard" />
// 3. 变量为空时，组件静默不渲染（一键关闭）
```

**广告位尺寸：**

| Slot 名称 | 尺寸 | 位置建议 |
|-----------|------|-----------|
| `leaderboard` | 728×90 | 页面顶部 |
| `rectangle` | 300×250 | 侧边栏 |
| `halfpage` | 300×600 | 内容旁 |
| `responsive` | 自适应 | 移动端 |

---

## 四、状态管理

### 4.1 Jotai 原子状态（待扩展）

当前项目已安装 `jotai` 和 `jotai-immer`，但尚未大量使用。

**建议状态划分：**

```ts
// lib/atoms.ts（待创建）
import { atom } from "jotai"

// 用户状态
export const userAtom = atom(null)

// 工具状态（纯客户端工具的中间状态）
export const toolStateAtom = atom({})

// UI 状态（主题、侧边栏等）
export const themeAtom = atom("light")
export const sidebarOpenAtom = atom(false)
```

### 4.2 React Hook Form（表单处理）

已安装 `@hookform/resolvers` + `react-hook-form` + `zod`

**使用模式：**

```tsx
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {...}
})
```

---

## 五、路由设计

### 5.1 静态路由

| 路由 | 文件 | 说明 |
|------|------|------|
| `/` | `app/(marketing)/page.tsx` | 首页 |
| `/login` | `app/login/page.tsx` | 登录页 |
| `/pricing` | `app/(marketing)/pricing/page.tsx` | 定价页 |
| `/play` | `app/play/page.tsx` | 游戏站入口 |

### 5.2 动态路由

| 路由 | 文件 | 说明 |
|------|------|------|
| `/tools/[tool]` | `app/tools/[tool]/page.tsx` | 工具详情页（58+ 工具） |
| `/play/[game]` | `app/play/[game]/page.tsx` | 游戏详情页 |

### 5.3 API 路由

| 路由 | 说明 |
|------|------|
| `/api/auth/[...nextauth]` | NextAuth 端点 |
| `/api/stripe/*` | Stripe 相关（待实现） |
| `/api/ghost/*` | Ghost CMS Proxy（待实现） |

---

## 六、SEO 设计

### 6.1 元数据生成策略

**全局元数据：** `app/layout.tsx` 中定义 `metadata` 对象

**页面级元数据：** 每个 `page.tsx` 导出 `generateMetadata()` 函数

```tsx
// app/tools/[tool]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = getToolBySlug(params.tool)  // from lib/tools.ts
  return {
    title: tool.seoTitle,
    description: tool.seoDesc,
    keywords: tool.seoKeywords,
  }
}
```

### 6.2 站点地图（待实现）

```tsx
// app/sitemap.tsx
// Next.js 16 内置 sitemap 生成
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tools = getAllTools()  // from lib/tools.ts
  return [
    { url: "https://craftisle.com" },
    ...tools.map(t => ({
      url: `https://craftisle.com/tools/${t.slug}`,
    })),
  ]
}
```

### 6.3 结构化数据（待实现）

```json
// app/tools/[tool]/json-ld.tsx
// 使用 next/env-helpers 或手写 JSON-LD
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Tool Name",
  "description": "...",
  "applicationCategory": "UtilitiesApplication"
}
```

---

## 七、国际化设计（待扩展）

已安装：
- `i18next` 26.3.0
- `react-i18next` 17.0.8
- `i18next-browser-languagedetector` 8.2.1
- `i18next-http-backend` 4.0.0

**当前状态：** 已安装但未配置，所有 UI 文本使用英文硬编码。

**建议配置：** `i18n/`（目录） + `i18n.ts`（配置文件）

---

## 八、扩展阅读

- [架构设计文档](./README.md)
- [集成设计文档](./integration.md)
- [UI 设计规范](./ui.md)
- [SEO 优化文档](./seo.md)
- [PRD 产品需求文档](../prd/PRD.md)
