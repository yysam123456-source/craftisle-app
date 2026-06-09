# Craftisle 内容策略 & 友链建设 & 竞品分析

> Last updated: 2026-06-08

---

## 一、内容日历 (Content Calendar)

### 周常发布计划

| 周次 | 内容类型 | 主题方向 | 关键词目标 |
|------|---------|---------|-----------|
| W1 | Tool Review Blog | Top 3 AI 工具深度评测 | "best free AI tools 2026" |
| W2 | How-To Guide | 开发者效率工具对比 | "X vs Y comparison" |
| W3 | Resource Roundup | 本周新收录免费资源 | "free tools weekly roundup" |
| W4 | SEO Landing Page | 长尾关键词专题页 | 9维选品维度 |

### 内容类型矩阵

| 页面类型 | URL 模式 | 内容深度 | 更新频率 | SEO 优先级 |
|---------|---------|---------|---------|-----------|
| 资源详情页 | `/directory/resource/[id]` | AI深评 (200+词) | 月度 | ⭐⭐⭐⭐⭐ |
| 评测博文 | `/blog/review/[slug]` | 深度评测 (800+词) | 周度 | ⭐⭐⭐⭐ |
| 替代品对比 | `/directory/alternatives/[tool]` | 结构化对比 | 月度 | ⭐⭐⭐ |
| 分类导航页 | `/directory/[category]` | 资源列表 | 周度 | ⭐⭐⭐⭐ |
| How-To 指南 | `/blog/how-to/[topic]` | 教程型 | 双周 | ⭐⭐⭐ |
| 工具对比 | `/compare/[competitor]` | 维度对比 | 月度 | ⭐⭐⭐ |

### 待创建内容（高优先级）

1. `/blog/best-free-ai-tools-2026` — AI 工具排行榜
2. `/blog/developer-tools-starter-pack` — 开发者工具箱
3. `/blog/self-hosted-alternatives-guide` — 自托管替代方案
4. `/blog/privacy-first-tools-guide` — 隐私优先工具指南

### 内容质量检查清单

- [ ] 标题含主关键词
- [ ] 200+ 词深度内容
- [ ] JSON-LD 结构化数据
- [ ] 内链 3+ 个相关页面
- [ ] 外链 1+ 个权威来源
- [ ] OG/Twitter 元标签
- [ ] 图片 alt 文本
- [ ] 规范 URL

---

## 二、内部链接策略 (Internal Linking)

### 链接架构

```
首页 (/)
├── 工具 (/tools)
│   └── 工具详情 (/tools/[tool])
├── 游戏 (/games)
│   └── 游戏详情 (/play/[game])
├── 资源目录 (/directory) ← 核心枢纽
│   ├── 分类页 (/directory/[category])
│   ├── 资源详情 (/directory/resource/[id])
│   │   ├── ↔ 评测博文 (/blog/review/[slug])
│   │   ├── ↔ 替代品页 (/directory/alternatives/[tool])
│   │   └── → 相关资源 (Related Resources)
│   ├── 搜索 (/directory/search)
│   └── 收藏 (/directory/favorites)
├── 博客 (/blog)
│   ├── 评测 (/blog/review/[slug])
│   └── 指南 (/blog/how-to/[topic])
└── 法律页 (/privacy, /terms, /disclaimer, /cookie-policy)
```

### 内链实施状态

| 链接方向 | 状态 | 说明 |
|---------|------|------|
| 资源详情 → 评测博文 | ✅ 已实现 | "Read Full Review" 按钮 |
| 评测博文 → 资源详情 | ✅ 已实现 | "View in Resource Directory" 链接 |
| 资源详情 → 相关资源 | ✅ 已实现 | Related Resources 组件 |
| 分类页 → 资源详情 | ✅ 已实现 | ResourceCard 链接 |
| 详情页 → 替代品页 | 🔜 待实现 | 当资源有替代品时展示 |
| 博客 → 分类页 | 🔜 待实现 | 文章底部推荐链接 |
| 工具页 → 资源目录 | 🔜 待实现 | 相关免费工具推荐 |

### 内链最佳实践

- 每个详情页至少 3 个内部链接
- 使用描述性锚文本（非"点击这里"）
- 关键页面距首页 3 次点击以内
- 面包屑导航已实现

---

## 三、外链建设策略 (Link Building)

### 目标：每月获取 3-5 个高质量外链

### 策略 1：资源目录收录（最有效）
- 提交到 GitHub awesome 列表
- 提交到 Product Hunt, AlternativeTo, Slant
- 目标：每月 2 个新收录

### 策略 2：Guest Post / 合作
- 在 DEV.to, Hashnode, Medium 发布工具评测
- 引用 Craftisle 资源目录
- 目标：每月 1 篇

### 策略 3：社区参与
- Reddit r/InternetIsBeautiful, r/webdev
- Hacker News Show HN
- Twitter/X 开发者社区
- 目标：每周 2-3 次有意义的参与

### 策略 4：工具创建者外联
- 联系被收录工具的开发者
- 请求社交媒体分享或官网链接
- 目标：每月联系 5 个工具创建者

### 自然外链吸引点

已创建的高价值内容：
1. 6,000+ 免费资源目录（独一无二的聚合）
2. AI 深度评测（24 篇手写内容）
3. 多源数据聚合（4 个 GitHub awesome 列表）

---

