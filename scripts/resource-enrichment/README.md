# Craftisle 资源站页面改造方案

## 一、问题诊断

| 数据源 | 资源数 | 空描述 | 低质量描述 | 有Review |
|--------|--------|--------|------------|----------|
| free-for-dev | 1,232 | **100%** | 0 | 0 |
| FMHY | 6,187 | 0 | ~30% | ~10 |
| public-apis | ~1,500 | ~20% | ~40% | 0 |
| awesome-selfhosted | ~300 | ~10% | ~20% | 24 |

**核心问题：**
1. free-for-dev 全部 1232 个资源 description 为空，列表页只显示域名
2. 详情页 "About" 区域大量为空，SEO 标记为低质量（noindex）
3. Review 数据仅 24 个，覆盖率 < 0.3%
4. 页面模板过于依赖外部数据，无数据时展示空洞

---

## 二、解决方案总览

### 策略：三层递进

```
Layer 1: 即时修复（今天可用，零API成本）
  └─ 模板升级 + 现有数据智能提取

Layer 2: 批量填充（1-2天，调用LLM API）
  └─ AI生成描述 + Review数据

Layer 3: 持续运营（长期）
  └─ 自动化pipeline + 用户UGC
```

---

## 三、Layer 1: 即时修复（模板升级）

### 3.1 列表页卡片改造

**文件：** `components/resources/enriched-resource-card.tsx`

**改进点：**

| 模块 | 改造前 | 改造后 |
|------|--------|--------|
| 描述 | 仅 `description` 字段 | 智能提取：freeTier/API信息/GitHub stars |
| 标签 | 仅 "Free" | 数据源特有标签：No Auth · HTTPS · Open Source |
| free-for-dev | 只显示域名 | 提取前2条免费额度展示 |
| 兜底 | 无描述时显示为空 | 自动生成一句话摘要 |

### 3.2 详情页改造

**文件：** `components/resources/resource-detail-enhanced.tsx`

**新增模块：**

```
资源详情页结构
├── Hero（标题、图标、CTA）
├── Quick Facts（分类/成本/网站/GitHub/技术栈 信息卡网格）
├── About（智能描述 + 自动生成摘要）
├── Free Tier Details（free-for-dev 专属：额度明细卡片）
├── API Specifications（public-apis 专属：Auth/HTTPS/CORS 规格）
├── Self-Hosting Details（awesome-selfhosted 专属：开源/自托管信息）
├── Why Use It / What to Know（无Review时的兜底展示）
├── In-Depth Review（有Review时展示AI Review）
└── Related Tools（底部推荐）
```

**关键改进：**

1. **Quick Facts 信息卡网格** —— 始终展示，不依赖任何动态数据
2. **数据源专属模块** —— 根据 `source` 字段自动展示相关规格
3. **无Review兜底** —— 自动生成 "Highlights / What to Know" 卡片，页面不再空洞
4. **描述自动生成** —— 利用 `freeTier`/`auth`/`isOpenSource` 等字段合成摘要

### 3.3 接入方式

```tsx
// app/(marketing)/directory/resource/[id]/page.tsx
// 替换原有 JSX 为增强版组件

import { ResourceDetailEnhanced } from "@/components/resources/resource-detail-enhanced";

// 在 Page 组件中：
return <ResourceDetailEnhanced resource={resource} related={related} review={review} />;
```

列表页同理替换 `ResourceCard` 为 `EnrichedResourceCard`。

---

## 四、Layer 2: 批量数据填充（AI生成）

### 4.1 脚本功能

**文件：** `scripts/resource-enrichment/batch-generate-reviews.py`

**核心能力：**

| 功能 | 说明 |
|------|------|
| 多数据源支持 | free-for-dev / FMHY / public-apis / awesome-selfhosted |
| 智能筛选 | 按描述长度阈值筛选，只处理低质量资源 |
| 双层生成 | 先生成 1-2 句描述，再基于描述生成完整 Review |
| 断点续传 | checkpoint.json 记录已处理ID，中断后可恢复 |
| 错误重试 | 自动处理 RateLimit / NetworkError，指数退避 |
| Manifest 自动更新 | 生成 review 后自动写入 `_manifest.json` |

### 4.2 生成的数据格式

