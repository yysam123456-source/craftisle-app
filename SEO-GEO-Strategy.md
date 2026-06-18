# Craftisle GEO (AI搜索优化) 策略

## 什么是 GEO？

**GEO = Generative Engine Optimization** (生成式引擎优化)
- 优化内容以被 **AI搜索** (ChatGPT, Perplexity, Claude, Google SGE) 引用
- 传统SEO → 优化 for Google/Bing 蓝链
- GEO → 优化 for AI概览、AI回答、AI训练数据

---

## 为什么 GEO 重要？

### 搜索行为变化 (2024-2026)
- **50%+ 用户** 开始使用 AI 搜索 (ChatGPT, Perplexity, Claude)
- **30%+ 搜索** 在 Google 显示 AI Overview (SGE)
- **传统蓝链点击率下降** 20-30% (因为 AI 直接给出答案)

### Craftisle 的机会
- **工具类查询** 非常适合 AI 回答 (e.g., "best free pdf editor?")
- **教程类内容** 容易被 AI 引用 (e.g., "how to merge pdf free?")
- **对比类内容** AI 喜欢引用 (e.g., "iLovePDF vs free alternative?")

---

## GEO 优化策略

### 策略1：内容结构化（AI易读） 📝

**核心思路**: AI 更喜欢 **结构化、清晰、直接** 的内容。

**执行清单**:
- [ ] **使用 H1/H2/H3 标签** (明确的层次结构)
- [ ] **列表和表格** (AI 容易提取)
- [ ] **FAQ 部分** (直接回答问题)
- [ ] **定义框** ("What is [topic]?" → 40-60词简洁答案)

**示例** (已优化):
- ✅ `/tools` → ItemList schema (AI 容易提取工具列表)
- ✅ `/directory` → CollectionPage schema (AI 理解这是目录)
- ✅ `/compare/[competitor]` → FAQPage schema (AI 容易引用对比)

**待优化**:
- [ ] 所有博客文章 → 添加 "Key Takeaways" 框 (3-5点总结)
- [ ] 所有工具页面 → 添加 "Quick Answer" 框 (40-60词描述)

---

### 策略2：权威性信号（E-E-A-T） 🏆

**核心思路**: AI 优先引用 **权威、可信、有经验** 的来源。

**E-E-A-T 优化清单**:
- [ ] **作者信息** (每个页面显示作者 + 简介)
- [ ] **出版日期** (显示最后更新日期)
- [ ] **引用来源** (链接到权威网站)
- [ ] **用户评价** (添加评分/评论 schema)
- [ ] **品牌提及** (在行业网站提及 Craftisle)

**执行计划**:
1. **添加作者信息** (Week 1)
   - 创建 `/about/team` 页面 (介绍团队成员)
   - 每个博客文章显示作者 + 头像 + 简介
   - 添加 `author` JSON-LD schema

2. **添加出版日期** (Week 1)
   - 每个页面显示 `lastUpdated` 日期
   - 添加 `datePublished` 和 `dateModified` JSON-LD

3. **添加用户评价** (Week 2-3)
   - 在工具页面添加评分功能 (1-5星)
   - 添加 `AggregateRating` JSON-LD schema
   - 显示 "Rated 4.8/5 by 1,200 users"

---

### 策略3：直接回答问题（AI概览优化） 💡

**核心思路**: AI Overview 喜欢 **直接、简洁、完整** 的答案。

**优化方法**:
1. **识别 PAA 问题** (People Also Ask)
   - 使用 AnswerThePublic / AlsoAsked.com
   - 找到与 Craftisle 相关的 PAA 问题

2. **创建 "直接答案" 框**
   - 问题作为 H2/H3
   - 答案在 40-60 词内
   - 使用简洁、直接的语气

3. **添加 FAQ schema**
   - 使用 `FAQPage` JSON-LD
   - 每个问题 + 直接答案

**示例** (待创建):
- [ ] "What is the best free PDF editor?" → 创建 FAQ + 直接答案
- [ ] "How to merge PDF files free?" → 创建 FAQ + 步骤指南
- [ ] "Is iLovePDF free?" → 创建 FAQ + 对比表

