"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, RefreshCw, Sparkles, Lightbulb, Tag } from "lucide-react";

interface Resource {
  id: string;
  name: string;
  description: string;
  url: string;
  categoryName: string;
}

// ── 垃圾数据过滤规则 ────────────────────────────────
function isGarbageResource(res: Resource): boolean {
  const name = (res.name || "").trim().toLowerCase();
  const desc = (res.description || "").trim().toLowerCase();
  // 过滤导航/返回类条目
  if (/^[\s◄▴▼«‹]/.test(name) || /back\s*to\s*wiki/i.test(name)) return true;
  if (/back\s*to\s*wiki/i.test(desc) || /index\s*page/i.test(name)) return true;
  // 过滤空名称或过短的无效条目
  if (name.length < 2) return true;
  // 过滤纯 URL 作为名称的条目
  if (/^(https?:\/\/|www\.)/.test(name)) return true;
  // 过滤描述看起来像原始数据泄露的
  if (desc.includes("[[") && desc.includes("]]")) return true;
  if (/\(https?:\/\/[^\)]+\)\s*[-—]\s*HTML/.test(desc)) return true;
  return false;
}

export function RandomRecommendations() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRandom() {
    setLoading(true);
    try {
      const res = await fetch("/api/random-resources?count=8");
      const data = await res.json();
      // 过滤垃圾数据 + 去重
      let filtered = (data.resources || []).filter(
        (r: Resource) => !isGarbageResource(r)
      );
      // 按 ID 去重
      const seen = new Set<string>();
      filtered = filtered.filter((r: Resource) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
      // 只取前 6 个
      setResources(filtered.slice(0, 6));
    } catch (err) {
      console.error("Failed to fetch random resources:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRandom();
  }, []);

  if (loading) {
    return (
      <section className="border-t border-border/40 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/15 bg-amber-500/5 px-4 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                <Lightbulb className="h-4 w-4" />
                Discover More
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                You Might{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  Also Like
                </span>
              </h2>
              <p className="mt-2 text-muted-foreground">Finding recommendations for you...</p>
            </div>
          </div>
          {/* 骨架屏 */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (resources.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-border/40 py-16">
      {/* 背景光斑 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区 */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-5 py-2 text-sm font-semibold text-amber-600 dark:text-amber-400 backdrop-blur-sm">
              <Lightbulb className="h-4 w-4" />
              Discover More
              <Sparkles className="h-3.5 w-3.5 opacity-60" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              You Might{" "}
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Also Like
              </span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Random recommendations — click refresh to discover more
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={fetchRandom}
            disabled={loading}
            className="group gap-2"
          >
            <RefreshCw className={`h-4 w-4 transition-transform group-hover:rotate-180 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* 推荐卡片网格 */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((res, idx) => (
            <Link key={res.id} href={`/directory/resource/${res.id}`} className="group block">
              {/* 玻璃拟态卡片 */}
              <div className="relative h-full overflow-hidden rounded-xl border border-white/15 bg-white/[0.65] shadow-md shadow-black/[0.03] backdrop-blur-lg transition-all duration-500 ease-out dark:border-white/8 dark:bg-white/[0.03] dark:shadow-black/10 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-black/8 dark:group-hover:shadow-black/20 group-hover:border-white/25 dark:group-hover:border-white/12">
                {/* Hover 微光晕 */}
                <div className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "linear-gradient(135deg, rgba(245,158,11,.08), transparent 50%, rgba(249,115,22,.08))", filter: "blur(6px)" }} />

                <div className="relative p-5 sm:p-6">
                  {/* 编号 + 标题行 */}
                  <div className="mb-3 flex items-start gap-3">
                    {/* 编号徽章 */}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-xs font-bold text-amber-600 ring-1 ring-amber-500/15 transition-all duration-300 group-hover:from-amber-500/20 group-hover:to-orange-500/20 group-hover:ring-amber-500/25 group-hover:scale-110 dark:text-amber-400">
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold leading-snug text-foreground line-clamp-2 transition-colors duration-300 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-amber-600 group-hover:to-orange-600 dark:group-hover:from-amber-400 dark:group-hover:to-orange-400">
                        {res.name}
                      </h3>
                    </div>
                  </div>

                  {/* 描述 */}
                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground/80 transition-colors duration-300 group-hover:text-muted-foreground">
                    {res.description || "No description available"}
                  </p>

                  {/* 底部：分类标签 + CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/30">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground/70 transition-colors group-hover:border-amber-500/15 group-hover:bg-amber-500/5 group-hover:text-amber-700/70 dark:group-hover:text-amber-400/70">
                      <Tag className="h-3 w-3" />
                      {res.categoryName || "General"}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-bold opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:gap-1.5"
                      style={{
                        background: "linear-gradient(135deg, #f59e0b, #f97316)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      View Details
                      <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
