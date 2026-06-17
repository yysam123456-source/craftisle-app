import type { Metadata } from "next";
import SubmitResourcePageClient from "./client";

export const metadata: Metadata = {
  title: "Submit Resource — Get Listed for Free | Craftisle",
  description: "Submit your open-source project, free tool, or resource to Craftisle directory. Free listing, no signup required, dofollow backlink.",
  keywords: ["submit resource", "free directory listing", "add open source project", "Craftisle submit"],
  openGraph: {
    title: "Submit Resource — Get Listed for Free",
    description: "Submit your open-source project or free tool to Craftisle directory.",
    url: "https://craftisle.com/directory/submit",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit Resource — Get Listed for Free",
    description: "Submit your open-source project or free tool to Craftisle directory.",
  },
  alternates: {
    canonical: "https://craftisle.com/directory/submit",
  },
};

export default function SubmitResourcePage() {
  return <SubmitResourcePageClient />;
}
