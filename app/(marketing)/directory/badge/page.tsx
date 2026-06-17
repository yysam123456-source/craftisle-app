import BadgePageClient from "./client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Craftisle Badge — Show You're Listed | Craftisle",
  description: "Get the Craftisle badge for your open-source project or website. Show visitors your resource is listed in our free directory.",
  keywords: ["Craftisle badge", "open source badge", "listed on Craftisle", "free directory badge"],
  canonical: "https://craftisle.com/directory/badge",
});

export default function BadgePage() {
  return <BadgePageClient />;
}
