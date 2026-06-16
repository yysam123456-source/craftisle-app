import Link from "next/link";
import { getAllResources, getRichInfoResourceIds } from "@/lib/fmhy-data";
import { ArrowRight, PenTool, Code, Palette, Megaphone, BookOpen } from "lucide-react";

/**
 * By Use Case — 任务导向的工具浏览
 * 对标 TAAFT (Thousands of AI Tools)
 * 展示 5 个核心 Use Case，每个展示 3-4 个热门工具
 */

// Use Case 配置 — 每个用例包含精确关键词 + 分类白名单
const USE_CASES = [
  {
    id: "writing",
    title: "Writing & Notes",
    icon: PenTool,
    color: "blue",
    description: "Notion alternatives, Markdown editors, note-taking apps",
    // 精确匹配：优先匹配这些具体工具名/产品名
    primaryKeywords: ["notion", "obsidian", "logseq", "joplin", "standard notes", "appflowy", "siyuan", "affine"],
    // 宽泛匹配：用于补充结果（需要更高的相关性）
    secondaryKeywords: ["markdown editor", "note taking", "note-taking", "knowledge base", "wiki"],
    // 偏好分类（来自 unified-categories 的 categoryId）
    preferredCategories: [],
  },
  {
    id: "coding",
    title: "Development & DevOps",
    icon: Code,
    color: "purple",
    description: "VS Code extensions, GitHub alternatives, self-hosted CI/CD",
    primaryKeywords: ["vscode", "github", "gitlab", "docker", "kubernetes", "vs code", "cursor", "windsurf", "jetbrains", "intellij"],
    secondaryKeywords: ["ide", "code editor", "ci/cd", "devops", "version control", "source control"],
    preferredCategories: [],
  },
  {
    id: "design",
    title: "Design & Creative",
    icon: Palette,
    color: "pink",
    description: "Figma alternatives, open-source design tools, Image editors",
    primaryKeywords: ["figma", "gimp", "inkscape", "canva", "penpot", "photopea", "excalidraw", "tldraw"],
    secondaryKeywords: ["design tool", "ui design", "image editor", "graphic design", "wireframe", "prototype"],
    preferredCategories: [],
  },
  {
    id: "marketing",
    title: "Marketing & Growth",
    icon: Megaphone,
    color: "orange",
    description: "Free CRM, email marketing, SEO tools, social media management",
    primaryKeywords: ["mailchimp", "hubspot", "crm", "mailchimp", "sendgrid", "hootsuite", "buffer", "zapier", "n8n", "metabase"],
    secondaryKeywords: ["email marketing", "seo tool", "social media", "analytics", "automation", "newsletter"],
    preferredCategories: [],
  },
  {
    id: "learning",
    title: "Learning & Education",
    icon: BookOpen,
    color: "green",
    description: "Free courses, tutorials, documentation, e-learning platforms",
    primaryKeywords: ["freecodecamp", "coursera", "edx", "khan academy", "udemy", "codecademy", "odin project", "brave browser"],
    secondaryKeywords: ["e-learning", "online course", "programming tutorial", "mooc", "documentation platform"],
    // 教育类资源在 FMHY 中主要分布在 Reading 和 Educational 分类
    preferredCategories: ["Reading", "Educational"],
  },
];

// 颜色映射
const COLOR_CLASSES = {
  blue: "border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 dark:border-blue-800 dark:bg-blue-900/20",
  purple: "border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 dark:border-purple-800 dark:bg-purple-900/20",
  pink: "border-pink-200 bg-pink-50/50 hover:bg-pink-100/50 dark:border-pink-800 dark:bg-pink-900/20",
  orange: "border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 dark:border-orange-800 dark:bg-orange-900/20",
  green: "border-green-200 bg-green-50/50 hover:bg-green-100/50 dark:border-green-800 dark:bg-green-900/20",
};

