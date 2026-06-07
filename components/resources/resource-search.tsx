"use client";

import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface ResourceSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function ResourceSearch({
  onSearch,
  placeholder = "Search resources...",
  className,
}: ResourceSearchProps) {
  const [query, setQuery] = useState("");

  const handleSearch = useCallback(() => {
    onSearch(query.trim());
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
  }, [onSearch]);

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
        className="h-12 pl-10 pr-10 text-base"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
