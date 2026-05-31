"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Maximize2, Minimize2 } from "lucide-react";

interface ToolActionBarProps {
  toolId: string;
}

export function ToolActionBar({ toolId }: ToolActionBarProps) {
  const [isFav, setIsFav] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load favorite state from localStorage
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem("craftisle-favorites") || "[]");
      setIsFav(favs.includes(toolId));
    } catch {
      setIsFav(false);
    }
  }, [toolId]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFav = useCallback(() => {
    try {
      const favs = new Set(JSON.parse(localStorage.getItem("craftisle-favorites") || "[]"));
      if (favs.has(toolId)) {
        favs.delete(toolId);
        setIsFav(false);
      } else {
        favs.add(toolId);
        setIsFav(true);
      }
      localStorage.setItem("craftisle-favorites", JSON.stringify([...favs]));
    } catch {
      // ignore
    }
  }, [toolId]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = document.title;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        // Could show toast here, but keeping it simple
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full h-10 w-10"
        onClick={toggleFav}
        title={isFav ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"
          }`}
        />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full h-10 w-10"
        onClick={handleShare}
        title="Share this tool"
      >
        <Share2 className="h-4 w-4 text-muted-foreground" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full h-10 w-10"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Maximize2 className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