export function ByUseCase() {
  // 为每个 Use Case 获取相关工具
  const useCasesWithTools = USE_CASES.map(useCase => {
    const resources = getAllResources();
    const richSet = getRichInfoResourceIds();

    // 改进的匹配逻辑：
    // 1. primaryKeywords 精确匹配（产品名）— 高权重
    // 2. secondaryKeywords 宽泛匹配（描述性词）— 低权重
    // 3. preferredCategories 分类白名单 — 额外加权
    const scored = resources
      .map(r => {
        const searchText = `${r.name} ${r.description}`.toLowerCase();
        const catName = (r.categoryName || r.category || "").toLowerCase();
        let score = 0;
        let matchType = "";

        // Primary keywords: 精确产品名匹配（高权重）
        for (const kw of useCase.primaryKeywords) {
          if (r.name.toLowerCase() === kw) { score += 100; matchType = "exact"; }
          else if (r.name.toLowerCase().includes(kw)) { score += 60; matchType = "primary"; }
          else if (searchText.includes(kw)) { score += 20; matchType = matchType || "primary-desc"; }
        }

        // Secondary keywords: 描述性匹配（低权重，避免误匹配）
        if (score === 0) {
          for (const kw of useCase.secondaryKeywords) {
            if (searchText.includes(kw)) { score += 8; matchType = "secondary"; }
            // 如果 secondary keyword 出现在名称中，稍微加一点分
            if (r.name.toLowerCase().includes(kw.split(" ")[0])) { score += 5; }
          }
        }

        // Preferred category bonus
        if (useCase.preferredCategories.length > 0 && score > 0) {
          for (const pc of useCase.preferredCategories) {
            if (catName.includes(pc.toLowerCase())) { score += 15; break; }
          }
        }

        return { resource: r, score, matchType };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => {
        // 先按分数排序
        if (b.score !== a.score) return b.score - a.score;
        // 同分时优先有丰富信息的
        const aRich = richSet.has(a.resource.id) ? 1 : 0;
        const bRich = richSet.has(b.resource.id) ? 1 : 0;
        if (aRich !== bRich) return bRich - aRich;
        // 再按 GitHub Stars
        return (b.resource.githubStars || 0) - (a.resource.githubStars || 0);
      })
      .slice(0, 4)
      .map(item => ({ ...item.resource, _hasRichInfo: richSet.has(item.resource.id) }));

    return {
      ...useCase,
      tools: scored,
    };
  });

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Tools by Use Case
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find exactly what you need — organized by how you'll use it
          </p>
        </div>

        {/* Use Case Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {useCasesWithTools.map(useCase => {
            const Icon = useCase.icon;
            const colorClass = COLOR_CLASSES[useCase.color] || COLOR_CLASSES.blue;
            
            return (
              <div
                key={useCase.id}
                className={`rounded-xl border p-5 transition-all hover:shadow-md ${colorClass}`}
              >
                {/* Header: Icon + Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-${useCase.color}-100 dark:bg-${useCase.color}-900/30`}>
                    <Icon className={`h-5 w-5 text-${useCase.color}-600 dark:text-${useCase.color}-400`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{useCase.title}</h3>
                    <p className="text-xs text-muted-foreground">{useCase.tools.length} tools</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {useCase.description}
                </p>

                {/* Tool List */}
                <div className="space-y-2">
                  {useCase.tools.slice(0, 3).map(tool => {
                    const href = tool._hasRichInfo
                      ? `/directory/resource/${tool.id}`
                      : tool.url || '#';
                    
                    return (
                      <Link
                        key={tool.id}
                        href={href}
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        target={tool._hasRichInfo ? undefined : "_blank"}
                        rel={tool._hasRichInfo ? undefined : "noopener noreferrer"}
                      >
                        <span>{tool.icon || '🔧'}</span>
                        <span className="font-medium">{tool.name}</span>
                        {tool.githubStars && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            ⭐ {tool.githubStars.toLocaleString()}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* View All Link — 只用 primaryKeywords 搜索，避免太宽泛导致 0 结果 */}
                <Link
                  href={`/directory/search?q=${encodeURIComponent(useCase.primaryKeywords.join(" "))}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mt-3"
                >
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
