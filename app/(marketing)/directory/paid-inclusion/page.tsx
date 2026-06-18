import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { constructMetadata } from "@/lib/utils";

const TIERS = [
  {
    name: "Basic",
    price: 19,
    description: "Faster review and standard listing.",
    features: [
      "Review within 2 business days",
      "Standard listing in category",
      "Do-follow backlink",
      "Basic listing in search results",
    ],
  },
  {
    name: "Featured",
    price: 49,
    description: "Priority placement and homepage exposure.",
    featured: true,
    features: [
      "Review within 24 hours",
      "Featured badge on listing",
      "Pinned at top of category",
      "Homepage showcase (7 days)",
      "Social media shout-out",
      "Do-follow backlink",
    ],
  },
];

export const metadata = constructMetadata({
  title: "Paid Inclusion | Craftisle Directory",
  description: "Get your resource listed faster with paid inclusion options.",
  canonical: "https://craftisle.com/directory/paid-inclusion",
});

export default function PaidInclusionPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <Badge className="mb-4" variant="outline">Paid Inclusion</Badge>
        <h1 className="text-4xl font-bold mb-4">
          Get Your Resource <span className="text-primary">Featured</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Skip the queue. Get reviewed and listed faster with our paid inclusion
          options.
        </p>
      </div>

      {/* 价格卡片 */}
      <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-3xl mx-auto">
        {TIERS.map((tier) => (
          <Card
            key={tier.name}
            className={`p-8 relative ${tier.featured ? "border-primary shadow-lg" : ""}`}
          >
            {tier.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-white">Most Popular</Badge>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
              <div className="text-4xl font-bold">
                ${tier.price}
                <span className="text-base font-normal text-gray-500">/listing</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{tier.description}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>

            <a
              href={`/directory/submit?priority=${tier.price}`}
              className={cn(
                buttonVariants({ variant: tier.featured ? "default" : "outline" }),
                "w-full no-underline text-center block"
              )}
            >
              Get Started
            </a>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 text-center">Frequently Asked</h2>
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-medium mb-2">How long does review take?</h3>
            <p className="text-sm text-gray-600">
              Basic: within 2 business days. Featured: within 24 hours.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-medium mb-2">What if my resource is rejected?</h3>
            <p className="text-sm text-gray-600">
              We'll refund in full if your resource doesn't meet our guidelines.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-medium mb-2">Can I upgrade later?</h3>
            <p className="text-sm text-gray-600">
              Yes! Contact us after submitting and we'll help you upgrade to Featured.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
