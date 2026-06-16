"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { getSearchSuggestions, type SearchableResource } from "@/lib/search-utils";

interface ResourceSearchClientProps {
  placeholder?: string;
  className?: string;
  /** 外部传入的搜索词（可选，用于搜索结果页同步 URL 参数） */
  value?: string;
  /** 搜索回调（可选，提供时用此回调代替直接 router.push） */
  onSearch?: (query: string) => void;
  /** 输入框的 id（可选，用于外部聚焦） */
  inputId?: string;
  /** 所有资源数据（可选，用于生成搜索建议） */
  resources?: SearchableResource[];
}

export function ResourceSearchClient({
  placeholder = "Search resources by name, description, or URL...",
  className,
  value,
  onSearch,
  inputId = "resource-search-input",
  resources,
}: ResourceSearchClientProps) {
  const [query, setQuery] = useState(value || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 当外部 value 变化时（如 URL 参数变化），同步到内部 state
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  // 根据输入生成搜索建议（动态，基于实际资源数据）
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 防抖：延迟 150ms 再生成建议，避免每次按键都触发
    const timer = setTimeout(() => {
      // 如果有资源数据，使用动态建议
      if (resources && resources.length > 0) {
        const dynamicSuggestions = getSearchSuggestions(query, resources, 6);
        setSuggestions(dynamicSuggestions);
        setShowSuggestions(dynamicSuggestions.length > 0);
      } else {
        // 降级：使用热门搜索作为建议
        const popularSearches = [
          "image generator", "video editor", "code assistant", "free api",
          "self-hosted", "github stars", "open source", "productivity",
          "ai tools", "free tier", "docker", "react",
        ];
        const q = query.toLowerCase();
        const matched = popularSearches.filter(s => s.toLowerCase().includes(q));
        setSuggestions(matched.slice(0, 5));
        setShowSuggestions(matched.length > 0);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, resources]);

  const doSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setShowSuggestions(false);
      if (onSearch) {
        onSearch(trimmed);
      } else {
        router.push(`/directory/search?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [onSearch, router]
  );

  const handleSearch = useCallback(() => {
    doSearch(query);
  }, [query, doSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    setShowSuggestions(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [handleSearch]
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    doSearch(suggestion);
  }, [doSearch]);

  return (
    <div className={`relative ${className || ""}`}>
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        id={inputId}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.trim().length > 0 && setShowSuggestions(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="h-14 pl-12 pr-20 text-base rounded-xl border-2 focus-visible:border-primary"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button size="sm" className="h-9" onClick={handleSearch}>
          Search
        </Button>
      </div>
      {/* 搜索建议下拉 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="w-full px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSuggestionClick(s);
              }}
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
