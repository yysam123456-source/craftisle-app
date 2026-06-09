import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Cookie Policy | Craftisle",
  description: "Craftisle Cookie Policy — how we use cookies and similar tracking technologies.",
  alternates: {
    canonical: "https://craftisle.com/cookie-policy",
  },
};

export default function CookiePolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Cookie Policy</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: June 9, 2026</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What Are Cookies?</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-relaxed">
                <p>
                  Cookies are small text files placed on your device when you visit a website. They help websites remember your preferences and improve your experience. This policy explains how Craftisle uses cookies and similar technologies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cookies We Use</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-relaxed space-y-4">
                <div>
                  <p className="font-medium text-foreground mb-1">1. Essential Cookies</p>
                  <p>
                    Required for the website to function properly. These include session cookies for authentication and security tokens. These cannot be disabled.
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><code className="text-xs bg-muted px-1 rounded">next-auth.session-token</code> — Authentication session (httpOnly)</li>
                    <li><code className="text-xs bg-muted px-1 rounded">__Secure-next-auth.*</code> — Secure auth cookies</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">2. Preference Cookies</p>
                  <p>
                    Store your preferences to improve your experience. Stored in localStorage (not cookies technically, but similar in purpose).
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><code className="text-xs bg-muted px-1 rounded">craftisle-tool-favorites</code> — Your saved favorite resources (localStorage)</li>
                    <li><code className="text-xs bg-muted px-1 rounded">theme</code> — Light/dark mode preference (localStorage)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">3. Analytics Cookies</p>
                  <p>
                    Help us understand how visitors use our site. We use Vercel Analytics and may use Google Analytics 4. These collect anonymous usage data.
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><code className="text-xs bg-muted px-1 rounded">_va</code> — Vercel Analytics (anonymous)</li>
                    <li><code className="text-xs bg-muted px-1 rounded">_ga, _ga_*</code> — Google Analytics 4 (anonymous, if enabled)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">4. Advertising Cookies</p>
                  <p>
                    If Google AdSense is enabled, Google may set advertising cookies to show relevant ads. These cookies track browsing activity across sites.
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><code className="text-xs bg-muted px-1 rounded">IDE, DSID</code> — Google DoubleClick advertising cookies</li>
                    <li><code className="text-xs bg-muted px-1 rounded">__gads</code> — Google Ads performance cookies</li>
                  </ul>
                  <p className="mt-2">
                    You can opt out of Google advertising cookies at{" "}
                    <a
                      href="https://adssettings.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      adssettings.google.com
                    </a>.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Managing Cookies</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-relaxed space-y-2">
                <p>You can control cookies through your browser settings:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                  <li><strong>Firefox:</strong> Options → Privacy &amp; Security → Cookies</li>
                  <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                  <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies</li>
                </ul>
                <p className="mt-3">
                  Note: Disabling essential cookies may prevent some features from working correctly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GDPR &amp; CCPA Rights</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-relaxed space-y-2">
                <p>
                  If you are in the EU/EEA (GDPR) or California (CCPA), you have the right to:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Know what personal data we collect</li>
                  <li>Request deletion of your data</li>
                  <li>Opt out of data sale (we do not sell personal data)</li>
                  <li>Withdraw consent for non-essential cookies</li>
                </ul>
                <p className="mt-3">
                  To exercise these rights, contact us via our{" "}
                  <a href="/contact" className="text-primary underline">Contact page</a>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-relaxed">
                <p>
                  We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
