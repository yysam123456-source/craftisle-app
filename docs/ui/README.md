# UI 设计规范文档

## 1. 设计系统概览

### 1.1 设计原则
- **简洁优先**: 去除冗余元素，突出核心功能
- **响应式**: 移动端优先，渐进增强
- **无障碍**: WCAG 2.1 AA 标准
- **性能**: 最小化 CSS，使用 Tailwind CSS

### 1.2 技术栈
- **框架**: Tailwind CSS (utility-first)
- **深色模式**: `class` 策略 (`darkMode: ["class"]`)
- **动画**: `tailwindcss-animate` 插件
- **排版**: `@tailwindcss/typography` 插件
- **字体**: Geist Sans / Urban / Heading (CSS 变量)

---

## 2. 颜色规范

### 2.1 主色板 (HSL 变量)
定义在 `app/globals.css` 的 `:root` 和 `.dark` 中：

| 角色 | 浅色模式 | 深色模式 | 用途 |
|------|-----------|-----------|------|
| `--background` | 0 0% 100% (白) | 240 10% 3.9% (近黑) | 页面背景 |
| `--foreground` | 240 10% 3.9% (近黑) | 0 0% 98% (白) | 主文字 |
| `--primary` | 240 5.9% 10% (深灰) | 0 0% 98% (白) | 主按钮、链接 |
| `--primary-foreground` | 0 0% 98% (白) | 240 5.9% 10% (深灰) | 主按钮文字 |
| `--secondary` | 240 4.8% 95.9% (浅灰) | 240 3.7% 15.9% (深灰) | 次按钮背景 |
| `--secondary-foreground` | 240 5.9% 10% (深灰) | 0 0% 98% (白) | 次按钮文字 |
| `--muted` | 240 4.8% 95.9% (浅灰) | 240 3.7% 15.9% (深灰) | 辅助文字背景 |
| `--muted-foreground` | 240 3.8% 46.1% (中灰) | 240 5% 64.9% (浅灰) | 辅助文字 |
| `--accent` | 240 4.8% 95.9% (浅灰) | 240 3.7% 15.9% (深灰) | 强调背景 |
| `--accent-foreground` | 240 5.9% 10% (深灰) | 0 0% 98% (白) | 强调文字 |
| `--destructive` | 0 84.2% 60.2% (红) | 0 84.2% 60.2% (红) | 错误/删除 |
| `--border` | 240 5.9% 90% (灰边) | 240 3.7% 15.9% (深灰边) | 边框 |
| `--ring` | 240 5.9% 10% (深灰) | 240 5% 64.9% (浅灰) | 焦点环 |
| `--radius` | 0.5rem | 0.5rem | 圆角基础值 |

### 2.2 品牌色
- **主色**: 深灰/黑 (`#1a1a1a`) — 用于 CTA 按钮
- **强调色**: 蓝紫 (`#7F77DD`) — 用于链接、图标
- **成功色**: 绿 (`#1D9E75`) — 用于成功提示
- **警告色**: 橙 (`#D85A30`) — 用于警告提示
- **错误色**: 红 (`#E24B4A`) — 用于错误提示

### 2.3 图表色 (`--graph` / `--graph-group` / `--graph-bg`)
- 用于 `recharts` / `chart.js` 等图表库
- 定义见 `globals.css` 的 `.dark` 和 `:root` 块

---

## 3. 字体规范

### 3.1 字体族 (`tailwind.config.ts`)
```typescript
fontFamily: {
  sans: ["var(--font-sans)", ...fontFamily.sans],      // 系统默认无衬线
  urban: ["var(--font-urban)", ...fontFamily.sans],     // Urban 字体
  heading: ["var(--font-heading)", ...fontFamily.sans], // 标题字体
  geist: ["var(--font-geist)", ...fontFamily.sans],     // Geist Sans
}
```

### 3.2 字号阶梯
| 角色 | Tailwind 类 | 像素值 | 用途 |
|------|--------------|--------|------|
| xs | `text-xs` | 12px | 辅助文字、标签 |
| sm | `text-sm` | 14px | 正文、按钮 |
| base | `text-base` | 16px | 默认正文 |
| lg | `text-lg` | 18px | 小标题 |
| xl | `text-xl` | 20px | 卡片标题 |
| 2xl | `text-2xl` | 24px | 页面标题 |
| 3xl | `text-3xl` | 30px | Hero 标题 |

### 3.3 字重
- **400**: 正文
- **500**: 按钮、标签
- **600**: 小标题
- **700**: 页面标题

---

## 4. 间距与布局规范

