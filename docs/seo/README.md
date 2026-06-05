# SEO 优化文档

> **适用项目**: 本文档适用于主站 (craftisle-app)，PDF 站 (pdfcraft-fork) 的 SEO 配置见独立项目 `pdfcraft-fork/src/lib/seo/`。
> **Next.js 版本**: 主站 16 (canary)，PDF 站 15 (next-intl)。

## 1. SEO 架构概览

### 1.1 技术架构
- **框架**: Next.js 16 App Router
- **元数据**: 基于 `metadata` 导出 + `generateMetadata` 动态生成
- **站点地图**: Next.js 16 内置 `sitemap.ts` 自动生成（主站 + PDF 站独立）
- **结构化数据**: Schema.org JSON-LD（HowTo / FAQPage / SoftwareApplication）
- **多语言**: 主站仅英文；PDF 站 next-intl 14 语言（EN/JA/KO/ES/FR/DE/ZH-TW/ZH/PT/AR/IT/ID/VI/RO）

### 1.2 目录结构
```
app/
├── layout.tsx          # 全局 metadata
├── page.tsx           # 首页 SEO
├── sitemap.ts         # 动态站点地图
├── robots.ts          # Robots.txt
├── (marketing)/
│   ├── layout.tsx    # Marketing 布局
│   └── tools/[tool]/
│       └── page.tsx  # 工具页动态 metadata
└── play/
    └── [game]/
        └── page.tsx  # 游戏页动态 metadata
```

---

## 2. 元数据策略

### 2.1 全局元数据 (`app/layout.tsx`)
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://www.craftisle.com'),
  title: {
    default: 'Craftisle - Free Online Tools & Games',
    template: '%s | Craftisle'
  },
  description: 'Free online tools and games. Image tools, PDF tools, browser games.',
  keywords: ['free tools', 'online tools', 'browser games', 'image tools', 'PDF tools'],
  authors: [{ name: 'Craftisle Team' }],
  creator: 'Craftisle',
  publisher: 'Craftisle',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.craftisle.com',
    siteName: 'Craftisle'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Craftisle - Free Online Tools & Games',
    description: 'Free online tools and games.',
    images: ['']
  }
}
```

### 2.2 工具页动态元数据 (`app/(marketing)/tools/[tool]/page.tsx`)
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = await getToolBySlug(params.tool)
  
  if (!tool) return {}
  
  return {
    title: tool.seoTitle,           // 例: "Image Resizer - Free Online Tool"
    description: tool.seoDesc,      // 例: "Resize images online for free..."
    keywords: tool.seoKeywords,     // 例: ["image resizer", "resize image online"]
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDesc,
      images: [`/og/tools/${params.tool}.png`]
    }
  }
}
```

### 2.3 游戏页动态元数据 (`app/play/[game]/page.tsx`)
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = await getGameBySlug(params.game)
  
  return {
    title: `${game.title} - Play Online | Craftisle`,
    description: game.description,
    openGraph: {
      title: game.title,
      description: game.description,
      images: [`/og/games/${params.game}.png`],
      type: 'website'
    }
  }
}
```

---

## 3. 长尾关键词策略

### 3.1 关键词挖掘方法
基于"长尾词挖掘方法脑图"：
1. **种子词**: 核心功能词（例: "image resizer"）
2. **问题词**: "how to resize image online free"
3. **比较词**: "best free image resizer vs paid"
4. **地域词**: "free image resizer no sign up"
5. **时间词**: "best free tools 2026"

### 3.2 工具页关键词模板
每个工具页配置：
- **主关键词**: 1个（高搜索量，中等竞争）
- **长尾关键词**: 3-5个（低搜索量，低竞争）
- **LSI关键词**: 2-3个（语义相关）

示例（`lib/tools.ts` 中的 `ToolMeta` 接口）：
```typescript
interface ToolMeta {
  title: string           // 页面标题（<h1>）
  seoTitle: string       // SEO 标题（<title>）
  seoDesc: string       // Meta description
  seoKeywords: string[] // 关键词数组
  canonical?: string     // 规范链接
}
```

### 3.3 已完成的SEO优化（58+工具页）
✅ 所有工具页已完成逐页SEO优化，包括：
- 唯一的 `seoTitle`（不超过60字符）
- 唯一的 `seoDesc`（150-160字符）
- 相关的 `seoKeywords`（5-8个）
-  Open Graph 标签
- Twitter Card 标签

---

## 4. 站点地图与Robots

### 4.1 动态站点地图 (`app/sitemap.ts`)
```typescript
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.craftisle.com'
  
  // 静态页面
  const staticPages = [
    '',
    '/tools',
    '/play',
    '/about',
    '/privacy',
    '/terms'
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8
  }))
  
  // 动态工具页
  const tools = await getAllTools()
  const toolPages = tools.map(tool => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: tool.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7
  }))
  
  // 动态游戏页
  const games = await getAllGames()
  const gamePages = games.map(game => ({
    url: `${baseUrl}/play/${game.slug}`,
    lastModified: game.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6
  }))
  
  return [...staticPages, ...toolPages, ...gamePages]
}
```

### 4.2 Robots.txt (`app/robots.ts`)
```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/_next/']
    },
    sitemap: 'https://www.craftisle.com/sitemap.xml'
  }
}
```

---

## 5. 结构化数据 (Schema.org)

### 5.1 工具页结构化数据
```typescript
// app/(marketing)/tools/[tool]/page.tsx
export default async function ToolPage({ params }: Props) {
  const tool = await getToolBySlug(params.tool)
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.description,
    url: `https://www.craftisle.com/tools/${tool.slug}`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  }
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 页面内容 */}
    </>
  )
}
```

### 5.2 面包屑结构化数据
```typescript
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.craftisle.com'
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Tools',
      item: 'https://www.craftisle.com/tools'
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: tool.name,
      item: `https://www.craftisle.com/tools/${tool.slug}`
    }
  ]
}
```

---

## 6. 技术SEO

### 6.1 性能优化（Core Web Vitals）
- **LCP**: 使用 `next/image` 优化图片，预加载关键资源
- **FID**: 代码分割 + 动态导入（`dynamic(() => import('...'))`）
- **CLS**: 所有图片/视频设置 `width` + `height`，预留空间

### 6.2 URL结构
- **静态页**: `https://www.craftisle.com/about`
- **工具页**: `https://www.craftisle.com/tools/image-resizer`
- **游戏页**: `https://www.craftisle.com/play/island-builder`
- **规范链接**: 所有动态页设置 `canonical` URL

