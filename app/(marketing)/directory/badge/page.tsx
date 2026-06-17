import type { Metadata } from "next";
import BadgePageClient from "./client";

export const metadata: Metadata = {
  title: "Craftisle Badge — Show You're Listed | Craftisle",
  description: "Get the Craftisle badge for your open-source project or website. Show visitors your resource is listed in our free directory.",
  keywords: ["Craftisle badge", "open source badge", "listed on Craftisle", "free directory badge"],
  openGraph: {
    title: "Craftisle Badge — Show You're Listed",
    description: "Get the Craftisle badge for your open-source project or website.",
    url: "https://craftisle.com/directory/badge",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Craftisle Badge — Show You're Listed",
    description: "Get the Craftisle badge for your open-source project or website.",
  },
  alternates: {
    canonical: "https://craftisle.com/directory/badge",
  },
};

export default function BadgePage() {
  return <BadgePageClient />;
}
