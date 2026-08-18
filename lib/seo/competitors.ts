/**
 * 竞品词表 + 覆盖度计算
 *
 * 用途：每周 GSC 拉取后，扫描真实查询词是否覆盖竞品相关搜索词，
 * 计算「竞品覆盖度」并检测「覆盖流失」（上周有、本周无），
 * 用于生成 competitor_lost 告警，纳入 section 4「竞争」维度的每周对比。
 *
 * 词表基于 craftisle（免费在线工具平台）的真实竞品整理，分两类：
 *  - 直接竞品品牌（其他免费工具站 / PDF 工具）
 *  - 高意图对比词（"X alternative" 类，craftisle 想抢的搜索地盘）
 */

export interface CompetitorCoverageRow {
  term: string;
  covered: boolean;
  queries: number;
  impressions: number;
}

/** 直接竞品品牌名（用户会搜这些词，craftisle 若出现在结果即「抢到地盘」） */
export const COMPETITOR_BRANDS = [
  "it-tools",
  "tinywow",
  "ilovepdf",
  "pdfcandy",
  "smallpdf",
  "convertio",
  "freeconvert",
  "pdf24",
  "sejda",
  "docsmall",
  "chatpdf",
  "pdfescape",
  "sodapdf",
  "toolfk",
  "craft island",
  "改图鸭",
  "uupoop",
  "极速工具箱",
];

/** 高意图对比词（"X alternative" 类，craftisle 想覆盖的搜索意图） */
export const COMPETITOR_INTENT = [
  "ms project alternative",
  "microsoft project alternative",
  "google workspace alternative",
  "g suite alternative",
  "intellij alternative",
  "notion alternative",
  "figma alternative",
  "canva alternative",
  "photoshop alternative",
  "adobe alternative",
];

export const COMPETITOR_TERMS: string[] = [...COMPETITOR_BRANDS, ...COMPETITOR_INTENT];

/**
 * 计算竞品覆盖度：扫描 GSC 查询词，命中竞品词（子串包含，忽略大小写）即视为覆盖。
 * @param queries GSC 查询词（含 impressions）
 */
export function computeCompetitorCoverage(
  queries: Array<{ query: string; impressions: number }>
): CompetitorCoverageRow[] {
  const lower = queries.map((q) => ({ q: q.query.toLowerCase(), imp: q.impressions }));
  return COMPETITOR_TERMS.map((term) => {
    const t = term.toLowerCase();
    let qCount = 0;
    let imp = 0;
    for (const lq of lower) {
      if (lq.q.includes(t)) {
        qCount += 1;
        imp += lq.imp;
      }
    }
    return { term, covered: qCount > 0, queries: qCount, impressions: imp };
  });
}
