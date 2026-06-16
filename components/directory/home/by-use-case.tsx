import Link from "next/link";
import { getAllResources, getRichInfoResourceIds, getAllCategories } from "@/lib/fmhy-data";
import { ArrowRight, PenTool, Code, Palette, Megaphone, BookOpen, Wrench, Music, Gamepad, Heart } from "lucide-react";

/**
 * By Use Case — 动态生成 Use Case 板块
 * 从 getAllCategories() 自动归纳 Use Case，不再硬编码
 */

// Use Case 模板：只定义主题关键词，分类和工具都动态匹配
const USE_CASE_TEMPLATES = [
  {
    id: "writing",
    title: "Writing & Notes",
    icon: PenTool,
    color: "blue",
    keywords: ["note", "markdown", "wiki", "knowledge", "writing", "document", "notebook", "obsidian", "notion", "logseq", "joplin"],
  },
  {
    id: "coding",
    title: "Development & DevOps",
    icon: Code,
    color: "purple",
    keywords: ["code", "ide", "editor", "git", "devops", "ci/cd", "docker", "kubernetes", "api", "sdk", "framework", "vscode", "jetbrains"],
  },
  {
    id: "design",
    title: "Design & Creative",
    icon: Palette,
    color: "pink",
    keywords: ["design", "ui", "ux", "figma", "graphic", "image", "photo", "video", "animation", "prototype", "wireframe", "draw"],
  },
  {
    id: "marketing",
    title: "Marketing & Growth",
    icon: Megaphone,
    color: "orange",
    keywords: ["marketing", "seo", "email", "crm", "analytics", "social", "newsletter", "automation", "zapier", "n8n", "hubspot"],
  },
  {
    id: "learning",
    title: "Learning & Education",
    icon: BookOpen,
    color: "green",
    keywords: ["learn", "course", "tutorial", "education", "documentation", "ebook", "mooc", "freecodecamp", "coursera"],
  },
  {
    id: "devops",
    title: "Self-Hosting & DevOps",
    icon: Wrench,
    color: "slate",
    keywords: ["self-host", "docker", "homelab", "server", "nas", "backup", "monitor", "dashboard", "linux", "deployment"],
  },
  {
    id: "media",
    title: "Media & Entertainment",
    icon: Music,
    color: "violet",
    keywords: ["music", "video", "stream", "media", "player", "podcast", "audio", "movie", "game"],
  },
  {
    id: "privacy",
    title: "Privacy & Security",
    icon: Heart,
    color: "red",
    keywords: ["privacy", "security", "encrypt", "password", "vpn", "auth", "2fa", "firewall", "antivirus"],
  },
];

const COLOR_CLASSES: Record<string, string> = {
  blue: "border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 dark:border-blue-800 dark:bg-blue-900/20",
  purple: "border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 dark:border-purple-800 dark:bg-purple-900/20",
  pink: "border-pink-200 bg-pink-50/50 hover:bg-pink-100/50 dark:border-pink-800 dark:bg-pink-900/20",
  orange: "border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 dark:border-orange-800 dark:bg-orange-900/20",
  green: "border-green-200 bg-green-50/50 hover:bg-green-100/50 dark:border-green-800 dark:bg-green-900/20",
  slate: "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-900/20",
  violet: "border-violet-200 bg-violet-50/50 hover:bg-violet-100/50 dark:border-violet-800 dark:bg-violet-900/20",
  red: "border-red-200 bg-red-50/50 hover:bg-red-100/50 dark:border-red-800 dark:bg-red-900/20",
};

/**
 * 动态匹配：从实际分类中找出和模板关键词匹配的分类名称
 */
function matchCategoriesToTemplate(templateKeywords: string[], allCategories: any[]): string[] {
  const matched: string[] = [];
  const lowerKws = templateKeywords.map(k => k.toLowerCase());
  
  for (const cat of allCategories) {
    const catName = (cat.name || cat.id || "").toLowerCase();
    // 分类名称包含任意关键词即匹配
    if (lowerKws.some(kw => catName.includes(kw))) {
      matched.push(cat.name || cat.id);
    }
  }
  return matched;
}

/**
 * 动态生成 Use Case 列表（只保留有内容的）
 */
function generateUseCases() {
  const allResources = getAllResources();
  const allCategories = getAllCategories();
  const richSet = new Set(getRichInfoResourceIds());

  return USE_CASE_TEMPLATES
    .map(template => {
      // 动态匹配相关分类
      const matchedCategories = matchCategoriesToTemplate(template.keywords, allCategories);
      
      // 动态匹配相关工具
      const scored = allResources
        .map(r => {
          const searchText = `${r.name} ${(r.description || "")}`.toLowerCase();
          const catName = (r.categoryName || r.category || "").toLowerCase();
          let score = 0;

          // 名称精确匹配关键词 → 高权重
          for (const kw of template.keywords) {
            if (r.name?.toLowerCase() === kw) { score += 100; break; }
            if (r.name?.toLowerCase().includes(kw)) { score += 50; break; }
          }
          // 描述匹配
          for (const kw of template.keywords) {
            if (searchText.includes(kw)) { score += 15; break; }
          }
          // 分类匹配
          if (matchedCategories.some(c => catName.includes(c.toLowerCase()))) {
            score += 20;
          }

          return { resource: r, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const aRich = richSet.has(a.resource.id) ? 1 : 0;
          const bRich = richSet.has(b.resource.id) ? 1 : 0;
          if (aRich !== bRich) return bRich - aRich;
          return (b.resource.githubStars || 0) - (a.resource.githubStars || 0);
        })
        .slice(0, 4)
        .map(item => ({
          ...item.resource,
          _hasRichInfo: richSet.has(item.resource.id),
        }));

      return {
        ...template,
        preferredCategories: matchedCategories,
        tools: scored,
      };
    })
    // 只保留有工具的 Use Case
    .filter(uc => uc.tools.length > 0)
    // 最多显示 6 个
    .slice(0, 6);
}

export function ByUseCase() {
  const useCases = generateUseCases();

  if (!useCases.length) return null;

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
          {useCases.map(useCase => {
            const Icon = useCase.icon;
            const colorClass = COLOR_CLASSES[useCase.color] || COLOR_CLASSES.blue;

            // View All 链接：用第一个关键词搜索
            const searchQuery = useCase.keywords.slice(0, 3).join(" ");

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

                {/* Tool List */}
                <div className="space-y-2">
                  {useCase.tools.slice(0, 4).map(tool => {
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

                {/* View All Link */}
                <Link
                  href={`/directory/search?q=${encodeURIComponent(searchQuery)}`}
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
