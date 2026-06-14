import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowRight } from "lucide-react";
import { getHotResourcesByScore, getRichInfoResourceIds } from "@/lib/fmhy-data";

/**
 * Editor's Picks (weekly updated)
 * Show TOP 6 resources by score, with recommendations
 */

export function EditorPicks() {
  // Get TOP 6 resources by score
  const picks = getHotResourcesByScore(6);
  const richInfoIds = getRichInfoResourceIds();

  if (!picks || picks.length === 0) return null;

  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              ⭐ Editor's Picks
            </h2>
            <p className="mt-1 text-muted-foreground">
              Weekly update, based on comprehensive scoring (GitHub Stars + Data Richness + Description Quality)
            </p>
          </div>
          <Link href="/directory/best/ai-tools">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Badge>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((resource, index) => {
            const hasDetailPage = richInfoIds.has(resource.id);
            const detailHref = `/directory/resource/${resource.id}`;
            const officialUrl = resource.url || "#";
            
            return (
              <div key={resource.id} className="group">
                {hasDetailPage ? (
                  <Link href={detailHref} className="block">
                    <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1} Pick
                          </Badge>
                          {resource.githubStars && resource.githubStars > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500" />
                              <span>{(resource.githubStars / 1000).toFixed(1)}K</span>
                            </div>
                          )}
                        </div>

                        <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">
                          {resource.name}
                        </h3>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {resource.description?.slice(0, 100) || "No description"}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {resource.categoryName && (
                            <Badge variant="outline" className="text-xs">
                              {resource.categoryIcon} {resource.categoryName}
                            </Badge>
                          )}
                          {resource.githubLicense && (
                            <Badge variant="outline" className="text-xs">
                              {resource.githubLicense}
                            </Badge>
                          )}
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
                    <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1} Pick
                          </Badge>
                          {resource.githubStars && resource.githubStars > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500" />
                              <span>{(resource.githubStars / 1000).toFixed(1)}K</span>
                            </div>
                          )}
                        </div>

                        <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">
                          {resource.name}
                        </h3>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {resource.description?.slice(0, 100) || "No description"}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {resource.categoryName && (
                            <Badge variant="outline" className="text-xs">
                              {resource.categoryIcon} {resource.categoryName}
                            </Badge>
                          )}
                          {resource.githubLicense && (
                            <Badge variant="outline" className="text-xs">
                              {resource.githubLicense}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
