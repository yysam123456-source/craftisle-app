# Craftisle Directory 设计系统规范

## 1. 板块容器（SectionContainer）

### 使用场景
所有 Directory 板块的统一容器组件。

### Props
```typescript
interface SectionContainerProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  className?: string;
  id?: string;
}
```

### 间距规范
- 默认：`py-12`（48px）
- 特色板块：`py-16`（64px）
- 背景色：`bg-muted/20` 或 `bg-background`

### 标题规范
- 主标题：`text-2xl font-bold tracking-tight`（移动端 `sm:text-3xl`）
- 副标题：`text-lg text-muted-foreground`
- 对齐方式：居中（`text-center`）

---

## 2. 资源卡片（ResourceCard）

### 使用场景
所有资源列表的统一卡片组件。

### Props
```typescript
interface ResourceCardProps {
  resource: Resource;
  rank?: number;
  showScore?: boolean;
  showDescription?: boolean;
  showTags?: boolean;
  variant?: "default" | "compact" | "featured";
}
```

### 变体规范
- `default`：标准卡片（名称 + 描述 + 标签）
- `compact`：小型卡片（仅名称和图标，用于网格）
- `featured`：特色卡片（评分 + 星标 + 完整描述）

### 交互规范
- Hover：(`hover:border-primary/40 hover:shadow-md`)
- 过渡：`transition-all`
- 链接：(`group` + `group-hover:`)

---

## 3. 色彩规范

### 主色调
- Primary：`hsl(var(--primary))`
- Primary/40：`rgba(0, 0, 0, 0.4)`（Hover 边框）

### 背景色
- 默认：`bg-background`
- 交替：`bg-muted/20` 或 `bg-muted/30`
- 页脚 CTA：`bg-muted/30`

### 文本色
- 主文本：`foreground`
- 次要文本：`muted-foreground`
- 链接：`primary`

---

## 4. 排版规范

### 字体大小
- Hero 标题：`text-4xl sm:text-5xl md:text-6xl`
- 板块标题：`text-2xl font-bold tracking-tight`
- 卡片标题：`text-base font-semibold`
- 正文：`text-sm leading-relaxed`

### 行高
- 标题：`tight`（1.25）
- 正文：`relaxed`（1.625）

---

## 5. 间距规范

### 板块间距
- 默认：`py-12`（48px）
- 特色：`py-16`（64px）
- 内容间隙：`mb-8`（32px）

### 卡片间距
- 网格间隙：`gap-4`（16px）
- 列表间隙：`space-y-3`（12px）

---

## 6. 响应式规范

### 移动端（< 640px）
- 网格：(`grid-cols-1`)
- 标题：`text-2xl`
- 卡片：全宽

### 平板端（640px - 1024px）
- 网格：(`grid-cols-2`)
- 标题：`text-3xl`
- 卡片：半宽

### 桌面端（> 1024px）
- 网格：(`grid-cols-3` 或 `grid-cols-4`)
- 标题：`text-4xl`
- 卡片：三列或四列

---

## 7. 无障碍规范

### ARIA 标签
- 板块：`section[aria-label="..."]`
- 卡片：`article[aria-label="..."]`
- 链接：`a[aria-label="..."]`

### 键盘导航
- 所有交互元素可聚焦（`tabindex="0"`）
- 焦点样式：`focus:outline-none focus:ring-2`

### 颜色对比度
- 主文本：WCAG 2.1 AA（4.5:1）
- 大文本：WCAG 2.1 AA（3:1）

---

## 8. 性能规范

### 图片优化
- 使用 `next/image` 组件
- 懒加载：`loading="lazy"`
- 尺寸：(`width={500} height={300}`)

### 代码分割
- 动态导入：`dynamic(() => import('...'))`
- 懒加载：(`React.lazy(() => import('...'))`)

### 缓存策略
- ISR：`revalidate = 3600`（1 小时）
- SSR：`cache: 'no-store'`

---

## 9. SEO 规范

### Meta 标签
- Title：(`constructMetadata({ title: '...' })`)
- Description：(`constructMetadata({ description: '...' })`)
- Keywords：(`constructMetadata({ keywords: [...] })`)

### 结构化数据
- CollectionPage：`jsonLd['@type'] = 'CollectionPage'`
- ItemList：`jsonLd.mainEntity = { '@type': 'ItemList' }`
- FAQPage：`jsonLd.mainEntityOfPage = { '@type': 'FAQPage' }`

### hreflang 标签
- 多语言：`<link rel="alternate" hreflang="..." />`
- x-default：(`hreflang="x-default"`)

---

## 10. 测试规范

### 单元测试
- 组件：`*.test.tsx`
- 工具函数：`*.test.ts`

### 集成测试
- API 路由：`*.test.ts`
- 数据库交互：`*.test.ts`

### E2E 测试
- 关键流程：(`Playwright`)
- 用户交互：(`Playwright`)

---

**最后更新**：2026-06-14
**版本**：v1.0
