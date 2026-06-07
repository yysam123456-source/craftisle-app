"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ResourceCard } from "@/components/resources/resource-card";
import { ResourceSearchClient } from "@/components/resources/resource-search-client";
import { constructMetadata } from "@/lib/utils";

interface Resource {
  id: string;
  category: string;
  categoryZh: string;
  categoryIcon: string;
  name: string;
  url: string;
  description: string;
}

export default function SearchResultsPage() {
  const [query, setQuery] = useState("");
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 从 URL 读取搜索参数
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    setQuery(q);
  }, []);

  // 加载全量数据
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/data/fmhy-resources.json");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const resources: Resource[] = [];
        for (const cat of Object.values(data.categories || {})) {
          for (const r of (cat as any).resources || []) {
            resources.push(r);
          }
        }
        setAllResources(resources);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 简单客户端搜索（模糊匹配）
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allResources.filter(r => {
      const text = `${r.name} ${r.url} ${r.categoryZh}`.toLowerCase();
      return text.includes(q);
    });
  }, [allResources, query]);

  const handleSearch = useCallback((q: string) => {
    router.push(`/resources/search?q=${encodeURIComponent(q)}`);
  }, [router]);

  return (
    <>
      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              搜索资源
            </h1>
            <ResourceSearchClient
              placeholder="搜索资源名称、描述、URL..."
              className="max-w-2xl"
            />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="text-center py-12 text-muted-foreground">
              加载中...
            </div>
          )}
          {!loading && query && (
            <div className="mb-6">
              <p className="text-muted-foreground">
                找到 <span className="font-semibold text-foreground">{results.length}</span> 条结果
                {query && <span> 关于 "{query}"</span>}
              </p>
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">未找到相关资源</p>
              <p className="text-sm text-muted-foreground mt-2">
                试试其他关键词
              </p>
            </div>
          )}
          {!loading && results.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  showCategory={true}
                />
              ))}
            </div>
          )}
          {!loading && !query && (
            <div className="text-center py-12 text-muted-foreground">
              输入关键词开始搜索
            </div>
          )}
        </div>
      </section>
    </>
  );
}