```json
{
  "resourceId": "free-for-dev--bitbucket",
  "resourceName": "Bitbucket",
  "resourceUrl": "https://bitbucket.org",
  "source": "free-for-dev",
  "generatedAt": "2026-06-11T09:00:00.000Z",
  "version": 1,
  "content": {
    "overview": "Bitbucket is Atlassian's Git repository hosting service...",
    "pros": ["Free private repos", "Jira integration", "Built-in CI/CD"],
    "cons": ["Smaller community than GitHub", "Slower feature rollout"],
    "bestUseCases": ["Small teams needing private repos", "Atlassian ecosystem users"],
    "similarAlternatives": ["GitHub", "GitLab", "Codeberg"]
  }
}
```

### 4.3 使用方法

```bash
# 1. 安装依赖
cd craftisle-app
pip install openai

# 2. 设置 API Key
export OPENAI_API_KEY="sk-..."
# 可选：使用第三方API（DeepSeek等）
export OPENAI_BASE_URL="https://api.deepseek.com/v1"
export OPENAI_MODEL="deepseek-chat"

# 3. 预览（不调用API）
python scripts/resource-enrichment/batch-generate-reviews.py \
  --source free-for-dev --limit 10 --dry-run

# 4. 只生成描述（低成本）
python scripts/resource-enrichment/batch-generate-reviews.py \
  --source free-for-dev --limit 100 --only-description

# 5. 只生成Review（需要已有描述）
python scripts/resource-enrichment/batch-generate-reviews.py \
  --source fmhy --min-desc-len 50 --only-review

# 6. 全量处理所有数据源
timeout 3600 python scripts/resource-enrichment/batch-generate-reviews.py \
  --all-sources --limit 500
```

### 4.4 成本估算

| 模型 | 描述生成 | Review生成 | 处理1000个资源总成本 |
|------|----------|------------|---------------------|
| GPT-4o-mini | $0.00006/次 | $0.0003/次 | ~$0.36 |
| GPT-4o | $0.0006/次 | $0.003/次 | ~$3.60 |
| DeepSeek-V3 | ~$0.00002/次 | ~$0.0001/次 | ~$0.12 |

**建议：** 先用 GPT-4o-mini / DeepSeek 跑全量，高流量页面再用 GPT-4o 精修。

---

## 五、实施步骤

### Phase 1: 即时生效（今天）

1. [ ] 复制 `resource-card.tsx` → `enriched-resource-card.tsx`，增强描述逻辑
2. [ ] 在分类列表页和搜索结果页替换卡片组件
3. [ ] 部署验证列表页描述是否正常显示

### Phase 2: 详情页升级（1-2天）

1. [ ] 创建 `resource-detail-enhanced.tsx` 增强版详情页
2. [ ] 修改 `[id]/page.tsx` 接入增强组件
3. [ ] 验证各数据源（ffd/api/selfhosted/fmhy）详情页展示
4. [ ] 检查移动端适配

### Phase 3: 批量填充（2-3天）

1. [ ] 配置 OpenAI API Key
2. [ ] 先跑 free-for-dev 100 个测试，检查质量
3. [ ] 调整 Prompt 模板，确保输出稳定
4. [ ] 全量跑 free-for-dev（1232个）
5. [ ] 筛选 FMHY 中描述 < 50 字符的，批量补充
6. [ ] 跑 public-apis 和 awesome-selfhosted
7. [ ] 重新构建站点，验证页面生成

### Phase 4: 持续优化（长期）

1. [ ] 设置定时任务（每周/每月）扫描新增资源并生成描述
2. [ ] 接入用户反馈：允许用户提交更准确的描述
3. [ ] A/B测试：对比 AI 描述 vs 用户编辑描述 的 SEO 表现

---

## 六、预期效果

| 指标 | 改造前 | 改造后（目标） |
|------|--------|----------------|
| 列表页空描述比例 | ~25% | ~0% |
| 详情页空 About 比例 | ~25% | ~0% |
| 有 Review 的资源数 | 24 | 500+ |
| 低质量 noindex 页面 | ~2000 | < 200 |
| 页面平均内容字数 | ~50 | ~300+ |
| 数据源专属信息展示 | 无 | 全部4个数据源 |

---

## 七、文件清单

```
craftisle-app/
├── components/resources/
│   ├── enriched-resource-card.tsx      # 增强版列表卡片（新增）
│   └── resource-detail-enhanced.tsx    # 增强版详情页（新增）
├── scripts/resource-enrichment/
│   └── batch-generate-reviews.py       # 批量AI生成脚本（新增）
│   └── checkpoint.json                 # 断点记录（运行时生成）
├── public/data/reviews/                # Review JSON 输出目录
│   └── [resource-id].json              # 生成的Review文件
└── docs/resource-enrichment-plan.md    # 本方案文档
```
