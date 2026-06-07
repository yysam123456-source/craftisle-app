import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  category: string;
  categoryZh: string;
  categoryIcon: string;
  name: string;
  url: string;
  description: string;
}

interface ResourceCardProps {
  resource: Resource;
  showCategory?: boolean;
}

export function ResourceCard({ resource, showCategory = true }: ResourceCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline decoration-primary/50 underline-offset-2 transition-colors"
            >
              {resource.name}
            </a>
          </CardTitle>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 mt-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {showCategory && (
          <Badge variant="secondary" className="mb-2 text-xs">
            {resource.categoryIcon} {resource.categoryZh}
          </Badge>
        )}
        {resource.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground truncate">
          {new URL(resource.url).hostname.replace(/^www\./, "")}
        </p>
      </CardContent>
    </Card>
  );
}
