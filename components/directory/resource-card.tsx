import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import type { Resource } from "@/lib/fmhy-data";

interface ResourceCardProps {
  resource: Resource;
  rank?: number;
  showScore?: boolean;
  showDescription?: boolean;
  showTags?: boolean;
  variant?: "default" | "compact" | "featured";
}

/**
 * Unified resource card component
 * Provides consistent card design, typography, and layout for all directory sections
 * 
 * Variants:
 * - default: Standard card with name, description, and badges
 * - compact: Smaller card with only name and icon (for grids)
 * - featured: Larger card with score, stars, and full description
 */
export function ResourceCard({
  resource,
  rank,
  showScore = false,
  showDescription = true,
  showTags = false,
  variant = "default",
}: ResourceCardProps) {
  const href = `/directory/resource/${resource.id}`;

  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
        <CardContent className="p-3 md:p-5">
          {/* Rank badge (optional) */}
          {rank !== undefined && (
            <div className={`rounded-lg w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-bold text-sm md:text-lg mb-2 md:mb-3 ${
              rank === 0 ? "bg-yellow-500/10 text-yellow-600" :
              rank === 1 ? "bg-gray-500/10 text-gray-600" :
              rank === 2 ? "bg-orange-500/10 text-orange-600" :
              "bg-muted/50 text-muted-foreground"
            }`}>
              {rank + 1}
            </div>
          )}

          {/* Resource name */}
          <h3 className="font-semibold text-sm md:text-base mb-1 md:mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {resource.name}
          </h3>

          {/* Description (optional) */}
          {showDescription && (
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-2 md:mb-3">
              {resource.description?.slice(0, 80) || "No description"}
            </p>
          )}

          {/* Score (optional) */}
          {showScore && (
            <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
              <Star className="h-3 w-3 md:h-3.5 md:w-3.5 fill-yellow-400 text-yellow-500" />
              <span>{resource.githubStars ? (resource.githubStars / 1000).toFixed(1) + "K" : "N/A"}</span>
            </div>
          )}

          {/* Tags (optional) */}
          {showTags && resource.tags && (
            <div className="flex flex-wrap gap-1 md:gap-2">
              {resource.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] md:text-xs px-1 md:px-2">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Category and License badges */}
          <div className="flex flex-wrap gap-1 md:gap-2 mt-2 md:mt-3">
            {resource.categoryName && (
              <Badge variant="outline" className="text-[10px] md:text-xs px-1 md:px-2">
                {resource.categoryIcon} {resource.categoryName}
              </Badge>
            )}
            {resource.githubLicense && (
              <Badge variant="outline" className="text-[10px] md:text-xs px-1 md:px-2">
                {resource.githubLicense}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
