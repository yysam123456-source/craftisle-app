import SubmitResourcePageClient from "./client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Submit Resource — Get Listed for Free",
  description: "Submit your open-source project, free tool, or resource to Craftisle directory. Free listing, no signup required, dofollow backlink.",
  keywords: ["submit resource", "free directory listing", "add open source project", "Craftisle submit"],
  canonical: "https://craftisle.com/directory/submit",
});

export default function SubmitResourcePage() {
  return <SubmitResourcePageClient />;
}
