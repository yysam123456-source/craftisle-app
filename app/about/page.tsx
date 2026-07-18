import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle
} from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Wrench, Globe, Zap, ShieldCheck } from "lucide-react";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "About | Craftisle",
  description: "Learn about Craftisle — free online tools platform, built for creators and developers.",
  canonical: "https://craftisle.com/about",
});

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              About Craftisle
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Free tools, built for the web — no downloads, no signup.
            </p>
          </div>

          {/* What is Craftisle */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">What is Craftisle?</h2>
            <div className="prose prose-gray max-w-none dark:prose-invert text-muted-foreground">
              <p>
                Craftisle is a free online platform that brings together 100+ useful
                web-based tools. Everything runs directly in your
                browser — no installation, no registration, no hidden costs.
              </p>
              <p>
                Whether you need to compress an image, convert a PDF, format JSON,
                Craftisle is built to be fast, accessible,
                and distraction-free.
              </p>
            </div>
          </section>

          {/* What we offer */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold">What We Offer</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <GlassCard>
                <GlassCardHeader>
                  <Wrench className="h-8 w-8 text-primary" />
                  <GlassCardTitle className="mt-2">100+ Free Tools</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="text-sm text-muted-foreground">
                  PDF tools, image converters, developer utilities, text processors, and
                  more. All free, all in your browser.
                </GlassCardContent>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader>
                  <Globe className="h-8 w-8 text-primary" />
                  <GlassCardTitle className="mt-2">Multi-Language</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="text-sm text-muted-foreground">
                  Available in English and Chinese. We are expanding to more languages
                  to serve users worldwide.
                </GlassCardContent>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader>
                  <Zap className="h-8 w-8 text-primary" />
                  <GlassCardTitle className="mt-2">No Signup Required</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="text-sm text-muted-foreground">
                  Every tool works instantly. We believe in zero-friction productivity.
                </GlassCardContent>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader>
                  <ShieldCheck className="h-8 w-8 text-primary" />
                  <GlassCardTitle className="mt-2">Privacy First</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="text-sm text-muted-foreground">
                  Most tools process data entirely in your browser. Your files never leave
                  your device.
                </GlassCardContent>
              </GlassCard>
            </div>
          </section>

          {/* Our mission */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
            <div className="prose prose-gray max-w-none dark:prose-invert text-muted-foreground">
              <p>
                We believe powerful tools should be accessible to everyone. Craftisle
                exists to remove barriers — between you and the tool you need.
                No accounts, no paywalls, no nonsense.
              </p>
            </div>
          </section>

          {/* Who operates Craftisle — ownership & editorial transparency */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Who Operates Craftisle</h2>
            <div className="prose prose-gray max-w-none dark:prose-invert text-muted-foreground">
              <p>
                Craftisle is an independently owned and operated website, published at{" "}
                <a
                  href="https://craftisle.com"
                  className="font-medium underline underline-offset-2 hover:text-primary"
                >
                  craftisle.com
                </a>
                . The site is maintained by a small, independent team of developers and
                editors responsible for building the tools, curating the resource
                directory, and writing the reviews and guides published here.
              </p>
              <p>
                We are solely responsible for the editorial content on this site. Our
                tool reviews and directory listings are compiled from public sources and
                hands-on testing; they reflect our own assessments and are not sponsored
                placements. When a page contains advertising or affiliate links, it is
                clearly served through standard ad networks and does not influence our
                editorial ratings.
              </p>
              <p>
                For any question about ownership, content, corrections, or business
                inquiries, you can reach us directly at{" "}
                <a
                  href="mailto:hello@craftisle.com"
                  className="font-medium underline underline-offset-2 hover:text-primary"
                >
                  hello@craftisle.com
                </a>
                , or for privacy matters at{" "}
                <a
                  href="mailto:privacy@craftisle.com"
                  className="font-medium underline underline-offset-2 hover:text-primary"
                >
                  privacy@craftisle.com
                </a>
                . See our{" "}
                <Link
                  href="/contact"
                  className="font-medium underline underline-offset-2 hover:text-primary"
                >
                  Contact
                </Link>
                ,{" "}
                <Link
                  href="/privacy"
                  className="font-medium underline underline-offset-2 hover:text-primary"
                >
                  Privacy Policy
                </Link>
                , and{" "}
                <Link
                  href="/terms"
                  className="font-medium underline underline-offset-2 hover:text-primary"
                >
                  Terms of Service
                </Link>{" "}
                for more details.
              </p>
            </div>
          </section>

          {/* Team / Contact CTA */}
          <section className="rounded-lg bg-muted/40 px-6 py-10 text-center">
            <h2 className="text-2xl font-bold">Get in Touch</h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Have a suggestion, found a bug, or want to collaborate? We&apos;d love to hear from you.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Link href="/contact">
                <Button size="lg">Contact Us</Button>
              </Link>
              <Link href="/tools">
                <Button size="lg" variant="outline">
                  Explore Tools
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
