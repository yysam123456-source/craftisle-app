# Craftisle Directory 设计系统规范

**版本**: v1.0
**日期**: 2026-06-15
**适用范围**: Craftisle App — Directory 板块所有组件

---

## 1. 卡片组件规范

### 1.1 卡片容器

```css
/* 基础样式 */
.rounded-xl.border.bg-card.p-3.md:p-5.transition-all.duration-200.hover:border-primary/40.hover:shadow-md
```

| 属性 | 值 |
|------|-----|
| 圆角 | `rounded-xl` (12px) |
| 边框 | `border` (1px, border-border) |
| 背景 | `bg-card` |
| 内边距 | `p-3 md:p-5` (12px 移动端 / 20px 桌面端) |
| 过渡 | `transition-all duration-200` |
| Hover 效果 | `hover:border-primary/40 hover:shadow-md` |

### 1.2 卡片标题

| 属性 | 值 |
|------|-----|
| 字号 | `text-lg font-semibold` (18px, 600) |
| 颜色 | `text-card-foreground` |
| 行高 | `leading-tight` |

### 1.3 卡片描述

| 属性 | 值 |
|------|-----|
| 字号 | `text-sm` (14px) |
| 颜色 | `text-muted-foreground` |
| 行高 | `leading-relaxed` |
| 截断 | `line-clamp-2` (最多 2 行) |

---

## 2. 排版规范

### 2.1 页面标题

```css
/* Hero 标题 */
.text-3xl.font-bold.tracking-tight.sm:text-4xl
```

| 属性 | 值 |
|------|-----|
| 字号 | `text-3xl` (30px) 移动端, `sm:text-4xl` (36px) 桌面端 |
| 字重 | `font-bold` (700) |
| 字间距 | `tracking-tight` (-0.025em) |

### 2.2 板块标题

```css
/* 板块标题 */
.text-2xl.font-bold.tracking-tight
```

| 属性 | 值 |
|------|-----|
| 字号 | `text-2xl` (24px) |
| 字重 | `font-bold` (700) |
| 颜色 | `text-foreground` |

### 2.3 板块副标题

```css
/* 板块副标题 */
.text-muted-foreground.text-sm.md:text-base
```

| 属性 | 值 |
|------|-----|
| 字号 | `text-sm` (14px) 移动端, `md:text-base` (16px) 桌面端 |
| 颜色 | `text-muted-foreground` |

---

## 3. 颜色规范

### 3.1 主色

| 用途 | 类名 |
|------|------|
| 主色 | `text-primary` / `bg-primary` |
| 主色悬停 | `hover:text-primary` / `hover:bg-primary/90` |
| 主色边框 | `border-primary/40` |

### 3.2 辅助色

| 用途 | 类名 |
|------|------|
| 背景 | `bg-background` |
| 卡片背景 | `bg-card` |
| 静音文字 | `text-muted-foreground` |
| 边框 | `border-border` |

### 3.3 状态色

| 状态 | 颜色 | 类名 |
|------|------|------|
| 成功 / Free | 绿色 | `text-green-600 border-green-300 bg-green-50` |
| 警告 / 更新 | 黄色 | `text-yellow-600 border-yellow-300 bg-yellow-50` |
| 信息 / 外链 | 蓝色 | `text-blue-600 border-blue-300 bg-blue-50` |
| 紫色 / 特色 | 紫色 | `text-purple-600 border-purple-300 bg-purple-50` |

---

## 4. 间距规范

### 4.1 板块间距

| 位置 | 值 |
|------|-----|
| 移动端板块之间 | `py-12` (48px) |
| 桌面端板块之间 | `md:py-16 lg:py-20` (64px / 80px) |
| 板块内部元素间距 | `space-y-4 md:space-y-6` (16px / 24px) |

### 4.2 卡片间距

| 位置 | 值 |
|------|-----|
| 网格间距 | `gap-4 md:gap-6` (16px / 24px) |
| 卡片内元素间距 | `space-y-3` (12px) |

---

## 5. Badge 规范

### 5.1 Badge 类型

```tsx
// Free Badge
<Badge variant="outline" className="text-green-600 border-green-300">
  ✓ Free
</Badge>

// Open Source Badge
<Badge variant="secondary">
  Open Source
</Badge>

// Hot Badge
<Badge variant="destructive">
  🔥 Hot
</Badge>

// New Badge
<Badge variant="default">
  🆕 New
</Badge>

// Editor's Pick Badge
<Badge variant="outline" className="text-yellow-600 border-yellow-300">
  ⭐ Editor's Pick
</Badge>
```

---

## 6. 按钮规范

### 6.1 按钮尺寸

| 尺寸 | 类名 | 用途 |
|------|------|------|
| 小号 | `size="sm"` | 卡片内部、次要操作 |
| 中号 | `size="default"` | 通用 |
| 大号 | `size="lg"` | CTA、主要操作 |

### 6.2 按钮变体

| 变体 | 类名 | 用途 |
|------|------|------|
| 主要 | `variant="default"` | 主要 CTA（Visit Website） |
| Outline | `variant="outline"` | 次要操作（Compare、More Tools） |
| Ghost | `variant="ghost"` | 图标按钮、查看链接 |

---

## 7. 响应式断点

| 断点 | Tailwind 类 | 宽度 |
|--------|-------------|------|
| 移动端 | 默认（无前缀） | < 640px |
| 小屏桌面 | `sm:` | ≥ 640px |
| 中屏桌面 | `md:` | ≥ 768px |
| 大屏桌面 | `lg:` | ≥ 1024px |

---

## 8. 动画规范

### 8.1 过渡动画

```css
/* 通用过渡 */
.transition-all.duration-200
```

### 8.2 进入动画

```css
/* 淡入 */
.animate-fade-in

/* 向上淡入 */
.animate-fade-up
```

---

## 9. 图标规范

### 9.1 图标尺寸

| 用途 | 尺寸 | Tailwind 类 |
|------|------|--------------|
| 小号图标 | 16×16px | `h-4 w-4` |
| 中号图标 | 20×20px | `h-5 w-5` |
| 大号图标 | 24×24px | `h-6 w-6` |
| 特大图标 | 32×32px | `h-8 w-8` |

---

## 10. 使用检查清单

在开发新组件或修改现有组件时，检查：

- [ ] 卡片使用统一的 `rounded-xl border bg-card p-3 md:p-5` 样式
- [ ] 卡片有 `transition-all duration-200 hover:border-primary/40 hover:shadow-md` 效果
- [ ] 标题使用 `text-lg font-semibold` 或 `text-2xl font-bold`
- [ ] 描述使用 `text-sm text-muted-foreground`
- [ ] 板块间距使用 `py-12 md:py-16 lg:py-20`
- [ ] 响应式使用 `sm:` / `md:` / `lg:` 前缀
- [ ] Badge 使用统一的变体和颜色
- [ ] 按钮使用统一的尺寸和变体
- [ ] 图标使用统一的尺寸

---

**维护者**: AI Assistant
**更新日期**: 2026-06-15
