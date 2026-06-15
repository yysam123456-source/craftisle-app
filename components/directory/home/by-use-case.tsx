import Link from "next/link";
import { getAllResources, getRichInfoResourceIds } from "@/lib/fmhy-data";
import { ArrowRight, PenTool, Code, Palette, Megaphone, BookOpen } from "lucide-react";

/**
 * By Use Case — 任务导向的工具浏览
 * 对标 TAAFT (Thousands of AI Tools)
 * 展示 5 个核心 Use Case，每个展示 3-4 个热门工具
 */

// Use Case 配置
const USE_CASES = [
  {
    id: "writing",
    title: "Writing & Notes",
    icon: PenTool,
    color: "blue",
    description: "Notion alternatives, Markdown editors, note-taking apps",
    keywords: ["notion", "obsidian", "logseq", "markdown", "notes", "writing"],
  },
  {
    id: "coding",
    title: "Development & DevOps",
    icon: Code,
    color: "purple",
    description: "VS Code extensions, GitHub alternatives, self-hosted CI/CD",
    keywords: ["vscode", "github", "gitlab", "docker", "kubernetes", "ide"],
  },
  {
    id: "design",
    title: "Design & Creative",
    icon: Palette,
    color: "pink",
    description: "Figma alternatives, open-source design tools, Image editors",
    keywords: ["figma", "gimp", "inkscape", "design", "ui", "ux", "photo"],
  },
  {
    id: "marketing",
    title: "Marketing & Growth",
    icon: Megaphone,
    color: "orange",
    description: "Free CRM, email marketing, SEO tools, social media management",
    keywords: ["crm", "mailchimp", "hubspot", "marketing", "seo", "email"],
  },
  {
    id: "learning",
    title: "Learning & Education",
    icon: BookOpen,
    color: "green",
    description: "Free courses, tutorials, documentation, e-learning platforms",
    keywords: ["freecodecamp", "coursera", "edx", "learning", "course", "tutorial"],
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
    
    // 根据关键词匹配工具
    const matchedTools = resources
      .filter(r => {
        const searchText = `${r.name} ${r.description}`.toLowerCase();
        return useCase.keywords.some(kw => searchText.includes(kw));
      })
      .sort((a, b) => {
        const aRich = richSet.has(a.id) ? 1 : 0;
        const bRich = richSet.has(b.id) ? 1 : 0;
        if (aRich !== bRich) return bRich - aRich;
        return (b.githubStars || 0) - (a.githubStars || 0);
      })
      .slice(0, 4)
      .map(r => ({ ...r, _hasRichInfo: richSet.has(r.id) }));
    
    return {
      ...useCase,
      tools: matchedTools,
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

                {/* View All Link */}
                <Link
                  href={`/directory/use-case/${useCase.id}`}
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
