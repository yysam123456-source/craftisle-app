"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface ResourceSearchClientProps {
  placeholder?: string;
  className?: string;
  /** 外部传入的搜索词（可选，用于搜索结果页同步 URL 参数） */
  value?: string;
  /** 搜索回调（可选，提供时用此回调代替直接 router.push） */
  onSearch?: (query: string) => void;
}

export function ResourceSearchClient({
  placeholder = "Search resources by name, description, or URL...",
  className,
  value,
  onSearch,
}: ResourceSearchClientProps) {
  const [query, setQuery] = useState(value || "");
  const router = useRouter();

  // 当外部 value 变化时（如 URL 参数变化），同步到内部 state
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  const doSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
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
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
    <div className={`relative ${className || ""}`}>
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
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
    </div>
  );
}
