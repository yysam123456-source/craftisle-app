"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "craftisle-tool-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        setFavorites(new Set(parsed));
      }
    } catch {
      // ignore
    }
    setIsReady(true);
  }, []);

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  }, [favorites, isReady]);

  const toggle = useCallback((toolId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });
  }, []);

  const isFavorited = useCallback(
    (toolId: string) => favorites.has(toolId),
    [favorites]
  );

  return { favorites, toggle, isFavorited, isReady, isLoaded: isReady };
}
