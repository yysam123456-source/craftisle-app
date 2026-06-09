"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface ResourceSearchClientProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onSearch?: (query: string) => void;
}

export function ResourceSearchClient({
  placeholder = "Search resources by name, description, or URL...",
  className,
  value: controlledValue,
  onSearch,
}: ResourceSearchClientProps) {
  const isControlled = controlledValue !== undefined;
  const [internalQuery, setInternalQuery] = useState("");
  const query = isControlled ? controlledValue : internalQuery;
  const setQuery = isControlled ? undefined : setInternalQuery;

  const router = useRouter();

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
    if (setQuery) setQuery("");
  }, [setQuery]);

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
        onChange={(e) => {
          if (setQuery) setQuery(e.target.value);
        }}
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