### 4.1 间距阶梯 (Tailwind)
| 级别 | Tailwind 类 | 像素值 | 用途 |
|-------|--------------|--------|------|
| 1 | `p-1` / `m-1` | 4px | 微小间距 |
| 2 | `p-2` / `m-2` | 8px | 紧凑间距 |
| 3 | `p-3` / `m-3` | 12px | 元素内间距 |
| 4 | `p-4` / `m-4` | 16px | 标准间距 |
| 6 | `p-6` / `m-6` | 24px | 卡片内间距 |
| 8 | `p-8` / `m-8` | 32px | 区块间距 |
| 12 | `p-12` / `m-12` | 48px | 大区块间距 |

### 4.2 容器 (`container`)
```typescript
container: {
  center: true,
  padding: "0.8rem",  // 默认内边距
}
```
- 最大宽度: `1280px` (Tailwind 默认)
- 居中: `center: true`
- 响应式: 自动适配 `sm` / `md` / `lg` / `xl` / `2xl`

### 4.3 圆角 (`--radius`)
- 基础值: `0.5rem` (8px)
- 大圆角: `var(--radius)` (8px)
- 中圆角: `calc(var(--radius) - 2px)` (6px)
- 小圆角: `calc(var(--radius) - 4px)` (4px)

---

## 5. 组件规范

### 5.1 按钮 (Button)
基于 `components/ui/button.tsx` (shadcn/ui):

**变体**:
- `default`: 主按钮 (bg-`primary`)
- `secondary`: 次按钮 (bg-`secondary`)
- `destructive`: 危险按钮 (bg-`destructive`)
- `outline`: 轮廓按钮 (border + hover:bg-`accent`)
- `ghost`: 幽灵按钮 (hover:bg-`accent`)
- `link`: 链接按钮 (text-`primary` + underline)

**尺寸**:
- `default`: `h-10 px-4 py-2`
- `sm`: `h-9 px-3`
- `lg`: `h-11 px-8`
- `icon`: `h-10 w-10`

### 5.2 卡片 (Card)
基于 `components/ui/card.tsx`:
```tsx
<Card className="p-6">
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 内容 */}
  </CardContent>
</Card>
```
- 背景: `bg-card`
- 边框: `border`
- 圆角: `rounded-lg` (var(`--radius`))

### 5.3 对话框 (Dialog)
基于 `components/ui/dialog.tsx` (Radix UI):
- 遮罩: `fixed inset-0 bg-black/80`
- 内容: `fixed z-50 grid w-full max-w-lg bg-background p-6`
- 动画: `fade-in` / `fade-out` (0.4s)

### 5.4 表单 (Input / Textarea / Select)
基于 `components/ui/input.tsx` 等:
- 高度: `h-10` (Input) / `min-h-[80px]` (Textarea)
- 边框: `border-input`
- 焦点: `ring-2 ring-ring`
- 禁用: `disabled:cursor-not-allowed disabled:opacity-50`

### 5.5 工具页布局 (`app/(marketing)/tools/[tool]/page.tsx`)
```tsx
<div className="container mx-auto px-4 py-8">
  <header className="mb-8">
    <h1 className="text-3xl font-bold">{tool.title}</h1>
    <p className="text-muted-foreground mt-2">{tool.description}</p>
  </header>
  
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
    {/* 主工具区 */}
    <ToolClient clientComponent={tool.clientComponent} />
    
    {/* 侧边栏：广告 + 相关工具 */}
    <aside className="space-y-6">
      <AdSlot position="rectangle" />
      <RelatedTools currentTool={tool} />
    </aside>
  </div>
</div>
```

---

## 6. 响应式规范

### 6.1 断点 (Tailwind 默认)
| 断点 | 最小宽度 | 用途 |
|--------|----------|------|
| `sm` | 640px | 平板竖屏 |
| `md` | 768px | 平板横屏 |
| `lg` | 1024px | 笔记本 |
| `xl` | 1280px | 桌面 |
| `2xl` | 1536px | 大屏桌面 |

### 6.2 响应式策略
- **移动端优先**: 默认样式为移动端，用 `sm:` / `md:` 等前缀适配大屏
- **布局**: 移动端单列 → 大屏双列 (`grid-cols-1 lg:grid-cols-[1fr_300px]`)
- **导航**: 移动端汉堡菜单 → 大屏横向导航
- **广告**: 移动端不显示侧边栏广告 → 大屏显示 (`hidden lg:block`)

### 6.3 典型响应式模式
```tsx
{/* 工具页：移动端上下布局，大屏左右布局 */}
<div className="flex flex-col lg:flex-row gap-6">
  <main className="flex-1">
    {/* 工具主功能区 */}
  </main>
  <aside className="w-full lg:w-[300px]">
    <AdSlot position="rectangle" />
  </aside>
</div>
```

