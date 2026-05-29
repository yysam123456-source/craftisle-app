# plan-eng-review: SnapOtter 图像工具集成

**日期**: 2026-05-29
**评审对象**: PRD-001 SnapOtter 工具集成
**状态**: 待用户确认

---

## Step 0: Scope Challenge (范围挑战)

| # | 检查项 | 结果 |
|---|--------|------|
| 1 | 是否可用更简单的替代方案？ | **否** — Sharp 图像处理是最简方案 |
| 2 | 是否有可砍掉的需求？ | **已砍** — content-aware-resize（依赖 CGO）、npm publish（过度工程）|
| 3 | 基础设施能否更轻量？ | **是** — `packages/tool-kit/` 改为 `lib/image-tools/` |
| 4 | 是否过度抽象？ | **否** — 10 个工具需要统一框架 |
| 5 | 数据存储能否避免？ | **是** — 无数据库，纯流式处理 |
| 6 | 能否复用现有结构？ | **是** — 复用已有的 `[tool]/layout.tsx` + `lib/tools.ts` |
| 7 | 是否有隐式耦合风险？ | **已识别** — 需注意与现有纯客户端工具不冲突 |

**结论**: 范围合理，无需缩减。

---

## Section 1: Architecture Review

### 1.1 关键发现：现有系统冲突分析

实地勘察发现 Craftisle **已有完整工具系统**，与 PRD 假设存在冲突：

| PRD 假设 | 实际情况 | 冲突？ |
|----------|---------|--------|
| "目前没有图像处理工具" | 已有 `image-base64` + `image-to-pixel` | ⚠️ 部分冲突 |
| 需要新建 `[toolId]` 动态路由 | 已有 `[tool]/layout.tsx` (SEO 元数据) | ⚠️ 参数名不匹配 |
| 需要建 `packages/tool-kit/` | 项目无 `packages/` 目录 | ℹ️ 需简化 |
| 工具详情页从零开始 | 已有 48 个工具目录 + `ToolsClient` 组件 | ℹ️ 可复用 |
| 需要通用 ToolPage 布局 | 已有 `[tool]/layout.tsx` + Card UI | ℹ️ 可复用 |
| 新工具通过注册表发现 | 现有工具通过**文件系统扫描**发现 | 🔴 **核心冲突** |

**核心冲突**: 现有工具系统通过 `fs.readdirSync()` 扫描目录来发现工具。如果新的服务端图像工具没有自己的目录，就不会出现在工具列表页中。

### 1.2 现有系统架构

```
app/(marketing)/tools/
├── [tool]/layout.tsx          ← SEO 元数据生成器 (已存在，参数名=tool)
├── image-base64/page.tsx       ← 纯客户端 (FileReader)
├── image-to-pixel/page.tsx     ← 纯客户端 (Canvas)
├── ... 46+ 其他工具目录
│
app/api/                        ← 现有 API 路由
├── auth/                       ← (不含任何 tools API)
├── user/
├── webhooks/
│
lib/tools.ts                    ← ToolMeta 接口 + 42 条元数据
components/tools-client.tsx     ← 目录页 UI (基于 toolDirs 数组)
```

**关键约束**:
- `[tool]/layout.tsx` 使用参数名 `tool`（不是 `toolId`）
- `tools/page.tsx` 已过滤 `[tool]` 目录（line 37）
- `ToolsClient` 只展示**同时存在于 filesystem 和 toolMeta 中的工具**（line 25: `if (!meta) return false;`）
- 所有现有工具都是 **use client**，无 API 调用
- `sharp@^0.33.4` 已安装

### 1.3 推荐架构

#### 总体策略：扩展，不替换

