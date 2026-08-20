import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle
} from "@/components/ui/glass-card";
import { Mail, MapPin, Globe, ExternalLink } from "lucide-react";
import { constructMetadata } from "@/lib/utils";
import { ContactForm } from "@/components/contact-form";

export const metadata = constructMetadata({
  title: "Contact",
  description: "Get in touch with Craftisle — suggestions, bug reports, or collaboration inquiries.",
  canonical: "https://craftisle.com/contact",
});

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Contact Us
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Have a suggestion, found a bug, or want to collaborate? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Contact form */}
            <div className="md:col-span-2">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Send us a message</GlassCardTitle>
                  <GlassCardDescription>
                    We typically reply within 2 business days.
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <ContactForm />
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Sidebar — contact info */}
            <div className="space-y-4">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="text-base">Contact Information</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">General Inquiry</p>
                      <a
                        href="mailto:hello@craftisle.com"
                        className="hover:underline"
                      >
                        hello@craftisle.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Privacy / DPO</p>
                      <a
                        href="mailto:privacy@craftisle.com"
                        className="hover:underline"
                      >
                        privacy@craftisle.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Location</p>
                      <p>Operated remotely</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Website</p>
                      <a
                        href="https://craftisle.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        craftisle.com <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="text-base">Report a Bug</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="text-sm text-muted-foreground">
                  <p>
                    Found a broken tool? Email us directly at{" "}
                    <a
                      href="mailto:hello@craftisle.com?subject=Bug%20Report"
                      className="text-primary underline"
                    >
                      hello@craftisle.com
                    </a>{" "}
                    with steps to reproduce.
                  </p>
                </GlassCardContent>
              </GlassCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
