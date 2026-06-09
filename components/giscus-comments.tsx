"use client";

import { useEffect, useRef } from "react";

interface GiscusCommentsProps {
  term?: string;
}

/**
 * Giscus comments component powered by GitHub Discussions.
 * Free, privacy-friendly, and SEO-compatible.
 * 
 * Setup: Enable Discussions on the GitHub repo, install Giscus app,
 * then set NEXT_PUBLIC_GISCUS_REPO and NEXT_PUBLIC_GISCUS_REPO_ID env vars.
 */
export function GiscusComments({ term }: GiscusCommentsProps) {
  const ref = useRef<HTMLDivElement>(null);

  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "General";
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

  useEffect(() => {
    if (!repo || !repoId || !categoryId) return;

    // Avoid duplicate script injection
    if (ref.current?.querySelector("iframe")) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", term ? "specific" : "pathname");
    script.setAttribute("data-term", term || "");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "en");
    script.setAttribute("data-loading", "lazy");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    ref.current?.appendChild(script);

    return () => {
      // Cleanup handled by React unmount
    };
  }, [repo, repoId, categoryId, term, category]);

  if (!repo || !repoId || !categoryId) {
    return (
      <div className="mt-12 pt-8 border-t">
        <p className="text-sm text-muted-foreground text-center">
          Comments are not yet configured. Set Giscus environment variables to enable.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12 pt-8 border-t">
      <h2 className="text-xl font-bold mb-6">Comments</h2>
      <div ref={ref} className="giscus" />
    </div>
  );
}
