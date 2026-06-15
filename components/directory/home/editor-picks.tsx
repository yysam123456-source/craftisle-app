import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getHotResourcesByScore, getRichInfoResourceIds, getAllResources } from "@/lib/fmhy-data";
import { ResourceCard } from "@/components/directory/resource-card";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * Editor's Picks (weekly updated)
 * Show diverse high-quality resources: TOP 3 by score + 3 featured by category
 */

export function EditorPicks() {
  // Get TOP 3 resources by score
  const topByScore = getHotResourcesByScore(3);
  const richInfoIds = getRichInfoResourceIds();
  
  // Get 3 featured resources from different categories
  const allResources = getAllResources();
  const featured = allResources
    .filter(r => r.categoryName && r.description && r.description.length > 50)
    .filter(r => !topByScore.some(p => p.id === r.id))
    .slice(0, 3);
  
  const picks = [...topByScore, ...featured];
  
  if (!picks || picks.length === 0) return null;
  
  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              Editor's Picks
            </h2>
            <p className="mt-1 text-muted-foreground">
              Carefully curated high-quality resources, updated weekly
            </p>
          </div>
          <Link href="/directory/best/ai-tools">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Badge>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((resource, index) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              rank={index}
              showScore={true}
              showDescription={true}
              showTags={true}
              variant={index < 3 ? "featured" : "default"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
