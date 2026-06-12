import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowRight } from "lucide-react";
import { getHotResourcesByScore } from "@/lib/fmhy-data";

/**
 * 编辑精选（每周更新）
 * 展示评分 TOP 6 的资源，带推荐理由
 */

export function EditorPicks() {
  // 获取评分 TOP 6 的资源
  const picks = getHotResourcesByScore(6);

  if (!picks || picks.length === 0) return null;

  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              ⭐ 编辑精选
            </h2>
            <p className="mt-1 text-muted-foreground">
              每周更新，基于综合评分（GitHub Stars + 数据丰富度 + 描述质量）
            </p>
          </div>
          <Link href="/directory/best/ai-tools">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              查看全部 <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Badge>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((resource, index) => {
            const href = `/directory/resource/${resource.id}`;
            return (
              <Link key={resource.id} href={href} className="group">
                <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="secondary" className="text-xs">
                        #{index + 1} 精选
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
                      {resource.description?.slice(0, 100) || "暂无描述"}
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
