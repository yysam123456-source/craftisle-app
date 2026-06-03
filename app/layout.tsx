import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

import { fontGeist, fontHeading, fontSans, fontUrban } from "@/assets/fonts";

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
};
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@/components/analytics";
import ModalProvider from "@/components/modals/providers";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ModalProvider>{children}</ModalProvider>
            <Analytics />
            <Toaster richColors closeButton />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
