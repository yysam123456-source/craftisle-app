"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarButtonProps {
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export function StarButton({ isActive, onClick, className }: StarButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full p-1.5 transition-colors",
        "hover:bg-yellow-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400",
        className
      )}
      aria-label={isActive ? "Remove from favorites" : "Add to favorites"}
      title={isActive ? "Remove from favorites" : "Add to favorites"}
    >
      <Star
        className={cn(
          "h-5 w-5 transition-colors",
          isActive
            ? "fill-yellow-400 text-yellow-400"
            : "fill-transparent text-muted-foreground/60 hover:text-yellow-400"
        )}
      />
    </button>
  );
}
