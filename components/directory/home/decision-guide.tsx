import Link from "next/link";
import { ArrowRight, HelpCircle, CheckCircle } from "lucide-react";

/**
 * Quick Decision Guide section
 * Provide simple decision tree based on user needs
 */
export function DecisionGuide() {
  const guides = [
    {
      question: "I need an AI coding assistant",
      options: [
        { text: "I want GitHub integration", href: "/directory/compare/github-copilot/continue-dev", cta: "Compare Copilot vs Continue" },
        { text: "I'm looking for a free option", href: "/directory/resource/artificial-intelligence-0001", cta: "Try ChatGPT" },
        { text: "I need local/private AI", href: "/directory/best/artificial-intelligence", cta: "View Private AI Tools" },
      ],
    },
    {
      question: "I need to design graphics",
      options: [
        { text: "I'm a professional designer", href: "/directory/alternatives/figma", cta: "Figma Alternatives" },
        { text: "I need quick social media graphics", href: "/directory/alternatives/canva-pro", cta: "Canva Pro Alternatives" },
        { text: "I want open-source design tools", href: "/directory/best/design", cta: "Open Source Options" },
      ],
    },
    {
      question: "I want to protect my privacy",
      options: [
        { text: "I want to block ads & trackers", href: "/directory/best/adblock", cta: "Top Ad Blockers" },
        { text: "I need a secure password manager", href: "/directory/alternatives/lastpass", cta: "LastPass Alternatives" },
        { text: "I want anonymous browsing", href: "/directory/alternatives/nordvpn", cta: "NordVPN Alternatives" },
      ],
    },
    {
      question: "I need project management tools",
      options: [
        { text: "I want all-in-one workspace", href: "/directory/alternatives/notion", cta: "Notion Alternatives" },
        { text: "I need simple task tracking", href: "/directory/best/productivity", cta: "Simple Task Tools" },
        { text: "I want open-source PM tools", href: "/directory/best/development", cta: "Open Source PM" },
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
            Not sure which tool fits your needs? Tell us what you're looking for, and we'll point you to the best options.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{opt.text}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Can't find what you're looking for? Try our search — it's pretty good.
          </p>
          <Link href="/directory/search">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Search All Tools
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
