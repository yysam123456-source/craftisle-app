"use client"

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Globe, Zap, Shield, Clock, Users, Code, Sparkles, CheckCircle, HelpCircle } from "lucide-react";
import { StarButtonWrapper } from "@/components/resources/star-button-wrapper";
import type { Resource } from "@/lib/fmhy-data";

interface EnrichedResourceCardProps {
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
 * 智能描述生成器 —— 根据数据源自动提取/生成最丰富的描述
 */
function buildRichDescription(resource: Resource): string {
  const parts: string[] = [];

  // 1. 基础描述（优先）
  if (resource.description && resource.description.trim().length > 5) {
    parts.push(resource.description.trim());
  }

  // 2. free-for-dev: 从 freeTier 提取关键信息作为描述
  if (resource.source === "free-for-dev" && resource.freeTier && resource.freeTier.trim().length > 10) {
    const tier = resource.freeTier.trim();
    // 提取前3条免费额度作为描述
    const lines = tier.split(/\||\n/).map(l => l.trim()).filter(l => l.length > 5);
    if (lines.length > 0 && parts.length === 0) {
      // 没有description时，用freeTier生成摘要
      const summary = lines.slice(0, 2).join(" · ");
      parts.push(`Free tier includes: ${summary}${lines.length > 2 ? " and more..." : ""}`);
    } else if (lines.length > 0) {
      // 有description时，补充关键额度
      const keyLine = lines[0];
      if (keyLine.length < 100) {
        parts.push(`Key free tier: ${keyLine}`);
      }
    }
  }

  // 3. public-apis: 认证和协议信息
  if (resource.source === "public-apis") {
    const apiInfo: string[] = [];
    if (resource.auth && resource.auth !== "No") {
      apiInfo.push(`Auth: ${resource.auth}`);
    } else if (resource.auth === "No") {
      apiInfo.push("No auth required");
    }
    if (resource.https !== undefined) {
      apiInfo.push(resource.https ? "HTTPS" : "HTTP only");
    }
    if (resource.cors !== undefined) {
      apiInfo.push(resource.cors ? "CORS enabled" : "No CORS");
    }
    if (apiInfo.length > 0) {
      parts.push(apiInfo.join(" · "));
    }
  }

  // 4. awesome-selfhosted: 开源信息
  if (resource.source === "awesome-selfhosted") {
    const selfInfo: string[] = [];
    if (resource.isOpenSource) selfInfo.push("Open Source");
    if (resource.license) selfInfo.push(`License: ${resource.license}`);
    if (resource.language) selfInfo.push(`${resource.language}`);
    if (resource.isSelfHosted) selfInfo.push("Self-hosted");
    if (selfInfo.length > 0) {
      parts.push(selfInfo.join(" · "));
    }
  }

  // 5. GitHub 信息补充
  if (resource.githubStars && resource.githubStars > 0) {
    parts.push(`${resource.githubStars >= 1000 ? (resource.githubStars / 1000).toFixed(1) + "k" : resource.githubStars} GitHub stars`);
  }

  // 6. 兜底：用tags
  if (parts.length === 0 && resource.tags && resource.tags.length > 0) {
    parts.push(resource.tags.join(" · "));
  }

  // 7. 最终兜底：用名称+类别生成一句话
  if (parts.length === 0) {
    parts.push(`${resource.name} — ${resource.categoryName || "free resource"} available at ${getHostname(resource.url)}`);
  }

  return parts.join(" · ");
}

/**
 * 获取资源特性标签
 */
function getFeatureBadges(resource: Resource): { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon?: React.ReactNode }[] {
  const badges: { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon?: React.ReactNode }[] = [];

  if (resource.isFree || resource.source === "free-for-dev") {
    badges.push({ label: "Free", variant: "default", icon: <Zap className="h-3 w-3" /> });
  }

  if (resource.source === "public-apis") {
    if (resource.auth === "No") {
      badges.push({ label: "No Auth", variant: "secondary", icon: <Shield className="h-3 w-3" /> });
    } else if (resource.auth) {
      badges.push({ label: resource.auth.replace(/`/g, ""), variant: "outline" });
    }
    if (resource.https) badges.push({ label: "HTTPS", variant: "secondary" });
    if (resource.cors) badges.push({ label: "CORS", variant: "secondary" });
  }

  if (resource.source === "free-for-dev" && resource.freeTier && resource.freeTier.trim().length > 10) {
    badges.push({ label: "Free Tier", variant: "default", icon: <Sparkles className="h-3 w-3" /> });
  }

  if (resource.source === "awesome-selfhosted") {
    if (resource.isOpenSource) badges.push({ label: "Open Source", variant: "default", icon: <Code className="h-3 w-3" /> });
    if (resource.isSelfHosted) badges.push({ label: "Self-Hosted", variant: "secondary", icon: <Users className="h-3 w-3" /> });
    if (resource.license) badges.push({ label: resource.license, variant: "outline" });
    if (resource.language) badges.push({ label: resource.language, variant: "outline" });
  }

  if (resource.githubStars && resource.githubStars > 100) {
    badges.push({ label: "⭐ Popular", variant: "secondary" });
  }

  return badges;
}

/**
 * 提取 freeTier 关键条目（用于详情页展示）
 */
export function extractFreeTierHighlights(freeTier: string): string[] {
  if (!freeTier || freeTier.trim().length < 5) return [];
  const lines = freeTier.split(/\||\n/).map(l => l.trim()).filter(l => l.length > 5);
  return lines.slice(0, 6);
}

/**
 * 生成资源的一行摘要（用于列表页和SEO）
 */
export function generateResourceSummary(resource: Resource): string {
  if (resource.description && resource.description.trim().length > 30) {
    return resource.description.trim();
  }

  const hostname = getHostname(resource.url);
  const category = resource.categoryName || resource.category;

  if (resource.source === "free-for-dev" && resource.freeTier) {
    const highlights = extractFreeTierHighlights(resource.freeTier);
    if (highlights.length > 0) {
      return `${resource.name} offers a generous free tier for developers including ${highlights[0]}. ${highlights.length > 1 ? `Also includes ${highlights[1]}.` : ""}`;
    }
  }

  if (resource.source === "public-apis") {
    const features: string[] = [];
    if (resource.auth === "No") features.push("requires no authentication");
    if (resource.https) features.push("supports HTTPS");
    if (resource.cors) features.push("has CORS enabled");
    if (features.length > 0) {
      return `${resource.name} is a public API that ${features.join(", ")}.`;
    }
  }

  if (resource.source === "awesome-selfhosted") {
    const features: string[] = [];
    if (resource.isOpenSource) features.push("open-source");
    if (resource.isSelfHosted) features.push("self-hosted");
    if (resource.language) features.push(`built with ${resource.language}`);
    if (features.length > 0) {
      return `${resource.name} is an ${features.join(", ")} solution for ${category}.`;
    }
  }

  return `${resource.name} — a free ${category} resource available at ${hostname}.`;
}

export function EnrichedResourceCard({ resource, showCategory = true, variant = "default" }: EnrichedResourceCardProps) {
  const faviconUrl = getFaviconUrl(resource.url);
  const isLarge = variant === "large";
  const badges = getFeatureBadges(resource);

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
                <Link
                  href={`/directory/resource/${resource.id}`}
                  className="hover:text-primary hover:underline decoration-primary/50 underline-offset-2 transition-colors"
                >
                  {resource.name}
                </Link>
              </CardTitle>
              <div className="flex items-center flex-shrink-0 gap-0.5 mt-0.5">
                <StarButtonWrapper resourceId={resource.id} />
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
        <p
          className={`text-muted-foreground leading-relaxed ${
            isLarge ? "text-sm line-clamp-4" : "text-sm line-clamp-3"
          }`}
        >
          {buildRichDescription(resource)}
        </p>

        {/* Feature Badges */}
        {badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {badges.map((b, i) => (
              <Badge key={i} variant={b.variant} className="text-[10px] px-1.5 py-0 h-5 flex items-center gap-0.5">
                {b.icon}
                {b.label}
              </Badge>
            ))}
          </div>
        )}

        {/* freeTier 关键信息预览 */}
        {resource.source === "free-for-dev" && resource.freeTier && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span className="font-medium">Free Tier Highlights</span>
            </div>
            <ul className="space-y-1">
              {extractFreeTierHighlights(resource.freeTier).slice(0, 2).map((line, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{line}</span>
                </li>
              ))}
            </ul>
          </div>
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