## 四、竞品分析 (Top 10 Competitors)

### 直接竞品（免费资源目录）

| # | 网站 | 月流量 | 优势 | 劣势 | 差异化策略 |
|---|------|--------|------|------|-----------|
| 1 | **fmhy.net** | ~2M | 社区驱动，资源最全 | UI 差，SEO 弱 | ✅ 更好的UI和SEO结构 |
| 2 | **alternativeTo.net** | ~6M | 用户评论，众包 | 非免费专，商业模式重 | ✅ 100% 免费定位 |
| 3 | **slant.co** | ~500K | 对比投票 | 更新慢，UX 老旧 | ✅ 实时更新+AI评测 |
| 4 | **producthunt.com** | ~8M | 社区热度，流量大 | 新品为主，非资源库 | ✅ 长期资源库 |
| 5 | **saashub.com** | ~400K | SaaS 对比 | 商业导向 | ✅ 免费开源导向 |
| 6 | **stackshare.io** | ~1.5M | 企业技术栈 | 开发者专属 | ✅ 全领域覆盖 |
| 7 | **libhunt.com** | ~200K | 开源项目追踪 | 纯开源，覆盖窄 | ✅ 免费+开源+商业 |
| 8 | **free-for.dev** | ~100K | GitHub 列表 | 只有列表，无体验 | ✅ 结构化展示 |
| 9 | **github.com/ripienaar/free-for-dev** | Stars 90K+ | GitHub 生态 | 纯 README | ✅ 完整Web体验 |
| 10 | **toolfinder.co** | ~50K | 现代 UI | 资源量小 | ✅ 体量优势 |

### 竞争优势总结

| 维度 | Craftisle | 竞品平均 | 优势 |
|------|-----------|---------|------|
| 资源数量 | 10,129 | ~3,000 | ⭐⭐⭐⭐⭐ |
| 数据源 | 4 个 | 1 个 | ⭐⭐⭐⭐⭐ |
| SEO 结构 | 3,150 独立页面 | ~200 | ⭐⭐⭐⭐⭐ |
| AI 内容 | 24 篇深评 | 0 | ⭐⭐⭐⭐⭐ |
| 多语言 | 🔜 10 语言 | 1-2 | ⭐⭐⭐⭐ |
| 移动端 | ✅ | 部分 | ⭐⭐⭐⭐ |
| 社区功能 | 🔜 收藏 | 评论/投票 | ⭐⭐⭐ |

---

## 五、多语言支持 (i18n) 基础

### 实施计划（参考 pdf.craftisle.com 14语言方案）

**Phase 1: 代码层准备** （本周）
- [x] 安装 next-intl 或类似方案
- [ ] 提取可翻译字符串
- [ ] 语言切换器组件

**Phase 2: 翻译覆盖**
- [ ] 界面 UI 文本（菜单、按钮、标签）
- [ ] SEO meta 标签（title/description 模板）
- [ ] 资源描述（机器翻译 + 人工审核）

**目标语言（10种）**:
en, zh, ja, ko, es, fr, de, pt, ar, id

### 技术方案
```
src/
├── i18n/
│   ├── messages/
│   │   ├── en.json
│   │   ├── zh.json
│   │   └── ...
│   └── routing.ts
└── middleware.ts (locale detection)
```

---

## 六、用户评论/评分系统

### 方案评估

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Giscus** (GitHub Discussions) | 免费、零数据库、已有GitHub | 需GitHub账号 | ⭐⭐⭐⭐⭐ |
| Disqus | 功能全 | 广告、慢、隐私问题 | ⭐⭐ |
| 自建 (Prisma + Neon) | 完全控制 | 开发成本高 | ⭐⭐⭐ |
| Waline | 轻量、可自托管 | 需服务端 | ⭐⭐⭐ |

### 推荐：Giscus
- 免费：基于 GitHub Discussions API
- 零维护：无需数据库
- SEO 友好：评论内容可被搜索引擎索引
- 隐私友好：无追踪

---

## 七、GSC 集成 & 关键词监控

### Google Search Console
- **域名验证**：用 TXT 记录或 HTML 文件验证 craftisle.com
- **Sitemap 提交**：`https://craftisle.com/sitemap.xml`
- **索引状态监控**：关注 3,150 个资源页面的索引率
- **关键词排名**：每周导出 Search Analytics 报告

### 关键词监控清单
1. "free resource directory"
2. "free tools list"
3. "best free AI tools"
4. "free developer tools"
5. "free self-hosted software"
6. "free public APIs"
7. "open source tools directory"
8. "free privacy tools"
9. "free cloud storage tools"
10. "no signup free tools"

### 长尾词矩阵（9维选品）
| 维度 | 示例查询 | 目标页面 |
|------|---------|---------|
| 用途 | "free image editing tools" | /directory/design-tools |
| 平台 | "free windows tools" | /directory?platform=windows |
| 用户 | "free student tools" | /directory?audience=students |
| 技术栈 | "free node.js tools" | /directory?tech=nodejs |
| 价格 | "completely free alternatives" | /directory/alternatives/* |
| 对比 | "X vs Y free alternative" | /compare/* |
| 场景 | "free tools for remote work" | /blog/how-to/remote-tools |
| 开源 | "open source alternatives to X" | /directory?license=oss |
| 新手 | "best free tools for beginners" | /blog/beginners-guide |