---

## 7. 动画规范

### 7.1 动画工具类 (`tailwind.config.ts`)
```typescript
animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
  "fade-up": "fade-up 0.5s",
  "fade-down": "fade-down 0.5s",
  "fade-in": "fade-in 0.4s",
  "fade-out": "fade-out 0.4s",
}
```

### 7.2 动画使用场景
- **Accordion**: 展开/收起 (`animate-accordion-down/up`)
- **页面元素**: 淡入 (`animate-fade-in`)
- **提示消息**: 上滑出现 (`animate-fade-up`)
- **模态框**: 淡入 (`animate-fade-in`)

### 7.3 性能优化
- 使用 `transform` 和 `opacity` (GPU 加速)
- 避免 `height` / `width` 动画（触发布局重排）
- 使用 `will-change: transform` 预优化

---

## 8. 深色模式规范

### 8.1 实现方式
- **策略**: `class` (`darkMode: ["class"]`)
- **切换**: `next-themes` 的 `ThemeProvider`
- **存储**: `localStorage` (`theme` 键)

### 8.2 深色模式颜色
所有颜色在 `:root` (浅色) 和 `.dark` (深色) 中定义两套值：
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  /* ... */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

### 8.3 深色模式切换组件
```tsx
// components/theme-toggle.tsx
'use client'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

---

## 9. 图标规范

### 9.1 图标库
- **Lucide React**: `@nc/ui` 使用的图标库 (`lucide-react`)
- **使用方式**: 直接导入 React 组件
```tsx
import { SunIcon, MoonIcon, MenuIcon } from 'lucide-react'

<SunIcon className="h-5 w-5" />
```

### 9.2 图标尺寸
| 场景 | 尺寸 (Tailwind) | 像素值 |
|------|-------------------|--------|
| 按钮内图标 | `h-4 w-4` | 16px |
| 导航图标 | `h-5 w-5` | 20px |
| 功能图标 | `h-6 w-6` | 24px |
| 大图标 | `h-8 w-8` | 32px |

### 9.3 图标颜色
- 默认: `currentColor` (继承父元素 `color`)
- 强调: `text-primary` / `text-accent`
- 禁用: `text-muted-foreground`

---

## 10. 广告位设计规范

### 10.1 广告组件 (`components/ads/AdSlot.tsx`)
- **支持尺寸**: leaderboard (728x90) / rectangle (300x250) / halfpage (300x600) / responsive
- **一键开关**: `NEXT_PUBLIC_ADSENSE_CLIENT` 环境变量控制
- **加载策略**: 延迟加载 (`lazy` / `defer`)

### 10.2 广告位布局
- **顶部**: Leaderboard (全宽，位于 Header 下方)
- **侧边栏**: Rectangle / Halfpage (300px 宽，工具页右侧)
- **内容底部**: Responsive (全宽，位于工具输出下方)
- **移动端**: 仅显示顶部 Leaderboard (侧边栏隐藏)

### 10.3 广告位样式
```css
/* 广告容器 */
.ad-slot {
  @apply flex items-center justify-center min-h-[100px];
  @apply bg-muted/50 rounded-lg;
  @apply text-muted-foreground text-sm;
}

/* 响应式隐藏 */
@media (max-width: 1024px) {
  .ad-sidebar {
    @apply hidden;
  }
}
```

---

## 11. 设计检查清单

### 11.1 新页面/组件开发前
- [ ] 使用 Tailwind utility class，不写自定义 CSS (除非必要)
- [ ] 颜色使用 CSS 变量 (`bg-primary` 而非 `bg-[#1a1a1a]`)
- [ ] 响应式：移动端优先，测试 `sm` / `md` / `lg` 断点
- [ ] 深色模式：测试浅色/深色两套颜色

### 11.2 提交前
- [ ] 无障碍：所有表单元素有 `<label>` 或 `aria-label`
- [ ] 键盘导航：所有交互元素可用 Tab 聚焦
- [ ] 焦点状态：所有交互元素有 `focus-visible:ring-2`
- [ ] 动画：尊重 `prefers-reduced-motion` (使用 `motion-safe:` 前缀)

### 11.3 性能
- [ ] 图标：使用 Lucide React，不引入图标字体
- [ ] 图片：使用 `next/image`，设置 `width` / `height`
- [ ] 字体：使用 `next/font`，不引入外部字体文件 (除非必要)

---

**更新时间**: 2026-06-03  
**维护人**: Craftisle Team
