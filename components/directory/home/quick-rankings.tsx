import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getHotResourcesByScore, getAllResources, calculateResourceScore } from "@/lib/fmhy-data";
import { ResourceCard } from "@/components/directory/resource-card";
import { ArrowRight, Trophy } from "lucide-react";

/**
 * Quick Rankings (homepage version)
 * Show TOP 5 by category, display all categories at once
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
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Quick Rankings
          </h2>
          <p className="mt-1 text-muted-foreground">
            TOP 5 resources by category
          </p>
        </div>

        {/* Show all categories at once */}
        <div className="space-y-12">
          {RANKING_CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{cat.icon}</span>
                <h3 className="font-semibold text-lg">{cat.name} TOP 5</h3>
              </div>
              <QuickRankingList category={cat} />
            </div>
          ))}
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

  if (resources.length === 0) return null;

  return (
    <div className="space-y-3">
      {resources.map((resource, index) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          rank={index}
          showScore={true}
          showDescription={true}
          showTags={false}
          variant="compact"
        />
      ))}
    </div>
  );
}