---

### 策略4：AI爬虫友好（允许抓取） 🤖

**核心思路**: 确保 AI 爬虫 **可以抓取** 你的内容。

**已优化** (在 `robots.ts`):
- ✅ 允许 GPTBot (ChatGPT)
- ✅ 允许 ChatGPT-User
- ✅ 允许 ClaudeBot
- ✅ 允许 PerplexityBot
- ✅ 允许 Google-Extended (SGE)

**待优化**:
- [ ] 创建 `ai.txt` (可选，类似 robots.txt 给 AI 爬虫)
- [ ] 在页面添加 `data-llm-allow="true"` (实验性)

---

### 策略5：内容新鲜度（定期更新） 📰

**核心思路**: AI 更喜欢 **最新、新鲜** 的内容。

**执行计划**:
1. **定期更新博客文章** (每季度)
   - 添加 "Last updated: [Date]"
   - 更新截图、数据、工具版本

2. **创建 "2026版" 内容** (立即)
   - "Best Free PDF Editor 2026"
   - "Top 10 Free Online Tools 2026"
   - "How to Merge PDF Free (Updated 2026)"

3. **添加时间戳** (立即)
   - 每个页面显示 `lastReviewed` 日期
   - 添加 `dateModified` JSON-LD

---

## GEO 测量指标

### 传统SEO指标 (继续追踪)
- **关键词排名** (Google Search Console)
- **有机流量** (Google Analytics 4)
- **点击率 (CTR)** (GSC)

### GEO新指标 (开始追踪)

#### 1. AI引用次数
- **ChatGPT**: 在 ChatGPT 中搜索 "What is the best free PDF editor?" → Craftisle 被引用？
- **Perplexity**: 在 Perplexity 中搜索相同问题 → 被引用？
- **Claude**: 在 Claude 中提问 → 被引用？

#### 2. AI概述展示次数
- **Google SGE**: 搜索目标关键词 → 你的内容出现在 AI Overview？
- **Bing Copilot**: 搜索目标关键词 → 被引用？

#### 3. 品牌提及次数 (AI推荐)
- **ChatGPT**: "推荐免费PDF工具" → Craftisle 被推荐？
- **Perplexity**: "最好的免费在线工具？" → 被推荐？

---

## GEO 执行时间表

### Week 1-2: 基础优化
- [ ] 所有页面添加作者信息 + 出版日期
- [ ] 所有博客文章添加 "Key Takeaways" 框
- [ ] 所有工具页面添加 "Quick Answer" 框
- [ ] 提交到 Google SGE (等待推出)

### Week 3-4: 内容创建
- [ ] 创建 10 个 FAQ 页面 (直接回答问题)
- [ ] 创建 "2026版" 内容 (更新旧文章)
- [ ] 添加 `AggregateRating` schema (用户评分)

### Month 2: AI爬虫优化
- [ ] 验证 robots.txt 允许所有 AI 爬虫
- [ ] 创建 `ai.txt` (可选)
- [ ] 测试 ChatGPT/Perplexity 是否引用

### Month 3: 测量与迭代
- [ ] 手动测试 50 个关键词 → AI 是否引用？
- [ ] 记录 AI 引用次数 (ChatGPT/Perplexity/Claude)
- [ ] 优化未被引用的内容

---

## GEO 成功指标 (6个月)

### 传统SEO (继续增长)
- **有机流量**: +50% (从 SEO 优化)
- **关键词排名**: 30%+ 目标关键词进入前3位

### GEO新增 (开始追踪)
- **AI引用次数**: 100+ 次/月 (ChatGPT + Perplexity + Claude)
- **AI Overview 展示**: 50+ 个关键词触发 AI Overview
- **品牌提及 (AI推荐)**: 200+ 次/月

### 综合影响
- **总流量增长**: +80% (SEO 50% + GEO 30%)
- **品牌知名度**: +100% (更多人通过 AI 了解 Craftisle)

---

## GEO 内容模板

