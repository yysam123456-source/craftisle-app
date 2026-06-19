import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle
} from "@/components/ui/glass-card";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Terms of Service | Craftisle",
  description: "Craftisle Terms of Service — the rules and guidelines for using our website and services.",
  canonical: "https://craftisle.com/terms",
});

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: June 9, 2026</p>
          </div>

          <div className="prose prose-gray max-w-none dark:prose-invert space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg">1. Acceptance of Terms</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="text-muted-foreground text-sm leading-relaxed space-y-2">
                <p>
                  By accessing or using Craftisle (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg">2. Description of Service</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="text-muted-foreground text-sm leading-relaxed space-y-2">
                <p>
                  Craftisle provides a curated directory of free online tools and resources, free browser-based HTML5 games, and productivity tools. The Service is provided &quot;as is&quot; without warranties of any kind.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg">3. Use of the Service</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="text-muted-foreground text-sm leading-relaxed space-y-2">
                <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
                  <li>Attempt to gain unauthorized access to any portion of the Service</li>
                  <li>Interfere with or disrupt the integrity or performance of the Service</li>
                  <li>Scrape, crawl, or index the Service without prior written permission</li>
                  <li>Use the Service to transmit spam or unsolicited messages</li>
                </ul>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg">4. Directory Content &amp; Third-Party Links</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="text-muted-foreground text-sm leading-relaxed space-y-2">
                <p>
                  The Craftisle directory contains links to third-party websites. Craftisle does not endorse, control, or take responsibility for the content, privacy policies, or practices of any third-party sites or services. We encourage you to read the terms and privacy policies of any third-party sites you visit.
                </p>
                <p>
                  Resources listed in the directory are curated from publicly available sources including FMHY and other community-maintained lists. We make reasonable efforts to ensure accuracy but cannot guarantee that all links are current or that all resources are free.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg">5. Intellectual Property</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="text-muted-foreground text-sm leading-relaxed space-y-2">
                <p>
                  The Craftisle website design, logo, and original content are owned by Craftisle. The directory data is curated from open community sources and properly attributed. Tools listed in the directory are owned by their respective creators.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg">6. Disclaimer of Warranties</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="text-muted-foreground text-sm leading-relaxed space-y-2">
                <p>
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND. CRAFTISLE DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg">7. Limitation of Liability</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="text-muted-foreground text-sm leading-relaxed space-y-2">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRAFTISLE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg">8. Advertising &amp; Sponsored Content</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="text-muted-foreground text-sm leading-relaxed space-y-2">
                <p>
                  Craftisle may display advertisements via Google AdSense or other advertising networks. Sponsored listings or recommended resources are clearly labeled as &quot;Sponsored&quot; or &quot;Advertisement&quot;. We only recommend resources we believe provide genuine value to users.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg">9. Changes to Terms</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="text-muted-foreground text-sm leading-relaxed space-y-2">
                <p>
                  We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated revision date. Continued use of the Service after changes constitutes acceptance of the new Terms.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg">10. Contact</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="text-muted-foreground text-sm leading-relaxed">
                <p>
                  If you have questions about these Terms, please contact us through our{" "}
                  <a href="/contact" className="text-primary underline">Contact page</a>.
                </p>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}
