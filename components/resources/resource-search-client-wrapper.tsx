"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface ResourceSearchClientWrapperProps {
  categoryId?: string;
  placeholder?: string;
  className?: string;
}

export function ResourceSearchClientWrapper({
  categoryId,
  placeholder = "Search in this category...",
  className,
}: ResourceSearchClientWrapperProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/directory/search?q=${encodeURIComponent(trimmed)}`);
    }
  }, [query, router]);

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
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-11 pl-10 pr-20"
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleClear}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button size="sm" className="h-7" onClick={handleSearch}>
          Search
        </Button>
      </div>
    </div>
  );
}
