/**
 * types.ts
 * 替代品数据类型定义（完整版，与 ALTERNATIVES_MAP / alternatives-import.json 完全匹配）
 */

/** 替代品工具（每个替代品条目） */
export interface AlternativeTool {
  name: string;
  /** fmhy-resources.json 中的资源 id */
  resourceId?: string;
  /** 直接外链（当没有 resourceId 时） */
  url?: string;
  /** 为什么推荐这个替代品（一句话） */
  reason: string;
  /** 替代品的详细介绍（2-3句话） */
  description: string;
  /** 主要功能列表 */
  features: string[];
  /** 优点 */
  pros: string[];
  /** 缺点 */
  cons: string[];
  /** 最适合什么场景/用户 */
  bestFor: string;
  /** 是否免费 */
  isFree: boolean;
  /** 是否开源 */
  isOpenSource: boolean;
  /** 是否支持自部署 */
  isSelfHosted?: boolean;
  /** 迁移难度：Easy / Medium / Hard */
  migrationDifficulty: "Easy" | "Medium" | "Hard";
  /** 评分 1-5 */
  rating: number;
  /** 是否推荐（置顶展示） */
  featured?: boolean;
}

/** 用户痛点 */
export interface PainPoint {
  problem: string;
  impact: string;
}

/** 替代品条目（付费工具 → 免费替代品映射） */
export interface AlternativeEntry {
  /** 付费/主流工具名称 */
  paidTool: string;
  /** 工具的官网 URL */
  paidToolUrl: string;
  /** 一句话描述这个付费工具 */
  tagline: string;
  /** 详细介绍（2-3段） */
  description: string;
  /** 定价信息（月费/年费） */
  pricing: string;
  /** 用户痛点 */
  painPoints: PainPoint[];
  /** 为什么应该考虑替代品 */
  whySwitch: string[];
  /** 免费替代品列表 */
  alternatives: AlternativeTool[];
  /** 从付费工具迁移到替代品的指南 */
  migrationGuide?: {
    steps: string[];
    tips: string[];
  };
  /** 工具分类 */
  category: string;
  /** SEO 关键词 */
  seoKeywords: string[];
  /** FAQ 区块（SEO + 用户决策辅助） */
  faqs: { question: string; answer: string }[];
}
