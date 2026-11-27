/**
 * 博客 FAQ 抽取（2026-11-27，AdSense 过审）。
 *
 * 背景：44 篇博客正文里**每一篇**都有 FAQ 段，但博客页只输出 BlogPosting schema，
 * 没有 FAQPage ⇒ Google 无法把这些问答呈现成富结果，页面的问答内容对搜索结果无贡献。
 * AdSense 审核会看页面是否具备结构化内容，这个缺口属于「内容未被结构化呈现」。
 *
 * 两种正文格式都要支持（实测 44 篇两种都有）：
 *   A) `## FAQ` / `## Frequently asked questions` 段内，每问是 `**问句**` 加粗行 + 答案段落
 *   B) `## FAQ: 某某` 段内，每问是 `### 问句` 三级标题 + 答案段落
 *
 * 只取 FAQ 段内的内容（遇到下一个 `##` 即停），不会把结论段或 Related tools 混进来。
 */
export interface ExtractedFaq {
  question: string;
  answer: string;
}

export function extractBlogFaqs(raw: string): ExtractedFaq[] {
  if (!raw) return [];

  const heading = raw.match(/^##\s+(?:FAQ\b.*|Frequently asked questions)\s*$/im);
  if (!heading) return [];

  const after = raw.slice(heading.index! + heading[0].length);
  const nextH2 = after.search(/^##\s+/m);
  const section = nextH2 >= 0 ? after.slice(0, nextH2) : after;

  const out: ExtractedFaq[] = [];

  // 格式 B：### 问句
  const h3Re = /^###\s+(.+?)\s*\n([\s\S]*?)(?=\n###\s+|$)/gm;
  let m: RegExpExecArray | null;
  while ((m = h3Re.exec(section)) !== null) {
    const question = m[1].trim();
    const answer = m[2].trim();
    if (question && answer) out.push({ question, answer });
  }
  if (out.length) return out;

  // 格式 A：**问句**
  const boldRe = /^\*\*([^*]+)\*\*\s*\n([\s\S]*?)(?=\n\*\*[^*]+\*\*\s*\n|$)/gm;
  while ((m = boldRe.exec(section)) !== null) {
    const question = m[1].trim();
    const answer = m[2].trim();
    if (question && answer) out.push({ question, answer });
  }
  return out;
}
