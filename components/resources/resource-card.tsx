import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Globe } from "lucide-react";

interface Resource {
  id: string;
  category: string;
  categoryName: string;
  categoryIcon: string;
  name: string;
  url: string;
  description: string;
}

interface ResourceCardProps {
  resource: Resource;
  showCategory?: boolean;
  variant?: "default" | "large";
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.length > 40 ? url.slice(0, 40) + "..." : url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return "";
  }
}

export function ResourceCard({ resource, showCategory = true, variant = "default" }: ResourceCardProps) {
  const faviconUrl = getFaviconUrl(resource.url);
  const isLarge = variant === "large";

  return (
    <Card
      className={`group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border/60 ${
        isLarge ? "h-full" : ""
      }`}
    >
      <CardHeader className={`${isLarge ? "pb-4 pt-6" : "pb-3 pt-5"}`}>
        <div className="flex items-start gap-3">
          {/* Favicon */}
          <div
            className={`flex-shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden ${
              isLarge ? "w-12 h-12" : "w-10 h-10"
            }`}
          >
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const icon = document.createElement("div");
                    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${isLarge ? "20" : "16"}" height="${isLarge ? "20" : "16"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
                    parent.appendChild(icon.firstChild!);
                  }
                }}
              />
            ) : (
              <Globe className={`text-muted-foreground ${isLarge ? "h-5 w-5" : "h-4 w-4"}`} />
            )}
          </div>

          {/* Title & Link */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <CardTitle
                className={`leading-tight ${
                  isLarge ? "text-lg" : "text-base"
                }`}
              >
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
                className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
              >
                <ExternalLink className={`${isLarge ? "h-4 w-4" : "h-3.5 w-3.5"}`} />
              </a>
            </div>

            {/* Category Badge */}
            {showCategory && resource.categoryName && (
              <Badge variant="secondary" className="mt-2 text-xs font-normal">
                {resource.categoryIcon} {resource.categoryName}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={`${isLarge ? "pb-6 pt-0" : "pb-5 pt-0"}`}>
        {/* Description */}
        {resource.description && (
          <p
            className={`text-muted-foreground leading-relaxed ${
              isLarge ? "text-sm line-clamp-4" : "text-sm line-clamp-3"
            }`}
          >
            {resource.description}
          </p>
        )}

        {/* Footer: URL + Visit button */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground truncate flex-1">
            {getHostname(resource.url)}
          </p>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            Visit <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
