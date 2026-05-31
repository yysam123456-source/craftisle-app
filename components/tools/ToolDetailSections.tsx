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
    <div className="space-y-8 mt-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* === Description Section === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">About This Tool</h2>
        {meta.description ? (
          <div
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: meta.description }}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Description coming soon.
          </p>
        )}
      </section>

      {/* === How To Use Section === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How To Use</h2>
        {(meta.howToUse || []).length > 0 ? (
          <ol className="space-y-4">
            {(meta.howToUse || []).map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-medium">{step.heading}</h3>
                  <p className="text-sm text-muted-foreground">{step.text}</p>
                </div>
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
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Use Cases</h2>
        {(meta.useCases || []).length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(meta.useCases || []).map((uc, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-1">{uc.title}</h3>
                  <p className="text-sm text-muted-foreground">{uc.text}</p>
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
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">FAQ</h2>
        {(meta.faq || []).length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {(meta.faq || []).map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            FAQ coming soon.
          </p>
        )}
      </section>

      {/* === Related Tools Section === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Related Tools</h2>
        {relatedTools.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTools.map((rt) => (
              <Link
                key={rt.id}
                href={`/tools/${rt.id}`}
                className="group block rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{rt.icon}</span>
                  <div>
                    <h3 className="font-medium group-hover:text-primary">
                      {rt.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{rt.desc}</p>
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
