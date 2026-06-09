# 资源目录分类导航重构方案

> 制定时间: 2026-06-09  
> 背景: 当前 10,123 资源 205+ 分类仅按 4 个领域分组展示，且目录页隐藏了 202 个非 FMHY 分类，分类详情页无子分类/筛选，用户无法有效导航海量资源。

---

## 一、数据现状

### 1.1 全量数据分布

| 数据源 | 资源数 | 分类数 | 分类ID前缀 | 当前可见性 |
|--------|--------|--------|-----------|-----------|
| FMHY | 6,187 | 14 | 无前缀 | ✅ 可见（14个分类） |
| free-for-dev | 1,232 | 57 | `ffd-*` | ❌ 隐藏（57个分类不可导航） |
| awesome-selfhosted | 1,176 | 83 | `sh-*` | ❌ 隐藏（83个分类不可导航） |
| public-apis | 1,534 | 51 | `pa-*` | ❌ 隐藏（51个分类不可导航） |
| **合计** | **10,129** | **205** | — | **仅14个分类（6.8%）可见** |

### 1.2 核心问题

| 问题 | 严重度 | 描述 |
|------|--------|------|
| **202个分类不可导航** | 🔴 P0 | 数据已存在，但目录页 `DomainCategoryGrid` 只映射了 FMHY 14个分类。其他 202 个分类完全无法从目录页访问 |
| **分类页无子导航** | 🔴 P0 | 每个分类页直接显示 400-500 资源平铺列表 + 简单分页，无子分类分层，无任何筛选/排序 |
| **4大领域过于粗糙** | 🟡 P1 | Baymard 研究表明导航每层 ~10 个选项最优。当前 4 个顶级领域远少于推荐值，层级过浅 |
| **无跨源分类映射** | 🟡 P1 | FMHY 用自然分类名，ffd/sf/pa 用键值（如 `ffd-major-cloud-providers`），缺乏统一分类体系 |
| **无搜索优先导航** | 🟡 P1 | 虽然有搜索框，但仅支持 FMHY 分类内搜索，非全量搜索 |

---

## 二、行业参考方案

### 2.1 AlternativeTo.net（最相似的资源目录站）

**规模**: 50,000+ apps，1,000+ 分类标签  
**导航架构**: 
- **20+ 一级分类**（Communication, Developer Tools, Photos & Graphics...）
- 每个一级下 **5-15 个子分类**
- **标签系统**（tag-based）跨分类交叉引用，如 "Open Source"、"Self-Hosted"、"Free"
- **搜索优先**: 搜索框在 Hero 区域最显眼位置，支持即时建议
- **筛选面板**: 按平台（Windows/Mac/Linux/Web）、许可证、价格

**关键经验**: 
- 分类+标签双维度导航，解决"一个工具属于多个类别"的问题
- 每个工具详情页有 "See also" 关联推荐
- 列表页默认展示最热门/最新资源，分类树在左侧

### 2.2 ProductHunt

**导航架构**:
- 不以严格分类树为主
- **Collections**（编辑精选合集）+ **Topics**（100+ 社区标签）
- **时间维度**（Today / This Week / Featured）作为主要排序
- 搜索框 + 热门标签词云作为入口

**关键经验**:
- 大量资源时，时间维度（最新/本周热门）等同于分类导航
- 合集（Collections）比严格分类树更灵活，可以随时创建

### 2.3 G2 / Capterra（SaaS 目录站）

**导航架构**:
- 左侧树形分类导航（固定 sidebar），3-4 级深度
- 每个分类页面顶部: 子分类卡片网格（带图标+数量）
- 中间: 筛选器（定价/部署方式/用户评分）
- 底部: 产品列表
- 面包屑完整展示层级路径

**关键经验**:
- **子分类卡片优先于产品列表**（Baymard 研究也证实此点）
- 分类层级中保证每层 ≤ 15 个子项
- 搜索 + 筛选 + 排序三件套

### 2.4 OpenAlternative（参考文章）

**导航架构**:
- **Programmatic SEO**: 每个主题一个独立页面
- 模板: 热门对象 → 替代品列表 → 详情 → 适用场景
- 分类+标签+筛选三维导航
- 每个页面都是独立 SEO 单元

**关键经验**:
- "X alternatives" 模板化页面可无限扩展
- 商业化顺应用户查找工具的路径，不打断流程

### 2.5 Baymard 研究（科学 UX 数据）

| 最佳实践 | 当前 Craftisle 状态 |
|----------|-------------------|
| 导航每层 ≤ 10 选项 | ❌ 每层仅4个领域或500个资源 |
| 突出当前所在位置 | ❌ 无面包屑，导航不高亮当前 |
| 子分类缩略图 | ❌ 无子分类结构 |
| 中介页优先展示子分类 | ❌ 中介页直接展示资源列表 |
| 面包屑完整展示路径 | ❌ 无面包屑 |
| 搜索+分类协同 | ❌ 搜索仅限当前分类 |

---

## 三、重构方案

### 3.1 统一分类体系（Phase 1 — 核心）

