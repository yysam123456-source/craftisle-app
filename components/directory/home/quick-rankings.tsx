import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowRight, Trophy } from "lucide-react";
import { getHotResourcesByScore, getAllResources, calculateResourceScore } from "@/lib/fmhy-data";

/**
 * 快速排行榜（首页版）
 * 按分类展示 TOP 5，使用横向 tab 切换
 */

const RANKING_CATEGORIES = [
  { id: "Artificial-Intelligence", name: "AI 工具", icon: "🤖" },
  { id: "Development", name: "开发工具", icon: "💻" },
  { id: "Privacy-Security", name: "隐私工具", icon: "🔒" },
];

function getTopResourcesByCategory(categoryId: string, limit = 5) {
  const all = getAllResources();
  return [...all]
    .filter(r => r.category === categoryId)
    .sort((a, b) => calculateResourceScore(b) - calculateResourceScore(a))
    .slice(0, limit);
}

export function QuickRankings() {
  // 默认显示第一个分类
  const defaultCat = RANKING_CATEGORIES[0];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            🏆 快速排行榜
          </h2>
          <p className="mt-1 text-muted-foreground">
            按分类查看 TOP 5，点击资源查看详情
          </p>
        </div>

        {/* Tab 切换 */}
        <div className="flex justify-center gap-2 mb-8">
          {RANKING_CATEGORIES.map((cat) => (
            <Badge
              key={cat.id}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 px-4 py-2"
            >
              {cat.icon} {cat.name}
            </Badge>
          ))}
        </div>

        {/* 默认显示第一个分类的 TOP 5 */}
        <div className="max-w-2xl mx-auto">
          <QuickRankingList category={defaultCat} />
        </div>

        <div className="mt-8 text-center">
          <Link href="/directory/best/ai-tools">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              查看完整排行榜 <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Badge>
          </Link>
        </div>
      </div>
    </section>
  );
}

function QuickRankingList({ category }: { category: (typeof RANKING_CATEGORIES)[0] }) {
  const resources = getTopResourcesByCategory(category.id, 5);

  if (resources.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{category.icon}</span>
        <h3 className="font-semibold text-lg">{category.name} TOP 5</h3>
      </div>

      {resources.map((resource, index) => {
        const href = `/directory/resource/${resource.id}`;
        const score = calculateResourceScore(resource);
        return (
          <Link key={resource.id} href={href} className="group">
            <Card className="transition-all hover:border-primary/40 hover:shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* 排名 */}
                  <div className={`rounded-lg w-10 h-10 flex items-center justify-center font-bold text-lg ${
                    index === 0 ? "bg-yellow-500/10 text-yellow-600" :
                    index === 1 ? "bg-gray-500/10 text-gray-600" :
                    index === 2 ? "bg-orange-500/10 text-orange-600" :
                    "bg-muted/50 text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>

                  {/* 资源信息 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                      {resource.name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {resource.description?.slice(0, 60) || "暂无描述"}
                    </p>
                  </div>

                  {/* 评分 + GitHub Stars */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                      <span>{score}分</span>
                    </div>
                    {resource.githubStars && resource.githubStars > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500" />
                        <span>{(resource.githubStars / 1000).toFixed(1)}K</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
