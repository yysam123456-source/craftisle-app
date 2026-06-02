"use client";

import Link from "next/link";
import { toolMeta } from "@/lib/tools";
import type { ToolMeta } from "@/lib/tools";

export default function ToolDetailSections({ toolId }: { toolId: string }) {
  const meta = toolMeta[toolId] as ToolMeta | undefined;

  if (!meta) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-muted-foreground italic">Tool information not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10 pb-10">
      {/* === Description Section === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">About This Tool</h2>
        {meta.description ? (
          <div
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: meta.description }}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">Description coming soon.</p>
        )}
      </section>

      {/* === How To Use === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How to Use</h2>
        {meta.howToUse && meta.howToUse.length > 0 ? (
          <ol className="space-y-4">
            {meta.howToUse.map((step, i) => (
              <li key={i} className="ml-5 list-decimal">
                <strong>{step.heading}</strong>
                <p className="text-muted-foreground mt-1">{step.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground italic">Usage guide coming soon.</p>
        )}
      </section>

      {/* === Use Cases === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Use Cases</h2>
        {meta.useCases && meta.useCases.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {meta.useCases.map((uc, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <h3 className="font-semibold">{uc.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{uc.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Use cases coming soon.</p>
        )}
      </section>

      {/* === FAQ Section === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">FAQ</h2>
        {meta.faq && meta.faq.length > 0 ? (
          <div className="space-y-4">
            {meta.faq.map((item, i) => (
              <details key={i} className="rounded-xl border bg-card p-4">
                <summary className="cursor-pointer font-semibold">{item.q}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">FAQ coming soon.</p>
        )}
      </section>

      {/* === Related Tools === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Related Tools</h2>
        {meta.relatedTools && meta.relatedTools.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {(meta.relatedTools as string[])
              .map((id) => (toolMeta[id] ? { id, ...toolMeta[id] } : null))
              .filter(Boolean)
              .map((tool: any) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.id}`}
                  className="block rounded-xl border bg-card p-4 hover:shadow-md transition"
                >
                  <div className="text-lg">{tool.icon}</div>
                  <div className="font-semibold mt-1">{tool.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{tool.desc}</div>
                </Link>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Related tools coming soon.</p>
        )}
      </section>
    </div>
  );
}
