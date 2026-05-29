# PRD-001: SnapOtter 图像工具集成 + 多工具站点编排系统

**版本**: v1.0
**状态**: 已归档 — spec 已输出，待 GitHub issue 创建
**日期**: 2026-05-29
**作者**: 操盘手

---

## 1. 问题陈述

Craftisle 工具站点目前没有图像处理工具。用户需要完成常见的图像操作（调整大小、裁剪、格式转换、压缩、水印等），目前需要跳转到其他网站或下载桌面软件。

同时，SnapOtter 开源项目提供了 49 个精心设计的图像工具，其中 **36 个不依赖 Docker/Python AI 后端**，技术栈与 Craftisle（Next.js + Tailwind + TypeScript）完全兼容，可直接提取复用。

**核心矛盾**：如果只把一个工具糊进去，后续每加一个新工具都是"新项目级"的工作量。必须从一开始就建一套**可扩展的工具编排系统**，让新工具的接入成本降到 10-30 分钟。

---

## 2. 目标

### 2.1 业务目标

| 目标 | 说明 | 衡量 |
|------|------|------|
| **建立可扩展工具站点框架** | 工具目录页 + 通用工具详情页 + 工具注册机制 | 添加新工具只需：注册表加条目 + 写后端处理函数 + 搬运前端组件，不碰基础设施 |
| **首期上线 10 个高价值工具** | resize / crop / compress / convert / rotate / color-palette / favicon / strip-metadata / info / border | 覆盖 80%+ 用户高频图像需求 |
| **工具站点成为 Craftisle 流量入口** | SEO 长尾关键词 + 独立工具页作为 landing page | 上线 1 个月内工具页在搜索结果中出现 |

### 2.2 技术目标

| 目标 | 说明 |
|------|------|
| **零 Docker 依赖** | 无 Python/系统级依赖，纯 Node.js + Sharp 处理 |
| **Sharp 图像引擎复用** | SnapOtter 的 `@snapotter/image-engine` 不改一行直接复用 |
| **通用 API Route 工厂** | 一个工厂函数替代 SnapOtter 的 `createToolRoute`，新工具只需写处理逻辑 |
| **SEO 友好** | 每工具独立 URL (`/tools/resize`)，SSR 首屏，结构化 meta |

---

## 3. 非目标（Non-Goals）

| 非目标 | 原因 |
|--------|------|
| AI 工具（remove-bg, upscale, OCR 等 14 个）| 依赖 Python+Docker，不在本期范围。后期独立 Docker 部署后用 iframe/API 集成 |
| SnapOtter 原版 1:1 克隆 | 我们只取工具处理逻辑和 UI 组件，不搬 SPA 框架 (Vite/Fastify/Konva 编辑器) |
| 多文件批量处理 | 前期只做单文件，批量属于工具功能扩展，每个工具单独评估 |
| 用户上传历史/画廊 | 本版本无数据库，文件处理完即释放 |
| gif-tools / meme-generator / collage 等复杂工具 | 首期不包含，架构设计保证后续可加 |

---

## 4. 用户故事

### P0 — MVP 必须

- **US-01**: 作为普通用户，我上传一张图片，选择"调整大小"，输入宽高，点击处理，**3 秒内**看到结果并下载。
- **US-02**: 作为用户，我在工具目录页能看到所有可用工具，按分类（转换/调整/美化/信息）组织，点击即可进入。
- **US-03**: 作为用户，我在搜索结果（Google）中搜索"在线图片压缩"，Craftisle 的 compress 工具页出现在前十。

### P1 — 重要

- **US-04**: 作为用户，我可以拖拽图片到任意工具页的上传区域。
- **US-05**: 作为用户，处理结果与原图可以 side-by-side 或 before-after 滑动对比。
- **US-06**: 作为开发者，要添加一个新工具（如"亮度调节"），只需写 20 行 Sharp 代码 + 搬运一个 React 组件，不需要改路由/布局/上传逻辑。

### P2 — 锦上添花

