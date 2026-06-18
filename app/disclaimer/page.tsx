import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Disclaimer | Craftisle",
  description: "Craftisle Disclaimer — legal notices, affiliate disclosure, and third-party content policies.",
  canonical: "https://craftisle.com/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Disclaimer
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Last updated: June 8, 2026
            </p>
          </div>

          <div className="prose prose-gray max-w-none dark:prose-invert">

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">1. General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  The information provided on Craftisle ("the Site") is for general
                  informational and entertainment purposes only. While we strive to keep the
                  information accurate and up to date, we make no representations or warranties
                  of any kind, express or implied, about the completeness, accuracy, reliability,
                  suitability, or availability of the information, products, services, or related
                  graphics contained on the Site.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">2. Third-Party Resources & Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  The Craftisle Resource Directory curates links to third-party websites,
                  tools, and services. We do not control, endorse, or assume responsibility for
                  the content, privacy policies, or practices of any third-party sites. Users
                  access these resources at their own risk and should review the terms and
                  policies of each site before use.
                </p>
                <p>
                  Resource descriptions in our directory are sourced from FMHY,
                  Free-for-Dev, Public APIs, Awesome-Selfhosted, and other community-curated
                  lists. We make reasonable efforts to verify descriptions but cannot guarantee
                  their accuracy.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">3. No Professional Advice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Nothing on the Site constitutes professional advice of any kind (legal,
                  financial, medical, or otherwise). Always consult a qualified professional
                  for advice specific to your situation.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">4. Advertising & Affiliate Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Craftisle displays advertisements through Google AdSense, Monetag, and
                  other third-party advertising networks. These ads are clearly marked or
                  distinguishable from editorial content.
                </p>
                <p>
                  <strong>Affiliate links:</strong> Some links on the Site may be affiliate
                  links, meaning we may earn a commission if you click through and make a
                  purchase or sign up, at no additional cost to you. We only recommend products
                  and services we have researched and believe may be valuable to our users.
                  Our editorial content is not influenced by advertisers or affiliate
                  partnerships.
                </p>
                <p>
                  As an Amazon Associate and participant in other affiliate programs, we may
                  earn from qualifying purchases.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">5. Tool & Game Disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Tools provided on the Site (PDF processing, image conversion, HTML5 games,
                  etc.) are offered "as is" without warranty. Most tools run client-side in
                  your browser; however, we are not responsible for any data loss, corruption,
                  or damage that may occur during use.
                </p>
                <p>
                  Users are advised to back up important files before using our tools and to
                  avoid uploading sensitive data.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">6. Copyright & Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  All trademarks, logos, and brand names displayed on the Site are the property
                  of their respective owners. The mention of any company, product, or service
                  does not imply endorsement.
                </p>
                <p>
                  If you believe any content on the Site infringes your copyright, please
                  contact us at{" "}
                  <a href="mailto:legal@craftisle.com" className="text-primary underline">
                    legal@craftisle.com
                  </a>.{" "}
                  We will respond promptly to valid DMCA notices.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">7. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  In no event shall Craftisle, its owners, or contributors be liable for any
                  direct, indirect, incidental, special, consequential, or punitive damages
                  arising out of your access to or use of the Site. This includes any damages
                  resulting from errors, omissions, interruptions, defects, delays, computer
                  viruses, or loss of data.
                </p>
                <p>
                  Your use of the Site is at your sole risk. The Site is provided on an "AS IS"
                  and "AS AVAILABLE" basis.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">8. Changes to This Disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  We reserve the right to update this Disclaimer at any time. Changes will be
                  posted on this page with a revised date. Continued use of the Site after
                  changes constitutes acceptance of the updated Disclaimer.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
