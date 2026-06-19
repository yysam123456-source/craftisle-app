import * as React from "react";
import Link from "next/link";

import { footerLinks, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/layout/mode-toggle";

import { NewsletterForm } from "../forms/newsletter-form";
import { Icons } from "../shared/icons";

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("relative overflow-hidden border-t border-border/40 bg-muted/20", className)}>
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-primary/3 blur-[120px]" />
        <div className="absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-violet-500/3 blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto grid max-w-6xl grid-cols-2 gap-10 px-4 py-16 sm:px-6 lg:px-8 md:grid-cols-6">
        {/* Brand 列 */}
        <div className="col-span-2 md:col-span-2">
          <Link href="/" className="mb-4 inline-flex items-center gap-2">
            <Icons.logo className="h-7 w-auto" />
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground/80 max-w-xs">
            Discover 16,000+ curated free & open-source tools across 200+ categories. 100% free, no signup required.
          </p>
          {/* Social Icons */}
          <div className="mt-5 flex items-center gap-2">
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-white/50 text-muted-foreground transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:bg-white/[0.03]"
            >
              <Icons.gitHub className="h-4 w-4" />
            </a>
            <a
              href={siteConfig.links.twitter || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-white/50 text-muted-foreground transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:bg-white/[0.03]"
            >
              <Icons.twitter className="h-4 w-4" />
            </a>
            <ModeToggle />
          </div>
        </div>

        {/* 动态 Footer Links */}
        {footerLinks.map((section) => (
          <div key={section.title}>
            <h4 className="mb-3 text-sm font-bold tracking-wide text-foreground">
              {section.title}
            </h4>
            <ul className="space-y-2">
              {section.items?.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    <span className="h-0.5 w-0 rounded-full bg-primary transition-all duration-300 group-hover:w-3" />
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter */}
        <div className="col-span-2 md:col-span-2">
          <h4 className="mb-3 text-sm font-bold tracking-wide text-foreground">
            Stay Updated
          </h4>
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground/80">
            Get weekly updates on new free tools & open-source projects.
          </p>
          <NewsletterForm />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-border/30 bg-muted/30 py-4">
        <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground/60">
            &copy; {currentYear} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <Link href="/privacy" className="transition-colors hover:text-primary">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-primary">Terms</Link>
            <Link href="/sitemap.xml" className="transition-colors hover:text-primary">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
