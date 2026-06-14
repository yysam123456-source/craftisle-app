import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowRight, Trophy } from "lucide-react";
import { getHotResourcesByScore, getAllResources, calculateResourceScore, getRichInfoResourceIds } from "@/lib/fmhy-data";

/**
 * Quick Rankings (homepage version)
 * Show TOP 5 by category, use horizontal tabs to switch
 */

const RANKING_CATEGORIES = [
  { id: "Artificial-Intelligence", name: "AI Tools", icon: "🤖" },
  { id: "Development", name: "Dev Tools", icon: "💻" },
  { id: "Privacy-Security", name: "Privacy Tools", icon: "🔒" },
];

function getTopResourcesByCategory(categoryId: string, limit = 5) {
  const all = getAllResources();
  return [...all]
    .filter(r => r.category === categoryId)
    .sort((a, b) => calculateResourceScore(b) - calculateResourceScore(a))
    .slice(0, limit);
}

export function QuickRankings() {
  // Default to first category
  const defaultCat = RANKING_CATEGORIES[0];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            🏆 Quick Rankings
          </h2>
          <p className="mt-1 text-muted-foreground">
            View TOP 5 by category, click resource to view details
          </p>
        </div>

        {/* Tab switcher */}
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

        {/* Default to first category's TOP 5 */}
        <div className="max-w-2xl mx-auto">
          <QuickRankingList category={defaultCat} />
        </div>

        <div className="mt-8 text-center">
          <Link href="/directory/best/ai-tools">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              View Full Rankings <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Badge>
          </Link>
        </div>
      </div>
    </section>
  );
}

function QuickRankingList({ category }: { category: (typeof RANKING_CATEGORIES)[0] }) {
  const resources = getTopResourcesByCategory(category.id, 5);
  const richInfoIds = getRichInfoResourceIds();

  if (resources.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{category.icon}</span>
        <h3 className="font-semibold text-lg">{category.name} TOP 5</h3>
      </div>

      {resources.map((resource, index) => {
        const hasDetailPage = richInfoIds.has(resource.id);
        const detailHref = `/directory/resource/${resource.id}`;
        const officialUrl = resource.url || "#";
        const score = calculateResourceScore(resource);
        
        return (
          <div key={resource.id} className="group">
            {hasDetailPage ? (
              <Link href={detailHref} className="block">
                <Card className="transition-all hover:border-primary/40 hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`rounded-lg w-10 h-10 flex items-center justify-center font-bold text-lg ${
                        index === 0 ? "bg-yellow-500/10 text-yellow-600" :
                        index === 1 ? "bg-gray-500/10 text-gray-600" :
                        index === 2 ? "bg-orange-500/10 text-orange-600" :
                        "bg-muted/50 text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>

                      {/* Resource info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                          {resource.name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {resource.description?.slice(0, 60) || "No description"}
                        </p>
                      </div>

                      {/* Score + GitHub Stars */}
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                          <span>{score}</span>
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
            ) : (
              <a 
                href={officialUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="transition-all hover:border-primary/40 hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`rounded-lg w-10 h-10 flex items-center justify-center font-bold text-lg ${
                        index === 0 ? "bg-yellow-500/10 text-yellow-600" :
                        index === 1 ? "bg-gray-500/10 text-gray-600" :
                        index === 2 ? "bg-orange-500/10 text-orange-600" :
                        "bg-muted/50 text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>

                      {/* Resource info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                          {resource.name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {resource.description?.slice(0, 60) || "No description"}
                        </p>
                      </div>

                      {/* Score + GitHub Stars */}
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                          <span>{score}</span>
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
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