```
app/(marketing)/tools/
├── [tool]/
│   ├── layout.tsx               ← (不变) SEO 元数据生成器
│   └── page.tsx                 ← **NEW** 动态工具页 (fallback)
│
├── image-base64/                ← (不变) 现有纯客户端工具
├── image-to-pixel/              ← (不变)
├── ... 46+ 现有工具               ← (不变)
│
app/api/tools/
└── [tool]/
    └── route.ts                 ← **NEW** 图像处理 API 工厂
│
lib/
├── tools.ts                     ← **MODIFIED** 加 "Image" 分类 + 10 条元数据
└── image-tools/                  ← **NEW** 服务端工具定义
    ├── index.ts                 ← 导出 registry + types
    ├── registry.ts              ← ToolDefinition[] — 工具定义数组
    ├── types.ts                  ← 共享类型
    └── process/                  ← 各工具的 Sharp 处理函数
        ├── resize.ts
        ├── crop.ts
        ├── compress.ts
        ├── convert.ts
        ├── rotate.ts
        ├── color-palette.ts
        ├── favicon.ts
        ├── strip-metadata.ts
        ├── info.ts
        └── border.ts
│
components/tools/                ← **NEW** 图像工具 UI 组件
├── image-tool-page.tsx          ← 通用图像工具页 (客户端)
├── image-compare.tsx            ← before-after 对比
├── image-upload.tsx             ← 上传 + 拖拽 + 剪贴板
├── resize-settings.tsx
├── crop-settings.tsx
├── compress-settings.tsx
├── convert-settings.tsx
├── rotate-settings.tsx
├── color-palette-settings.tsx
├── favicon-settings.tsx
├── strip-metadata-settings.tsx
├── info-settings.tsx
└── border-settings.tsx
```

#### 路由解析逻辑（Next.js 内置）

```
/tools/image-base64  →  image-base64/page.tsx        (精确匹配，静态)
/tools/image-to-pixel → image-to-pixel/page.tsx       (精确匹配，静态)
/tools/resize         →  [tool]/page.tsx  (params.tool = "resize")
/tools/crop           →  [tool]/page.tsx  (params.tool = "crop")
/tools/base64         →  base64/page.tsx              (精确匹配，静态)
```

### 1.4 关键设计决策

#### Decision 1: `[tool]/page.tsx` 而非 10 个独立目录

| 方案 | 独立目录 (10个) | 动态路由 (1个) |
|------|----------------|---------------|
| 文件数 | 10 个 page.tsx + 10 个目录 | 1 个 page.tsx |
| 一致性 | 与现有工具一致 | 需兼容层 |
| 维护成本 | 添加工具=新建目录 | 添加工具=注册表加条目 |
| 一致性风险 | 10 个近乎相同的文件 | 单一源 |

**选择**: 动态路由 `[tool]/page.tsx`。虽然添加了一个新模式，但 PRD 的目标就是"新工具接入成本降到 10-30 分钟"，动态路由是实现这个目标的基础。

#### Decision 2: `lib/image-tools/` 而非 `packages/tool-kit/`

**原因**:
- 项目无 monorepo 工具链，加 `packages/` 需要额外配置
- `lib/` 是项目已有的约定（`lib/tools.ts`, `lib/utils.ts`）
- 即使未来需要跨项目复用，提取到独立包也是 30 分钟的工作
- MVP 阶段过度工程化 = 浪费

#### Decision 3: 工具发现机制扩展

**问题**: `ToolsClient` 基于 filesystem 扫描，新图像工具没有目录。

**方案**: 在 `tools/page.tsx` 中合并 filesystem 目录 + image tool IDs：

```typescript
import { imageToolIds } from "@/lib/image-tools";

export default function ToolsPage() {
  let toolDirs = [...]; // 现有 filesystem 扫描

  // 追加动态路由工具
  for (const id of imageToolIds) {
    if (!toolDirs.includes(id)) toolDirs.push(id);
  }

  return <ToolsClient toolDirs={toolDirs} />;
}
```

**改动面**: 只改 `tools/page.tsx`（约 3 行），不碰 `ToolsClient`。