- **US-07**: 作为用户，我可以通过 URL 分享某个工具的结果（如 tool/crop?image=xxx&width=200）。
- **US-08**: 工具页支持键盘快捷键（Ctrl+Enter 开始处理）。

---

## 5. 需求分级

### MoSCoW

| 优先级 | 需求 |
|--------|------|
| **Must** | 工具注册表机制、通用 API Route 工厂、`@snapotter/image-engine` 复用、工具目录页、工具详情页模板、文件上传+拖拽、10 个首批工具后端、`/tools/[toolId]` 路由 |
| **Should** | before-after 对比组件、单工具 SEO meta 生成、多分类筛选、工具搜索、工具参数持久化(localStorage) |
| **Could** | 键盘快捷键、结果分享链接、使用计数埋点、Markdown 工具说明页 |
| **Won't** | 用户系统集成（本阶段）、批量处理、AI 工具、历史记录、多语言（先英文） |

---

## 6. 架构设计

### 6.1 整体架构图

```
Craftisle (Next.js + Tailwind)
│
├── app/
│   ├── (marketing)/tools/           ← 工具目录页
│   │   └── page.tsx                 ← /tools — 工具目录
│   ├── api/tools/
│   │   └── [toolId]/route.ts        ← 通用 API 工厂
│   └── (marketing)/tools/
│       └── [toolId]/page.tsx        ← /tools/resize — 工具详情页
│
├── packages/                        ← 新: 工具基础设施包
│   └── tool-kit/
│       ├── registry.ts              ← 工具注册表（ToolRegistryEntry[]）
│       ├── factory.ts               ← API Route 工厂
│       ├── engine/                   ← 从 SnapOtter 搬过来的
│       │   └── ...                  ← @snapotter/image-engine 不修改
│       └── types.ts                 ← 共享类型
│
└── components/tools/                ← 从 SnapOtter 搬过来的工具 UI
    ├── tool-layout.tsx              ← 通用工具页布局（上传区+参数区+结果区）
    ├── image-compare.tsx            ← before-after 对比器
    ├── resize-settings.tsx
    ├── crop-settings.tsx
    ├── compress-settings.tsx
    └── ...
```

### 6.2 核心设计模式：工具注册表

```typescript
// packages/tool-kit/registry.ts

interface ToolDefinition {
  id: string;                    // URL slug: "resize"
  name: string;                  // 显示名: "Image Resize"
  description: string;           // SEO description
  category: ToolCategory;        // "transform" | "adjust" | "beautify" | "convert" | "info"
  icon: string;                  // Lucide icon name
  acceptTypes: string[];         // ["image/png", "image/jpeg", ...]
  Settings: React.ComponentType;  // 参数面板组件
  processFile: (file: Buffer, params: Record<string, any>) => Promise<ProcessResult>;
}
```

**加一个工具 = 写一个 `ToolDefinition` 对象。** 路由、布局、上传、下载全部由基础设施处理。

### 6.3 API Route 工厂

```typescript
// app/api/tools/[toolId]/route.ts
// 一个通用 handler，根据 toolId 查 registry → 调用对应的 processFile

export async function POST(req: Request, { params }: { params: { toolId: string } }) {
  const tool = getTool(params.toolId);
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const toolParams = JSON.parse(formData.get("params") as string);

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await tool.processFile(buffer, toolParams);

  return new Response(result.buffer, {
    headers: {
      "Content-Type": result.mimeType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
}
```

### 6.4 Sharp 简单工具的 processFile 模板

```typescript
// 以 resize 为例 — 几乎所有简单工具都是这个模板
import sharp from "sharp";

export async function resize(buffer: Buffer, params: { width: number; height: number; fit: string }) {
  const image = sharp(buffer);
  const result = await image
    .resize(params.width, params.height, { fit: params.fit as any })
    .toBuffer();

  return { buffer: result, mimeType: "image/png", filename: "resized.png" };
}
```

### 6.5 数据流

