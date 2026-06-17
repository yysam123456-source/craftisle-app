# Craftisle 首页改版 PRD v2.0

**作者**：yysun123-source  
**日期**：2026-06-17  
**状态**：待评审  

---

## 问题陈述

### 现状
1. **首页（`craftisle.com`）和目录页（`craftisle.com/directory`）完全独立**，首页没有展示目录内容，目录流量无法带动首页
2. **首页内容空洞**，只有 Hero + 几个静态卡片，没有实际价值
3. **新站没有社交证明/订阅用户**，照搬 AlternativeTo/ProductHunt 的社区功能没有意义
4. **其他子站（PDF/Resume/Viewer/Games/Draw）没有在首页露出**，流量孤立

### 目标
1. **首页展示实际内容**（目录数据 + 工具 + 游戏），让新用户一眼看懂这个站是干什么的
2. **目录站向首页引流**（从 `/directory` 来的用户，在首页能看到更多内容）
3. **子站之间互相引流**（PDF/Resume/Viewer/Games/Draw 在首页有入口）
4. **SEO 优化**（首页有实质内容，不是空壳）

---

## 非目标

1. **不做社交证明**（社区、点赞、评论 — 新站没有这些内容）
2. **不做订阅转化**（Newsletter、注册 — 新站没有订阅基础）
3. **不改目录页结构**（`/directory` 保持现有设计，只改首页）
4. **不接入 Ghost CMS**（内容静态生成，不依赖动态 CMS）

---

## 用户故事

1. **新用户**（第一次来）："这个站是干什么的？有什么工具可以用？" → Hero + 搜索 + 内容预览
2. **工具寻找者**："我想找 XX 工具" → 搜索框 + 热门分类快捷入口
3. **游戏玩家**："我想玩个小游戏" → 游戏入口（在首页有位置）
4. **返回用户**："上次用的那个 PDF 工具在哪？" → 顶部导航有所有子站入口

---

## 需求

### P0（必须有）

#### 1. Hero 区重构
**现状问题**：现在的 Hero 是 "Unlock Your Creative Potential" + 两个按钮，跟目录站完全没关系

**改后**：
- **价值主张**（一句话）："Free open-source software directory — 16,000+ tools for work & play"
- **搜索框**（置顶，最大视觉焦点）：用户可以立即搜索工具
- **快捷入口**（搜索框下方）：["AI Tools", "Adblock", "Video Editing", "Games"] — 直接跳转到目录对应分类

**设计参考**：
- AlternativeTo 的 Hero："Find alternatives to the products you love" + 搜索框
- 我们的版本："Find free & open-source software for any task" + 搜索框

---

#### 2. 目录内容预览（核心新增）
**目的**：让首页展示实际内容，不是空壳

**板块设计**（3 个行）：
1. **热门分类**（2 行 × 5 个 = 10 个分类卡片）
   - 从 `fmhy-resources.json` 读取，按资源数排序
   - 显示：分类图标 + 名称 + 资源数
   - 点击跳转到 `/directory/<分类名>`
   - 例如：
     ```
     🤖 AI Tools          354 个资源
     🎮 Gaming           1,793 个资源
     📚 Reading          2,309 个资源
     📱 Mobile           1,063 个资源
     🐧 Linux             686 个资源
     ...
     ```

2. **近期更新/热门资源**（1 行 × 6 个）
   - 从 `home-blocks.json` 读取（已经有 `trending-this-week`、`most-compared` 等块）
   - 显示：资源名称 + 描述 + 外链按钮
   - 点击跳转到 `/directory/resource/<id>`
   - 例如：
     ```
     🔥 Trending This Week
     - YouTube Downloader  (视频下载)
     - uBlock Origin       (广告屏蔽)
     - VS Code             (代码编辑器)
     ...
     ```

3. **随机推荐**（每次刷新不一样，增加趣味性）
   - 从 `fmhy-resources.json` 随机取 6 个资源
   - 显示：资源名称 + 一句话描述 + "查看详情" 按钮
   - 目的：让首页"活"起来，每次来都不一样

---

#### 3. 子站入口（跨站引流）
**目的**：让用户在各个子站之间流动

**板块设计**（1 行 × 5 个卡片）：
- **PDF Tools**（`pdf.craftisle.com`）："Free PDF tools — merge, split, compress"
- **Resume Builder**（`resume.craftisle.com`）："Build ATS-friendly resume in minutes"
- **Document Viewer**（`viewer.craftisle.com`）："View PDF/DOCX/PPT online, no download"
- **Games**（`games.craftisle.com`）："Free online games — no download"
- **Whiteboard**（`draw.craftisle.com`）："Online whiteboard for teams"

每个卡片：
- 图标 + 标题 + 一句话描述
- 点击跳转到对应子站（新标签页打开）

---

#### 4. 内置工具快捷入口
**目的**：展示 `craftisle.com/tools/` 下的工具

**板块设计**（1 行 × 3-4 个）：
- **Regex Visualizer**（`/tools/regex-vis`）："Visualize & test regex patterns"
- **Handwriting Animation**（`/tools/handwriting-animation`）："Convert text to handwriting animation video"
- **HTML Visual Editor**（`/tools/html-visual-editor`）："WYSIWYG HTML editor"

每个工具：
- 图标 + 标题 + 一句话描述
- 点击在站内打开

---

### P1（重要，但不阻塞发布）

#### 5. SEO 内容块
**目的**：给搜索引擎看，提高收录