### 6.3 内部链接策略
- 工具页底部推荐相关工具（3-5个）
- 游戏页推荐同类游戏
- 首页展示热门工具和游戏

---

## 7. 内容SEO

### 7.1 工具页内容结构
每个工具页包含：
1. **H1**: 工具名称 + 核心功能
2. **简介**: 2-3句话描述工具用途
3. **如何使用**: 3-5步操作指南
4. **功能特点**: 3-5个要点
5. **常见问题**: 3-5个FAQ（使用 `<FAQItem>` 组件 + Schema.org FAQPage）

### 7.2 FAQ结构化数据
```typescript
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is this tool free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all tools on Craftisle are 100% free.'
      }
    },
    // ...更多问题
  ]
}
```

---

## 8. 外链与推广

### 8.1 外链建设策略
- **产品目录**: 提交到 Product Hunt, BetaList, Hacker News
- **工具目录**: 提交到 AlternativeTo, ToolBase
- ** guest posting**: 在相关博客发表客座文章

### 8.2 社交媒体
- **Twitter**: 每周发布工具更新
- **Reddit**: 在 r/toolspotting, r/usefulwebsites 分享
- **Discord**: 加入相关社区，分享工具

---

## 9. SEO监控与分析

### 9.1 监控指标
- **Google Search Console**: 索引状态、点击率、排名
- **Google Analytics 4**: 自然流量、跳出率、停留时间
- **Vercel Analytics**: Core Web Vitals、页面性能

### 9.2 定期检查（每月）
- [ ] 检查404错误
- [ ] 检查站点地图覆盖率
- [ ] 检查移动端友好性
- [ ] 检查页面速度
- [ ] 更新过时内容

---

## 10. 变更日志

### 2026-06-05
- **PDF站 (pdf.craftisle.com)**: 尝试修复 og:image 指向 localhost:3000 的问题
  - 在所有 `generateMetadata` 返回值中添加 `metadataBase`
  - 修复 `seo/index.ts` 漏导出 `generateTermsMetadata`
  - 修复 `generateBaseMetadata` 缺少 `return` 语句
  - 修复 `terms/page.tsx` 使用错误的 metadata 生成函数
  - **结果**: 构建警告仍存在，og:image 问题未解决
- **PDF站**: 添加 JSON-LD 结构化数据到 about、contact、privacy、terms、faq 页面

---

## 11. 待办事项

### 10.1 高优先级
- [ ] 配置 Google Search Console
- [ ] 配置 Google Analytics 4
- [ ] 提交站点地图到 GSC

### 10.2 中优先级
- [ ] 添加 FAQ 结构化数据到所有工具页
- [ ] 优化 Open Graph 图片（统一尺寸 1200x630）
- [ ] 添加面包屑导航 + 结构化数据

### 10.3 低优先级
- [ ] 多语言支持（ES/FR/DE）
- [ ] AMP版本（可选）
- [ ] PWA支持（可选）

---

**更新时间**: 2026-06-03  
**维护人**: Craftisle Team
