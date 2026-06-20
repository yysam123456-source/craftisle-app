import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/styles/globals.css";
import { fontGeist, fontHeading, fontSans, fontUrban } from "@/assets/fonts";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@/components/analytics";
import CookieConsent from "@/components/cookie-consent";
import ModalProvider from "@/components/modals/providers";
import { ServiceWorkerRegistration } from "@/components/sw-registration";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Craftisle — Play Free HTML5 Games & Tools",
    template: "%s | Craftisle",
  },
  description: "Craftisle is your ultimate island for creative tools and free HTML5 games. Play instantly, no downloads required.",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  // ── GEO: E-E-A-T 信号 ─────────────────────────────────────────
  authors: [{ name: "Craftisle Team", url: "https://craftisle.com/about" }],
  creator: "Craftisle Team",
  publisher: "Craftisle",
  metadataBase: new URL("https://craftisle.com"),
  alternates: {
    canonical: "https://craftisle.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://craftisle.com",
    siteName: "Craftisle",
    title: "Craftisle — Play Free HTML5 Games & Tools",
    description: "Craftisle is your ultimate island for creative tools and free HTML5 games. Play instantly, no downloads required.",
    images: ["https://craftisle.com/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Craftisle — Play Free HTML5 Games & Tools",
    description: "Craftisle is your ultimate island for creative tools and free HTML5 games.",
    images: ["https://craftisle.com/og-image.png"],
    creator: "@craftisle",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Preconnect critical domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://api.craftisle.com" />
        {/* Google Search Console site verification — replace with your actual verification code */}
        {process.env.NEXT_PUBLIC_GSC_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_VERIFICATION} />
        )}
        {/* Monetag site verification */}
        <meta name="monetag" content="95c89403a193eef38bbc05e97d7c067c" />
        {/* Google AdSense - only loads when NEXT_PUBLIC_ADSENSE_CLIENT is set */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontUrban.variable,
          fontHeading.variable,
          fontGeist.variable,
        )}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <ModalProvider>{children}</ModalProvider>
            <Analytics />
            <Toaster richColors closeButton />
            {/* Monetag Vignette Banner — controlled by ADVER_ENABLE */}
            {process.env.NEXT_PUBLIC_ADVER_ENABLE === 'true' && (
              <Script
                  id="monetag-vignette"
                  src="/monetag-vignette.js"
                  strategy="afterInteractive"
                />
            )}
          </ThemeProvider>
        </SessionProvider>
        <CookieConsent />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
