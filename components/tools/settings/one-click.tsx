"use client";

/**
 * One-click settings — no params needed.
 * Used by: favicon, strip-metadata, info
 */
export function OneClickSettings() {
  return (
    <div className="rounded-lg bg-muted/30 p-4 text-center">
      <p className="text-sm text-muted-foreground">
        No settings needed. Just upload and process.
      </p>
    </div>
  );
}