将 205 个源分类映射为 **12 个顶层领域** × **~40 个中间分类** × **~100+ 个子分类**：

```
📦 All Resources (10,123)

├── 🤖 AI & Machine Learning (1,000+)
│   ├── AI Chat & Assistants (ffd-apis-data-and-ml)
│   ├── Image Generation
│   ├── Text & Writing
│   ├── Code Assistant
│   └── AI Models & Platforms
│
├── 💻 Developer Tools (2,500+)
│   ├── APIs (pa-development, pa-geocoding...)
│   ├── DevOps & Deployment (sh-software-development-*)
│   ├── Code Editors & IDE (ffd-ide-and-code-editing)
│   ├── Testing & QA (ffd-testing)
│   ├── Databases & Storage (ffd-storage-and-media-processing)
│   └── Monitoring & Analytics (ffd-monitoring, sh-analytics)
│
├── ☁️ Cloud & Infrastructure (800+)
│   ├── Cloud Providers (ffd-major-cloud-providers)
│   ├── Self-Hosted Solutions (sh-*)
│   ├── DNS & CDN
│   └── Security & Auth (ffd-security-and-pki)
│
├── 📱 Mobile & Apps (800+)
│   ├── Android Apps
│   ├── iOS Apps
│   ├── Cross-Platform
│   └── App Stores & Alternatives
│
├── 🎮 Gaming & Entertainment (900+)
│   ├── Game Development (sh-games-*)
│   ├── Gaming Tools
│   ├── Emulators & ROMs
│   └── Entertainment Platforms
│
├── 🎵 Audio & Music (700+)
│   ├── Music Streaming
│   ├── Audio Production
│   ├── Audio Editing
│   └── Music Discovery
│
├── 🎬 Video & Streaming (800+)
│   ├── Video Players
│   ├── Streaming Tools
│   ├── Video Editing
│   └── Media Servers (sh-media-streaming-*)
│
├── 🔒 Privacy & Security (700+)
│   ├── Ad Blockers
│   ├── VPN & Proxies
│   ├── Password Managers
│   ├── Encryption Tools
│   └── Privacy Browsers
│
├── 📚 Education & Learning (800+)
│   ├── Online Courses
│   ├── Programming Tutorials
│   ├── eBooks & Reading
│   └── Academic Resources
│
├── 📂 File Management (600+)
│   ├── Cloud Storage
│   ├── File Sharing & Transfer (sh-file-transfer-*)
│   ├── Download Tools
│   ├── Torrent Clients
│   └── Backup Solutions
│
├── 💬 Communication & Social (700+)
│   ├── Email Tools (ffd-email)
│   ├── Team Collaboration (ffd-tools-for-teams-and-collaboration)
│   ├── Social Platforms (pa-social)
│   ├── Messaging
│   └── Forums & Communities (sh-communication-*)
│
└── 🛠️ Utilities & More (1,000+)
    ├── Productivity Tools
    ├── Design & Creative (ffd-design-and-ui)
    ├── Finance & Crypto (pa-cryptocurrency, pa-finance, sh-money-*)
    ├── Government & Open Data (pa-government, pa-open-data)
    ├── Health & Fitness
    └── Other
```

### 3.2 页面架构（Phase 2 — 交互）

**目录首页** `/directory`:
```
Hero: 搜索框（全量搜索）+ 热门标签词云
↓
Source Cards: FMHY | Free for Dev | Self-Hosted | Public APIs（4卡片）
↓
Category Grid: 12个顶层领域卡片（2×6或3×4网格）
  每个卡片: 图标 + 名称 + 子分类数 + 资源总数
  点击进入领域中转页
↓
Curated: Hot Today / Trending / Editor's Picks
```

**领域页** `/directory/domain/[slug]` (新增):
```
面包屑: Home > Directory > AI & ML
↓
领域描述 + 统计
↓
子分类网格 (3-5列, 每个子分类卡片含缩略图+名称+数量)
↓
该领域热门资源 TOP 20
↓
Related Domains
```

**分类页** `/directory/category/[slug]`(强化现有):
```
面包屑: Home > Directory > AI & ML > AI Chat
↓
分类头部: 图标 + 名称 + 描述 + 资源数
↓
子分类卡片 (如果有子分类) → 优先展示
↓
筛选栏: 数据源 | 平台 | 许可证 | 排序（热门/最新/名称）
↓
资源列表: 2列网格 + 分页（20/页）
↓
相关分类
```

**资源详情页** `/directory/resource/[id]` (现有, OK)

**搜索页** `/directory/search` (现有, OK)

### 3.3 技术实现

**STEP 1: 创建统一分类映射表**（`lib/unified-categories.ts`）

