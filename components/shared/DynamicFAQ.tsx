/**
 * DynamicFAQ - 动态 FAQ 段落组件（SEO 优化）
 * 用于对比页面等需要动态生成 FAQ 的场景
 */
interface FAQItem {
  q: string;
  a: string;
}

interface DynamicFAQProps {
  items: FAQItem[];
  title?: string;
}

export function DynamicFAQ({ items, title = "Frequently Asked Questions" }: DynamicFAQProps) {
  if (!items || items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(item => ({
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
      <section className="mt-12 border-t pt-12">
        <h2 className="text-2xl font-bold mb-8 text-center">{title}</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h3 className="font-medium text-base mb-2">{item.q}</h3>
              <p className="text-sm text-muted-foreground">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
