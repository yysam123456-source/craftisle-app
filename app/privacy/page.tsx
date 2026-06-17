import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Privacy Policy | Craftisle",
  description: "Craftisle Privacy Policy — how we collect, use, and protect your information.",
  canonical: "https://craftisle.com/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Shared nav is inherited from (marketing)/layout */}

      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Last updated: June 7, 2026
            </p>
          </div>

          <div className="prose prose-gray max-w-none dark:prose-invert">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">1. Information We Do Not Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Craftisle is a collection of client-side tools and games. Most tools run
                  entirely in your browser. We do <strong>not</strong> collect, store, or transmit
                  the files you process (PDFs, images, text, etc.) to any server. Your data
                  stays on your device.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">2. Information We Do Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  We collect limited data necessary to operate and improve the site:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Usage data:</strong> pages visited, browser type, referrer,
                    approximate location (country level only), collected via standard analytics.
                  </li>
                  <li>
                    <strong>Cookies:</strong> see Section 4 below.
                  </li>
                  <li>
                    <strong>Voluntary contact:</strong> if you email us, we receive your
                    email address and message content.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">3. How We Use Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>To operate and maintain the site;</li>
                  <li>To understand how users interact with tools and games;</li>
                  <li>To detect and prevent technical abuse;</li>
                  <li>To display contextual advertisements (see Section 5).</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">4. Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  We use cookies for basic site functionality and analytics. Third-party
                  advertising partners (including Google AdSense and Media.net) may set cookies
                  to display personalized ads. You can control cookies through your browser
                  settings.
                </p>
                <p>
                  For EU/UK users: we request consent before loading non-essential cookies.
                  You may withdraw consent at any time.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">5. Advertising Partners</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  We use third-party advertising networks to serve ads on Craftisle:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Google AdSense</strong> — privacy policy:{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      https://policies.google.com/privacy
                    </a>
                  </li>
                  <li>
                    <strong>Media.net</strong> — privacy policy:{" "}
                    <a
                      href="https://www.media.net/privacy-policy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      https://www.media.net/privacy-policy/
                    </a>
                  </li>
                </ul>
                <p>
                  These partners may use cookies to serve ads based on your prior visits to
                  our website or other websites. You may opt out of personalized advertising
                  by visiting{" "}
                  <a
                    href="https://www.aboutads.info/choices"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    aboutads.info/choices
                  </a>.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">6. Data Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Because most data processing happens client-side, your files are never
                  uploaded to our servers. We follow industry-standard practices to secure
                  any data we do collect.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">7. Children&apos;s Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Craftisle is not directed at children under 13. We do not knowingly
                  collect personal information from children under 13. If you believe we
                  have inadvertently collected such information, please contact us.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">8. Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  We may update this Privacy Policy from time to time. The latest version
                  will always be posted on this page with a revised &quot;Last updated&quot;
                  date.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">9. Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  If you have any questions about this Privacy Policy, please contact us at{" "}
                  <a
                    href="mailto:privacy@craftisle.com"
                    className="text-primary underline"
                  >
                    privacy@craftisle.com
                  </a>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer is inherited from (marketing)/layout */}
    </div>
  );
}
