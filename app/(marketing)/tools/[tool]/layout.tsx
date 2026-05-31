import type { ReactNode } from "react";

/**
 * Tool layout — minimal wrapper.
 * AdSlots are now managed inside ToolDetailLayout.
 */
export default function ToolLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