#### Decision 4: API Route 设计

```typescript
// app/api/tools/[tool]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToolDefinition } from "@/lib/image-tools";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  const { tool } = await params;
  const definition = getToolDefinition(tool);
  if (!definition) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // 4MB 硬限制（Vercel free tier body limit = 4.5MB，留 0.5MB buffer）
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Max 4MB." }, { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const params = formData.get("params")
    ? JSON.parse(formData.get("params") as string)
    : {};

  const result = await definition.processFile(buffer, params);

  return new NextResponse(result.buffer, {
    headers: {
      "Content-Type": result.mimeType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
}
```

#### Decision 5: `ToolDefinition` 接口

```typescript
// lib/image-tools/types.ts
export interface ProcessResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  /** Optional: for tools like info that don't output an image */
  metadata?: Record<string, unknown>;
}

export interface ToolDefinition {
  id: string;
  acceptTypes: string[];          // ["image/png", "image/jpeg", "image/webp"]
  maxFileSize: number;            // bytes, default 4MB
  processFile: (
    file: Buffer,
    params: Record<string, any>,
  ) => Promise<ProcessResult>;
}
```

**与 `ToolMeta` 的关系**: `ToolMeta`（在 `lib/tools.ts`）负责展示层元数据（title, desc, icon, category），`ToolDefinition`（在 `lib/image-tools/`）负责运行时行为（文件处理）。两者通过 `id` 关联。

### 1.5 文件改动清单

| # | 文件 | 操作 | 行数 | 说明 |
|---|------|------|------|------|
| 1 | `lib/tools.ts` | 修改 | +15 | 加 "Image" 分类 + 10 条元数据 |
| 2 | `app/(marketing)/tools/[tool]/page.tsx` | 新建 | ~20 | 动态工具页 fallback |
| 3 | `app/api/tools/[tool]/route.ts` | 新建 | ~40 | API Route 工厂 |
| 4 | `lib/image-tools/index.ts` | 新建 | ~5 | 导出 registry + types |
| 5 | `lib/image-tools/types.ts` | 新建 | ~20 | 共享类型 |
| 6 | `lib/image-tools/registry.ts` | 新建 | ~50 | 10 个 ToolDefinition 注册 |
| 7 | `lib/image-tools/process/resize.ts` | 新建 | ~15 | Sharp resize |
| 8 | `lib/image-tools/process/crop.ts` | 新建 | ~15 | Sharp extract |
| 9 | `lib/image-tools/process/compress.ts` | 新建 | ~15 | Sharp toFormat |
| 10 | `lib/image-tools/process/convert.ts` | 新建 | ~15 | Sharp toFormat |
| 11 | `lib/image-tools/process/rotate.ts` | 新建 | ~15 | Sharp rotate |
| 12 | `lib/image-tools/process/color-palette.ts` | 新建 | ~20 | Sharp stats |
| 13 | `lib/image-tools/process/favicon.ts` | 新建 | ~25 | Sharp resize + ico |
| 14 | `lib/image-tools/process/strip-metadata.ts` | 新建 | ~10 | Sharp metadata strip |
| 15 | `lib/image-tools/process/info.ts` | 新建 | ~20 | Sharp metadata read |
| 16 | `lib/image-tools/process/border.ts` | 新建 | ~15 | Sharp extend |
| 17 | `components/tools/image-tool-page.tsx` | 新建 | ~80 | 通用图像工具 UI |
| 18 | `components/tools/image-upload.tsx` | 新建 | ~70 | 拖拽上传组件 |
| 19 | `components/tools/image-compare.tsx` | 新建 | ~60 | before-after 对比 |
| 20 | `app/(marketing)/tools/page.tsx` | 修改 | +3 | 合并 image tool IDs |
| 21 | `package.json` | 修改 | +2 | 加 `react-image-crop` + `browser-image-compression` |

