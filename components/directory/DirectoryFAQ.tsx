import Link from "next/link";

/**
 * DirectoryFAQ - FAQ 段落组件（SEO 优化）
 * 用于目录首页，添加 FAQ 段落 + FAQPage JSON-LD
 */
export function DirectoryFAQ() {
  const faqs = [
    {
      q: "What is Craftisle Directory?",
      a: "Craftisle Directory is a curated collection of 16,000+ free and open-source software tools across 200+ categories. All tools are carefully reviewed and organized for easy discovery. 100% free, no signup required.",
    },
    {
      q: "Are all tools really free?",
      a: "Yes, all tools in our directory are either completely free (no payment required) or open-source (you can inspect the code). We clearly label each tool's pricing model so you know exactly what to expect.",
    },
    {
      q: "How do I find alternatives to paid software?",
      a: 'Use our search feature to find free alternatives. For example, search "Notion alternative" or "Photoshop alternative" to see a list of free and open-source alternatives to popular paid tools.',
    },
    {
      q: "Can I suggest a tool to add?",
      a: 'Absolutely! We welcome suggestions from the community. Use our "Submit Tool" feature (coming soon) or contact us via GitHub to suggest a free or open-source tool that should be included in our directory.',
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(item => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      {/* FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* FAQ Section */}
      <section className="py-16 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-medium text-base mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