```
用户上传图片 → ToolPage 显示预览 → 用户调参数 → 点击"Process"
  → fetch POST /api/tools/resize (FormData: file + params)
  → API Route → registry.lookup("resize") → tool.processFile(buffer, params)
  → Sharp 处理 → 返回 Buffer
  → 前端渲染结果（before-after / side-by-side）+ 提供下载按钮
```

- **无数据库**：文件流式处理，不落盘
- **无需用户系统**：纯工具，不存用户数据
- **文件大小限制**：**4MB**（Vercel 免费版 body limit，硬限制无法绕过）
- **超限处理**：上传前前端用 `browser-image-compression` 预压到 4MB 以内；超过 4MB 提示用户换图或用 URL 模式（二期）

---

## 7. 工具编排界面设计

### 7.1 工具目录页 (`/tools`)

```
┌─────────────────────────────────────────────────────┐
│  🔍 Search tools...                     [分类筛选 ▾] │
├─────────────────────────────────────────────────────┤
│  📐 Transform                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ │
│  │  Resize  │ │   Crop   │ │  Rotate  │ │  ...  │ │
│  │  📏      │ │  ✂️      │ │  🔄      │ │       │ │
│  └──────────┘ └──────────┘ └──────────┘ └───────┘ │
│                                                     │
│  🎨 Adjust                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Compress  │ │Brightness│ │ Contrast │           │
│  └──────────┘ └──────────┘ └──────────┘           │
│                                                     │
│  🔄 Convert                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Convert  │ │ PNG→JPG  │ │ SVG→PNG  │           │
│  └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────┘
```

- 响应式网格，3-4 列桌面端、2 列平板、1 列手机
- 每卡片：图标 + 名称 + 一句话描述
- 搜索框：按名称/描述过滤
- 分类筛选：在下拉或 tab 中

### 7.2 工具详情页 (`/tools/[toolId]`)

```
┌────────────────────────────────────────────────────┐
│  🏠 Tools  ›  Resize                               │  ← 面包屑
├──────────────────┬─────────────────────────────────┤
│                  │  Width:  [800]  px              │  ← 参数面板
│   [Drop Image]   │  Height: [600]  px              │
│   or click       │  Fit: [cover ▼]                 │
│                  │  [Process]                       │
├──────────────────┼─────────────────────────────────┤
│                  │                                 │
│   Before  │ After│  [Download]  [Copy to clipboard] │ ← 结果区
│   ┌──────┐┌──────┐│                                │
│   │      ││      ││
│   └──────┘└──────┘│
└──────────────────┴─────────────────────────────────┘
```

- **桌面端**：左侧上传+预览，右侧参数面板 → 处理完成后下方出结果
- **移动端**：上传区 → 参数区 → 结果区，上下堆叠
- **处理状态**：进度条 + "Processing..." 文字
- **错误状态**：友好的错误提示（文件太大、格式不支持等）

### 7.3 未来多工具扩展规范

后续任何新工具（自己的、第三方的、Docker 独立部署的）接入规则：

| 接入方式 | 适用场景 | 做法 |
|----------|---------|------|
| **内联** (本期) | Sharp 可处理的单文件工具 | ToolDefinition 注册 + processFile + 组件 |
| **API 代理** | 独立部署的工具服务（如未来的 AI 工具） | 注册时标记 `mode: "proxy"` + 配置 endpoint |
| **外部链接** | 完全独立的产品/网站 | 在工具目录页显示为 External Link 卡片 |

---

## 8. 36 个非 Docker 工具清单

### 首批上线 (P0 — 10 个)

| # | 工具 ID | 名称 | 分类 | 复杂度 |
|---|---------|------|------|--------|
| 1 | `resize` | Image Resize | Transform | 简单 |
| 2 | `crop` | Image Crop | Transform | 简单（含交互式裁剪） |
| 3 | `compress` | Image Compress | Adjust | 简单 |
| 4 | `convert` | Format Convert | Convert | 简单 |
| 5 | `rotate` | Rotate & Flip | Transform | 简单 |
| 6 | `color-palette` | Color Palette | Info | 中等 |
| 7 | `favicon` | Favicon Generator | Convert | 中等 |
| 8 | `strip-metadata` | Strip Metadata | Info | 简单 |
| 9 | `info` | Image Info | Info | 简单 |
| 10 | `border` | Add Border | Beautify | 简单 |

