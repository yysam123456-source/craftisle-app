"use client";

import { toolMeta, ToolMeta } from "@/lib/tools";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import Link from "next/link";

interface Props {
  toolId: string;
}

export default function ToolDetailSections({ toolId }: Props) {
  const meta = toolMeta[toolId];
  if (!meta) return null;

  const relatedTools = (meta.relatedTools || [])
    .map((id) => (toolMeta[id] ? { id, ...toolMeta[id] } : null))
    .filter(Boolean) as Array<{ id: string } & ToolMeta>;

  return (
    <div className="space-y-10 mt-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* === Description Section === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">About This Tool</h2>
        {meta.description ? (
          <div
            className="text-sm text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: meta.description }}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Description coming soon.
          </p>
        )}
      </section>

      {/* === How To Use Section === */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">How to Use</h2>
        {(meta.howToUse || []).length > 0 ? (
          <ol className="space-y-5">
            {(meta.howToUse || []).map((step, i) => (
              <li key={i}>
                <p className="text-sm font-semibold">
                  {i + 1}. {step.heading}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            How to use coming soon.
          </p>
        )}
      </section>

      {/* === Use Cases Section === */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Use Cases</h2>
        {(meta.useCases || []).length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(meta.useCases || []).map((uc, i) => (
              <Card key={i} className="border">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold">{uc.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {uc.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Use cases coming soon.
          </p>
        )}
      </section>

      {/* === FAQ Section === */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">FAQ</h2>
        {(meta.faq || []).length > 0 ? (
          <div className="space-y-3">
            {(meta.faq || []).map((item, i) => (
              <Card key={i} className="border">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold">{item.q}</p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {item.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            FAQ coming soon.
          </p>
        )}
      </section>

      {/* === Related Tools Section === */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Related Tools</h2>
        {relatedTools.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTools.map((rt) => (
              <Link
                key={rt.id}
                href={`/tools/${rt.id}`}
                className="group block rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{rt.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold group-hover:text-primary">
                      {rt.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {rt.desc}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Related tools coming soon.
          </p>
        )}
      </section>
    </div>
  );
}
