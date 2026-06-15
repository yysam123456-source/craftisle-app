import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllCategories, getAllResources } from "@/lib/fmhy-data";

/**
 * Dynamic Scenario Cards — auto-generated from FMHY data
 * Extracts popular categories and creates scenario-based entry points
 * No hardcoded data — fully automated!
 */

// 场景配置：从分类自动生成场景卡片
function generateScenarioCards() {
  const categories = getAllCategories(); // 获取所有分类
  const resources = getAllResources();
  
  // 按资源数量排序，取前12个热门分类
  const topCategories = categories
    .map(cat => ({
      ...cat,
      count: resources.filter(r => r.category === cat.id).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  const SCENARIO_TEMPLATES = {
    'Artificial-Intelligence': {
      icon: '🤖',
      title: 'Find AI Assistant',
      description: 'ChatGPT, Claude, Gemini - which one fits you?',
      color: 'blue'
    },
    'Adblock': {
      icon: '🛡️',
      title: 'Find Privacy Tools',
      description: 'Ad blocking, encrypted messaging, anonymous browsing',
      color: 'red'
    },
    'Gaming': {
      icon: '🎮',
      title: 'Find Gaming Tools',
      description: 'Game recording, mods, emulators, gaming utilities',
      color: 'pink'
    },
    'Reading': {
      icon: '📚',
      title: 'Find Learning Resources',
      description: 'Free courses, tutorials, documentation, e-books',
      color: 'yellow'
    },
    'Downloading': {
      icon: '⬇️',
      title: 'Find Download Tools',
      description: 'Download managers, torrent clients, file sharing',
      color: 'orange'
    },
    'Linux': {
      icon: '🐧',
      title: 'Find Open Source Tools',
      description: 'Self-hosted, customizable, privacy-friendly',
      color: 'green'
    },
    'Misc': {
      icon: '🔧',
      title: 'Find Utility Tools',
      description: 'System tools, file converters, productivity enhancers',
      color: 'gray'
    }
  };
  
  // 为每个分类生成场景卡片
  return categories.map(cat => {
    const template = SCENARIO_TEMPLATES[cat.id] || {
      icon: '🔧',
      title: `Find ${cat.name} Tools`,
      description: `Browse ${cat.count} free ${cat.name.toLowerCase()} resources`,
      color: 'gray'
    };
    
    return {
      ...template,
      href: `/directory/best/${cat.slug || cat.id.toLowerCase()}`,
      cta: 'View Recommendations',
      count: cat.count
    };
  }).slice(0, 6); // 最多6个卡片（简化，减少认知负担）
}

const COLOR_CLASSES = {
  blue: "border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 dark:border-blue-800 dark:bg-blue-900/20",
  red: "border-red-200 bg-red-50/50 hover:bg-red-100/50 dark:border-red-800 dark:bg-red-900/20",
  pink: "border-pink-200 bg-pink-50/50 hover:bg-pink-100/50 dark:border-pink-800 dark:bg-pink-900/20",
  yellow: "border-yellow-200 bg-yellow-50/50 hover:bg-yellow-100/50 dark:border-yellow-800 dark:bg-yellow-900/20",
  orange: "border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 dark:border-orange-800 dark:bg-orange-900/20",
  green: "border-green-200 bg-green-50/50 hover:bg-green-100/50 dark:border-green-800 dark:bg-green-900/20",
  gray: "border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 dark:border-gray-800 dark:bg-gray-900/20",
  purple: "border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 dark:border-purple-800 dark:bg-purple-900/20",
};

export function ScenarioCardsDynamic() {
  const cards = generateScenarioCards();
  
  if (cards.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card, index) => (
        <Link
          key={card.href}
          href={card.href}
          className="group block"
        >
          <Card className={`h-full transition-all hover:shadow-md ${COLOR_CLASSES[card.color] || COLOR_CLASSES.gray}`}>
            <CardContent className="p-4 md:p-5">
              {/* Icon + Title */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{card.icon}</span>
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {card.description}
              </p>

              {/* Footer: Resource Count + CTA */}
              <div className="flex items-center justify-between mt-auto pt-2">
                {card.count && (
                  <span className="text-xs text-muted-foreground">
                    {card.count} resources
                  </span>
                )}
                <span className="text-sm font-medium text-primary group-hover:underline inline-flex items-center gap-1">
                  {card.cta} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