### 第二批 (P1 — 14 个)

`watermark-text`, `watermark-image`, `text-overlay`, `qr-generate`, `replace-color`, `color-blindness`, `sharpening`, `optimize-for-web`, `image-to-pdf`, `barcode-read`, `stitch`, `split`, `beautify`, `compose`

### 第三批 (P2 — 12 个)

`meme-generator`, `collage`, `gif-tools`, `svg-to-raster`, `vectorize`, `bulk-rename`, `pdf-to-image`, `find-duplicates`, `compare`, `edit-metadata`, `content-aware-resize`*, `inpaint`*

> * = 有特殊依赖，需单独评估

### 不在此范围 (14 个 AI 工具)

`remove-bg`, `upscale`, `blur-faces`, `erase-object`, `ocr`, `colorize`, `enhance-faces`, `noise-removal`, `smart-crop`, `red-eye-removal`, `restore-photo`, `passport-photo`, `transparency-fixer`, `ai-canvas-expand`

---

## 9. 成功指标

| 指标 | 目标 | 衡量方法 |
|------|------|---------|
| 工具页加载速度 | < 2s FCP | Lighthouse |
| 单工具处理速度 (resize) | < 3s 端到端 | 实际测试 |
| 新工具接入时间 | < 30 分钟（简单工具） | 实际开发计时 |
| 目录页 SEO 索引 | 10 个工具页在 Google 有排名 | Search Console |
| 工具页零错误 | 首批 10 工具无 500/400 | 自测 + QA |

---

## 10. 开放问题

| # | 问题 | 状态 |
|---|------|------|
| Q1 | `content-aware-resize` 依赖 caire (Go 二进制)。保留还是去掉？ | 待定 — P2 再评估 |
| Q2 | crop 工具的交互式裁剪需要 Canvas API（react-image-crop）。与 SnapOtter 原版 Konva 方案不同，需要评估是否自写 | 待定 |
| Q3 | 文件大小限制设多少？Vercel 免费版 body limit = 4.5MB | **确认：限速 4MB**。前端browser-image-compression 预压；超 4MB 提示用户换图或用 URL 模式 |
| Q4 | 首批工具页面写好后，是否需要单独的独立 Landing Page（非 Craftisle 导航内）？ | **不需要**。每个 `/tools/[toolId]` 已是独立 LP，做好 SEO meta 即可；`/tools` 目录页即工具站主 LP |
| Q5 | `@snapotter/image-engine` 是 monorepo 内部包，直接搬 vs 发布 npm？ | **直接搬代码**。`image-engine` 是纯 Sharp 包装器，逻辑稳定，且我们需要定制空间；发 npm 是后续有外部使用者时的事 |

---

## 11. 时间线与里程碑

| 里程碑 | 内容 | 预计 |
|--------|------|------|
| **M1: 基础设施** | 工具注册表 + API Route 工厂 + 通用 ToolPage 布局 + Sharp 引擎搬运 | 1 天 |
| **M2: 首批工具** | 10 个 P0 工具后端 + 前端 + 注册 | 1 天 |
| **M3: 工具目录** | `/tools` 目录页（分类、搜索、卡片网格）+ SEO | 0.5 天 |
| **M4: 对比组件** | before-after slider + side-by-side viewer | 0.5 天 |
| **M5: QA + 部署** | 自测 10 个工具 → gstack qa → ship → Vercel 部署 | 0.5 天 |
| **合计** | | **3.5 天** |

---

## 12. 审批

- [ ] 产品审阅：方案整体方向确认
- [ ] 技术审阅：架构方案确认 → 走 `plan-eng-review`
- [ ] 首批工具范围确认（10 个）
- [ ] 文件大小限制确认（建议 10MB）

---

*本 PRD 由 write-spec 技能驱动生成。审阅通过后进入 gstack/spec 归档 + plan-eng-review 架构评审。*