### 模板1：直接答案框
```markdown
## What is [Topic]? (Quick Answer)

[Topic] is [concise answer in 40-60 words]. It [key benefit] 
and [how it works]. [Why it matters].

**Key Takeaways**:
- ✅ [Point 1]
- ✅ [Point 2]
- ✅ [Point 3]
```

**示例**:
```markdown
## What is Craftisle? (Quick Answer)

Craftisle is a free online tools platform offering 60+ 
browser-based utilities (PDF, image, developer tools). No signup 
required, all processing happens client-side for privacy.

**Key Takeaways**:
- ✅ 100% Free, No Signup
- ✅ Browser-Based (Privacy-First)
- ✅ 60+ Tools (PDF, Image, Developer)
```

---

### 模板2：FAQ 部分
```markdown
## Frequently Asked Questions

### Is [Tool/Software] free?
Yes, [Tool] is 100% free. No signup required. [Details].

### How to use [Tool]?
1. Go to [URL]
2. [Action]
3. [Result]

### Is [Tool] safe?
Yes, [Tool] is safe. [Security details].
```

**示例** (待添加到 `/tools/pdf-merge`):
```markdown
## Frequently Asked Questions

### Is PDF Merge free?
Yes, PDF Merge is 100% free on Craftisle. No signup required.

### How to merge PDF files free?
1. Go to craftisle.com/tools/pdf-merge
2. Upload your PDF files
3. Click "Merge" → Download merged PDF

### Is PDF Merge safe?
Yes, all processing happens in your browser. Files never leave your device.
```

---

### 模板3：对比表 (AI容易引用)
```markdown
## [Tool A] vs [Tool B]: Comparison

| Feature | [Tool A] | [Tool B] |
|---------|------------|------------|
| Price   | Free       | $X/month  |
| Signup  | No         | Yes        |
| Privacy | Client-side| Server-side|

**Winner**: [Tool A] — better for [reason].
```

**示例** (已创建 `/compare/ilovepdf`):
```markdown
## iLovePDF vs Craftisle: Comparison

| Feature | iLovePDF | Craftisle |
|---------|------------|------------|
| Price   | Free/Premium | 100% Free |
| Signup  | Required  | No         |
| Privacy | Server-side| Client-side|

**Winner**: Craftisle — better for privacy-focused users.
```

---

## GEO 工具推荐

### AI引用检测
- **Perplexity.ai** — 手动搜索，看是否引用
- **ChatGPT** — 手动提问，看是否推荐
- **Claude** — 手动提问，看是否引用

### 内容优化
- **AnswerThePublic** — 找到 PAA 问题
- **AlsoAsked.com** — 找到相关追问
- **Semrush / Ahrefs** — 找到 PAA 关键词

### Schema Markup
- **Google Rich Results Test** — 验证 JSON-LD
- **Schema.org** — 查找适合的 schema 类型

---

## GEO 风险与注意事项

### 避免的陷阱
- ❌ **AI Spam** — 不要为了 AI 而生成低质量内容
- ❌ **关键词堆砌** — AI 能识别不自然的写作
- ❌ **隐藏文本** — AI 爬虫也会检查隐藏内容

### 长期策略
- ✅ **用户优先** — 写给用户，不是给 AI
- ✅ **自然写作** — AI 喜欢自然的语气
- ✅ **定期更新** — 保持内容新鲜度

---

## 执行检查清单

### Week 1-2: 基础优化
- [ ] 所有页面添加作者信息
- [ ] 所有页面添加出版日期
- [ ] 所有博客文章添加 "Key Takeaways" 框
- [ ] 所有工具页面添加 "Quick Answer" 框

### Week 3-4: 内容创建
- [ ] 创建 10 个 FAQ 页面
- [ ] 创建 "2026版" 内容
- [ ] 添加用户评分 schema

### Month 2: AI爬虫优化
- [ ] 验证 robots.txt 允许 AI 爬虫
- [ ] 测试 AI 是否引用

### Month 3: 测量与迭代
- [ ] 手动测试 50 个关键词
- [ ] 记录 AI 引用次数
- [ ] 优化未被引用的内容