```typescript
// 将 205 个源分类映射到统一的 12 领域 / 40 分类 / 100+ 子分类体系中
const CATEGORY_MAP: Record<string, UnifiedCategory> = {
  // FMHY
  "Artificial-Intelligence": { domain: "ai-ml", category: "ai-tools" },
  "Educational": { domain: "education", category: "online-courses" },
  // free-for-dev
  "ffd-apis-data-and-ml": { domain: "ai-ml", category: "ai-models" },
  "ffd-major-cloud-providers": { domain: "cloud-infra", category: "cloud-providers" },
  // awesome-selfhosted
  "sh-analytics": { domain: "dev-tools", category: "monitoring" },
  // public-apis
  "pa-development": { domain: "dev-tools", category: "apis" },
  // ...
};
```

**STEP 2: 重构目录页**

- `DomainCategoryGrid` → `UnifiedCategoryGrid` (展示所有 12 个领域)
- 新增 `/directory/domain/[slug]` 路由
- 新增 `/directory/category/[slug]` 通用分类路由（支持所有 40 个统一分类）
- 现有 `/[category]` 动态路由改为重定向或整合

**STEP 3: 增强分类页**

- 添加 Source 筛选器（FMHY/ffd/sf/pa）
- 添加子分类导航（对接映射表）
- 添加排序选项（按热度/名称/时间）

**STEP 4: 搜索增强**

- 搜索范围从单一分类扩展到全量资源
- 添加过滤芯片（数据源/分类/标签）
- 即时建议 + 分类联想

### 3.4 工作量估算

| 阶段 | 内容 | 预估文件数 | 优先级 |
|------|------|-----------|--------|
| Phase 1 | 统一分类映射表 | 1 新建 | 🔴 P0 |
| Phase 2 | 领域页 + 领域Grid | 2 新建 + 1 修改 | 🔴 P0 |
| Phase 3 | 分类页重构 | 1 修改 + 1 新建 | 🔴 P0 |
| Phase 4 | 搜索增强 | 1 修改 | 🟡 P1 |
| Phase 5 | SEO 页面（alternatives） | 2 新建 | 🟡 P1 |

---

## 四、待办事项对照表

基于对话上下文已有清单，核对所有未完成项：

### 🔴 P0 — 本次必须完成

| ID | 任务 | 状态 | 关联 |
|----|------|------|------|
| P0-1 | 202个非FMHY分类显示隐藏 — 所有分类在目录页可见 | ⏳ 未开始 | 本方案 Phase 1 |
| P0-2 | 统一分类体系（12领域/40分类）替代 4 领域系统 | ⏳ 未开始 | 本方案 Phase 1 |
| P0-3 | 领域中转页 `/directory/domain/[slug]` | ⏳ 未开始 | 本方案 Phase 2 |
| P0-4 | 分类页增加子分类导航 + 筛选器 | ⏳ 未开始 | 本方案 Phase 3 |

### 🟡 P1 — 高优先

| ID | 任务 | 状态 | 关联 |
|----|------|------|------|
| P1-1 | 搜索增强（全量搜索 + 过滤芯片） | ⏳ 未开始 | 本方案 Phase 4 |
| P1-2 | 内容日历自动化执行 | ⏳ 仅策略文档，无工具 | content-strategy.md |
| P1-3 | 友链建设（外链 outreach） | ⏳ 仅策略文档，无执行 | content-strategy.md |
| P1-4 | 竞品分析完整报告（top-10） | ⏳ 仅概要对比表 | content-strategy.md |
| P1-5 | iframe sandbox 修复 | ✅ 已完成 | 2026-06-09 commit |
| P1-6 | Ghost CMS XSS 防护 | ✅ 已完成 | 2026-06-09 commit |
| P1-7 | user-role-form Select bug | ✅ 已完成 | 2026-06-09 commit |

### 🟢 P2 — 增强

| ID | 任务 | 状态 | 关联 |
|----|------|------|------|
| P2-1 | 多语言翻译（14 语言） | ⏳ LanguageSwitcher 存在但无内容 | i18n |
| P2-2 | Giscus 评论系统 | ⏳ 组件可能已创建但未测试 | GitHub Discussions |
| P2-3 | 移动端深度优化（触摸/PWA/速度） | ⏳ 仅基础测试 | 性能 |
| P2-4 | Monetag 广告去重 | ✅ 已完成 | 2026-06-08 commit |
| P2-5 | Newly Added 板块 | ✅ 已删除 | 2026-06-08 commit |
| P2-6 | 内容日历策略文档 | ✅ 已完成 | docs/strategy/ |
| P2-7 | 关键词监控文档（30词） | ✅ 已完成 | docs/strategy/ |
| P2-8 | GSC 验证 meta tag | ✅ 已完成 | layout.tsx |

---

## 五、执行计划

**建议执行顺序（由核心到外围）**:

1. **P0-1 + P0-2**: 统一分类映射表 + 12 领域 Grid → 解决"202 分类不可见"的核心 bug
2. **P0-3 + P0-4**: 领域页 + 分类页重构 → 补全导航层级
3. **P1-1**: 全量搜索增强 → 搜索成为主要发现手段
4. **P1-2/P1-3/P1-4**: 内容+SEO 周边 → 巩固 SEO 基础
5. **P2-1/P2-2/P2-3**: 体验增强 → 锦上添花
