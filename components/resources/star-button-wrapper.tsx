"use client";

import { StarButton } from "@/components/star-button";
import { useFavorites } from "@/hooks/use-favorites";
import { trackFavoriteToggle } from "@/lib/ga-events";

interface StarButtonWrapperProps {
  resourceId: string;
}

/**
 * Client-side wrapper for the star button in resource detail page.
 * Used to integrate with useFavorites hook and GA4 event tracking.
 */
export function StarButtonWrapper({ resourceId }: StarButtonWrapperProps) {
  const { toggle, isFavorited } = useFavorites();
  const handleToggle = () => {
    const nowFavorited = isFavorited(resourceId);
    toggle(resourceId);
    trackFavoriteToggle(resourceId, nowFavorited ? "remove" : "add");
  };
  return (
    <StarButton
      isActive={isFavorited(resourceId)}
      onClick={handleToggle}
    />
  );
}
