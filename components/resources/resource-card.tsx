"use client"

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Globe } from "lucide-react";
import { StarButtonWrapper } from "@/components/resources/star-button-wrapper";

interface Resource {
  id: string;
  category: string;
  categoryName?: string;
  categoryIcon?: string;
  name: string;
  url: string;
  description: string;
  source?: string;
  /** Public APIs 特有 */
  auth?: string;
  https?: boolean;
  cors?: boolean;
  /** Free-for-dev 特有 */
  freeTier?: string;
  /** Self-hosted 特有 */
  isOpenSource?: boolean;
  license?: string;
  language?: string;
  /** 通用 */
  tags?: string[];
  isFree?: boolean;
  githubStars?: number;
  hasReview?: boolean;
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
    return `https://favicone.com/${hostname}`;
  } catch {
    return "";
  }
}

/**
 * 判断资源是否有足够丰富的信息值得展示详情页
 * 如果没有丰富信息，点击卡片直接跳转外部网站
 * 【判断标准】只保留有 AI review 的资源详情页（约 48 个）
 * 其他资源的卡片直接跳转外部网站，避免生成垃圾页面
 */
function hasRichInfo(resource: Resource): boolean {
  // 只检查是否有 AI Review（与 fmhy-data.ts 中的 getRichInfoResourceIds() 保持一致）
  return !!resource.hasReview;
}

function buildRichDescription(resource: Resource): string {
  const parts: string[] = [];

  // 基础描述
  if (resource.description && resource.description.trim().length > 5) {
    parts.push(resource.description.trim());
  }

  // 根据数据源补充信息
  if (resource.source === "public-apis") {
    const apiInfo: string[] = [];
    if (resource.auth && resource.auth !== "No") {
      apiInfo.push(`Authentication: ${resource.auth}`);
    } else if (resource.auth === "No") {
      apiInfo.push("No authentication required");
    }
    if (resource.https !== undefined) {
      apiInfo.push(resource.https ? "HTTPS supported" : "HTTP only");
    }
    if (resource.cors !== undefined) {
      apiInfo.push(resource.cors ? "CORS enabled" : "CORS not supported");
    }
    if (apiInfo.length > 0) {
      parts.push(apiInfo.join(" · "));
    }
  }

  // free-for-dev: description为空时，从freeTier提取摘要
  if (resource.source === "free-for-dev" && resource.freeTier && resource.freeTier.trim()) {
    const tier = resource.freeTier.trim();
    if (tier.length > 10) {
      if (parts.length === 0) {
        // 没有description时，提取前2条免费额度作为摘要
        const lines = tier.split(/\||\n/).map(l => l.trim()).filter(l => l.length > 5);
        const summary = lines.slice(0, 2).join(" · ");
        parts.push(`Free tier includes: ${summary}${lines.length > 2 ? " and more..." : ""}`);
      } else {
        // 有description时，补充关键额度
        parts.push(`Free tier: ${tier.slice(0, 180)}${tier.length > 180 ? "..." : ""}`);
      }
    }
  }

  if (resource.source === "awesome-selfhosted") {
    const selfInfo: string[] = [];
    if (resource.isOpenSource) selfInfo.push("Open Source");
    if (resource.license) selfInfo.push(`License: ${resource.license}`);
    if (resource.language) selfInfo.push(`Built with ${resource.language}`);
    if (selfInfo.length > 0) {
      parts.push(selfInfo.join(" · "));
    }
  }

  // GitHub信息补充
  if (resource.githubStars && resource.githubStars > 0) {
    parts.push(`${resource.githubStars >= 1000 ? (resource.githubStars / 1000).toFixed(1) + "k" : resource.githubStars} GitHub stars`);
  }

  // 兜底：用tags
  if (parts.length === 0 && resource.tags && resource.tags.length > 0) {
    parts.push(resource.tags.join(" · "));
  }

  // 最终兜底：用名称+类别生成一句话
  if (parts.length === 0) {
    const hostname = getHostname(resource.url);
    parts.push(`${resource.name} — ${resource.categoryName || "free resource"} available at ${hostname}`);
  }

  return parts.join(" · ");
}

function getFeatureBadges(resource: Resource): { label: string; variant: "default" | "secondary" | "outline" | "destructive" }[] {
  const badges: { label: string; variant: "default" | "secondary" | "outline" | "destructive" }[] = [];

  if (resource.isFree) {
    badges.push({ label: "Free", variant: "default" });
  }

  if (resource.source === "public-apis") {
    if (resource.auth === "No") {
      badges.push({ label: "No Auth", variant: "secondary" });
    } else if (resource.auth) {
      badges.push({ label: `Auth: ${resource.auth.replace(/`/g, "")}`, variant: "outline" });
    }
    if (resource.https) badges.push({ label: "HTTPS", variant: "secondary" });
    if (resource.cors) badges.push({ label: "CORS", variant: "secondary" });
  }

  if (resource.source === "free-for-dev" && resource.freeTier && resource.freeTier.trim().length > 5) {
    badges.push({ label: "Free Tier", variant: "default" });
  }

  if (resource.source === "awesome-selfhosted") {
    if (resource.isOpenSource) badges.push({ label: "Open Source", variant: "default" });
    if (resource.license) badges.push({ label: resource.license, variant: "outline" });
    if (resource.language) badges.push({ label: resource.language, variant: "outline" });
  }

  return badges;
}

export function ResourceCard({ resource, showCategory = true, variant = "default" }: ResourceCardProps) {
  const faviconUrl = getFaviconUrl(resource.url);
  const isLarge = variant === "large";
  const hasDetail = hasRichInfo(resource);

  return (
    <Card
      className={`group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border/60 ${
        isLarge ? "h-full" : ""
      } ${!hasDetail ? "cursor-pointer" : ""}`}
      onClick={!hasDetail ? () => window.open(resource.url, "_blank", "noopener,noreferrer") : undefined}
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
                loading="lazy"
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
                {hasDetail ? (
                  <Link
                    href={`/directory/resource/${resource.id}`}
                    className="hover:text-primary hover:underline decoration-primary/50 underline-offset-2 transition-colors"
                  >
                    {resource.name}
                  </Link>
                ) : (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline decoration-primary/50 underline-offset-2 transition-colors"
                  >
                    {resource.name}
                  </a>
                )}
              </CardTitle>
              <div className="flex items-center flex-shrink-0 gap-0.5 mt-0.5">
                {/* Star button */}
                <StarButtonWrapper resourceId={resource.id} />
                {/* External link */}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className={`${isLarge ? "h-4 w-4" : "h-3.5 w-3.5"}`} />
                </a>
              </div>
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
        {/* Rich Description */}
        {(resource.description || resource.source) && (
          <p
            className={`text-muted-foreground leading-relaxed ${
              isLarge ? "text-sm line-clamp-4" : "text-sm line-clamp-3"
            }`}
          >
            {buildRichDescription(resource)}
          </p>
        )}

        {/* Feature Badges */}
        {(() => {
          const badges = getFeatureBadges(resource);
          return badges.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {badges.map((b, i) => (
                <Badge key={i} variant={b.variant} className="text-[10px] px-1.5 py-0 h-5">
                  {b.label}
                </Badge>
              ))}
            </div>
          ) : null;
        })()}

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