**总计**: 约 21 个文件，~540 行代码（含类型定义）

**1-10 settings components**: 每个工具的参数面板 ~30-80 行，取决于参数复杂度。首批 10 个工具的参数面板合计约 400 行。

### 1.6 组件树设计

```
[每工具的统一组件树]

image-tool-page.tsx ("use client")
├── image-upload.tsx              ← 上传区 (拖拽/点击/剪贴板)
│   └── 预览图
├── [tool]-settings.tsx           ← 参数面板 (每个工具不同)
│   ├── resize-settings  → width, height, fit
│   ├── crop-settings    → x, y, w, h (交互式裁剪)
│   ├── compress-settings → quality, format
│   └── ...
├── 处理按钮 + 状态指示器
└── image-compare.tsx             ← 结果展示 (before/after slider)
    └── 下载按钮 / 复制到剪贴板
```

**数据流**:
```
image-upload → file (File) → image-tool-page 持有
settings → params (object)
点击 Process → POST /api/tools/resize (FormData: file + params)
  → route.ts → registry.find("resize") → resize.processFile(buffer, params)
  → Sharp 处理 → result: { buffer, mimeType, filename }
  → 返回给前端 → image-compare 展示 + 下载
```

### 1.7 依赖分析

| 依赖 | 版本 | 大小 | 用途 | 状态 |
|------|------|------|------|------|
| `sharp` | ^0.33.4 | ~25MB | 服务端图像处理 | ✅ 已安装 |
| `react-image-crop` | ^11.x | ~12KB gzip | crop 工具交互式裁剪 | ❌ 待安装 |
| `browser-image-compression` | ^2.x | ~5KB gzip | 前端预压缩（超 4MB 文件）| ❌ 待安装 |

**Vercel 兼容性**:
- Sharp: ✅ Vercel 预装（Node.js runtime）
- react-image-crop: ✅ 纯 JS，浏览器端
- browser-image-compression: ✅ 纯 JS，浏览器端
- 无需 native/CGO/OpenCV 依赖

### 1.8 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Sharp 版本在 Vercel 上行为不一致 | 低 | 中 | 已有 ^0.33.4，本地测试覆盖 |
| Vercel 10s 超时对大图处理不够 | 中 | 中 | 4MB 文件限制 + 前端预压缩 |
| 动态路由 `[tool]/page.tsx` 与现有布局冲突 | 低 | 高 | 本地 `npm run dev` 验证路由解析 |
| 与现有工具 `[tool]/layout.tsx` 参数名冲突 | 无 | 无 | 参数名已统一为 `tool` |

### 1.9 与 PRD 的差异

| PRD 方案 | 评审后方案 | 原因 |
|----------|-----------|------|
| `[toolId]` 动态路由 | `[tool]/page.tsx` | 与已有 `[tool]/layout.tsx` 参数名一致 |
| `packages/tool-kit/` | `lib/image-tools/` | 无需 monorepo，减复杂度 |
| 通用 ToolPage 布局从零写 | 复用 `[tool]/layout.tsx` SEO + 只写工具内容 | 避免重复 |
| 工具注册表是唯一发现机制 | filesystem + registry 双源合并 | 兼容现有 48 个工具 |
| 新建工具目录页 | 复用 `ToolsClient`，只改 `tools/page.tsx` | 最小改动原则 |

---

## Section 2: 待确认事项

| # | 事项 | 重要性 |
|---|------|--------|
| ✅ | 范围合理，架构可行 | 🔴 |
| ⚠️ | `[tool]/page.tsx` 作为动态 fallback — 确认方向？ | 🔴 |
| ⚠️ | `lib/image-tools/` 而非 `packages/` — 确认？ | 🟡 |
| ⚠️ | 工具目录页扩展方式（合并 imageToolIds）— 确认？ | 🟡 |

---

*本评审由 plan-eng-review 驱动。确认后进入编码阶段。*