**内容**：
- "What is Craftisle?"（200 字介绍）
- "Popular Categories"（自动生成，从 `fmhy-resources.json` 读取前 10 个分类）
- "Latest Additions"（自动生成，从 Git 历史读取最近添加的资源）

**实现**：
- 直接写在 `app/(marketing)/page.tsx` 里（静态内容）
- 或者用 `getStaticProps` 预渲染（ISR，每小时重新生成）

---

#### 6. 响应式优化
- 桌面端：3 列网格
- 平板端：2 列网格
- 手机端：1 列列表

---

### P2（后续考虑）

#### 7. 个性化推荐（需要登录）
- 根据用户浏览历史推荐工具
- **非目标**：新站没有登录系统，先不做

#### 8. 多语言切换（已有 14 语言）
- 顶部导航已经有语言切换
- 首页内容也要根据语言切换
- **后续考虑**：先确保英文版完整，再处理其他语言

---

## 成功指标

### Leading（过程指标）
1. **首页停留时间** ≥ 60 秒（现在有实质内容，用户会多看一会）
2. **首页 → 目录页跳转率** ≥ 30%（从首页点进目录）
3. **首页 → 子站跳转率** ≥ 15%（从首页点进 PDF/Resume/Games 等）
4. **搜索使用率** ≥ 20%（用户在首页使用搜索框）

### Lagging（结果指标）
1. **自然搜索流量** +20%（首页有实质内容，SEO 更好）
2. **整体跳出率** ≤ 50%（现在有更多页面可以跳转）
3. **子站之间流量共享** ≥ 10%（PDF/Resume/Games 等互相引流）

---

## 开放问题

1. **首页内容更新频率**：
   - 方案 A：静态生成（build 时读取 `fmhy-resources.json`，每次部署更新）
   - 方案 B：ISR（Incremental Static Regeneration，每小时重新生成）
   - 方案 C：客户端动态读取（JSON 文件，每次请求都读最新数据）
   - **建议**：方案 A（简单，适合新站）

2. **"随机推荐"板块是否要保留**：
   - 优点：让首页"活"起来，每次刷新都不一样
   - 缺点：可能导致核心内容（热门分类/热门资源）被挤到下面
   - **建议**：保留，但放在"热门分类"和"近期更新"之后

3. **子站入口是否要放在更显眼的位置**：
   - 现在设计在"目录内容预览"之后
   - 是否要提到前面（Hero 区下方）？
   - **建议**：先按现在的设计，上线后看数据再调整

---

## 时间线（13 天）

| 天 | 里程碑 |
|---|--------|
| 1-2 | 设计稿（Figma 或手绘） |
| 3 | 评审设计稿，确认后动手 |
| 4-7 | 开发：Hero 区重构 + 搜索框 |
| 8-9 | 开发：目录内容预览（3 个板块） |
| 10 | 开发：子站入口 + 内置工具快捷入口 |
| 11 | 开发：SEO 内容块 + 响应式优化 |
| 12 | CloakBrowser 逐页验证（所有板块在所有设备上） |
| 13 | 修复 + 提交 + 推送 + Vercel 部署 |

---

## 附件：首页板块顺序（最终方案）

```
[Hero 区]
  - 价值主张："Find free & open-source software for any task"
  - 搜索框（最大视觉焦点）
  - 快捷入口：["AI Tools", "Adblock", "Video Editing", "Games"]

[板块 1：热门分类]（10 个分类卡片，2 行 × 5 列）
  - 标题："Browse by Category"
  - 内容：从 fmhy-resources.json 读取，按资源数排序

[板块 2：近期更新/热门资源]（6 个资源卡片，1 行 × 6 列）
  - 标题："Trending This Week"
  - 内容：从 home-blocks.json 读取 `trending-this-week` 块

[板块 3：随机推荐]（6 个资源卡片，1 行 × 6 列）
  - 标题："You Might Also Like"
  - 内容：每次刷新随机从 fmhy-resources.json 取 6 个

[板块 4：子站入口]（5 个子站卡片，1 行 × 5 列）
  - 标题："More Free Tools"
  - 内容：PDF/Resume/Viewer/Games/Draw

[板块 5：内置工具快捷入口]（3-4 个工具卡片，1 行 × 3-4 列）
  - 标题："Online Utilities"
  - 内容：Regex Vis/Handwriting Animation/HTML Editor

[SEO 内容块]（静态文本）
  - "What is Craftisle?"
  - "Popular Categories"
  - "Latest Additions"

[Footer]（保持不变）
```

---

## 竞品对标（只参考布局，不照搬功能）

| 竞品 | 可借鉴 | 不借鉴 |
|------|--------|--------|
| AlternativeTo | Hero + 搜索框布局、分类入口 | 社区功能、社交证明 |
| ProductHunt | 时间维度内容（"Trending This Week"） | 投票、评论 |
| G2 | 搜索框置顶、分类浏览 | 企业软件、付费工具 |

---

## 技术实现要点

1. **数据源**：
   - `fmhy-resources.json`（目录数据）
   - `home-blocks.json`（热门资源）
   - 静态配置（子站入口、内置工具）

2. **性能**：
   - 所有数据在 `getStaticProps` 中预读取（build 时）
   - 随机推荐：客户端 JavaScript 动态取（避免每次 build 都一样）

3. **SEO**：
   - 每个板块都有 `<h2>` 标题（搜索引擎喜欢）
   - 随机选择的内容也要有 `<meta>` 标签（避免重复内容惩罚）

---

**下一步**：
1. 你评审这个 PRD v2.0
2. 确认后我画设计稿（Figma 或手绘）
3. 设计稿确认后动手改代码
