import Link from "next/link";
import { ArrowRight, HelpCircle, CheckCircle } from "lucide-react";

/**
 * Quick Decision Guide section
 * Provide simple decision tree based on user needs
 */
export function DecisionGuide() {
  const guides = [
    {
      question: "Need AI Assistant?",
      options: [
        { text: "Need coding help", href: "/directory/compare/github-copilot/cursor", cta: "Copilot vs Cursor" },
        { text: "Need writing help", href: "/directory/resource/artificial-intelligence-0001", cta: "ChatGPT" },
        { text: "Need learning help", href: "/directory/resource/artificial-intelligence-0006", cta: "NotebookLM" },
      ],
    },
    {
      question: "Need Design Tools?",
      options: [
        { text: "Professional UI design", href: "/directory/alternatives/figma", cta: "Figma Alternatives" },
        { text: "Quick graphics", href: "/directory/resource/design-0001", cta: "Canva" },
        { text: "Open source design tools", href: "/directory/best/design", cta: "Open Source Design Tools" },
      ],
    },
    {
      question: "Need Privacy Tools?",
      options: [
        { text: "Block ads", href: "/directory/best/adblock", cta: "Ad Blockers Ranking" },
        { text: "Encrypted messaging", href: "/directory/resource/privacy-0001", cta: "Signal" },
        { text: "Anonymous browsing", href: "/directory/resource/privacy-0002", cta: "Tor Browser" },
      ],
    },
  ];

  return (
    <div className="py-12 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Quick Decision Guide
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Not sure which tool to choose? Quickly find the right tool based on your needs
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {guides.map((guide, idx) => (
            <div key={idx} className="bg-background rounded-xl border p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">{guide.question}</h3>
              </div>
              <div className="space-y-3">
                {guide.options.map((opt, i) => (
                  <Link key={i} href={opt.href} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/40 hover:bg-muted/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm">{opt.text}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
