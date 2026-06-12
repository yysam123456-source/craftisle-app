import Link from "next/link";
import { ArrowRight, HelpCircle, CheckCircle } from "lucide-react";

/**
 * 快速决策指南板块
 * 根据用户需求，提供简单的决策树
 */
export function DecisionGuide() {
  const guides = [
    {
      question: "想要 AI 助手？",
      options: [
        { text: "需要写代码", href: "/directory/compare/github-copilot/cursor", cta: "Copilot vs Cursor" },
        { text: "需要写文章", href: "/directory/resource/artificial-intelligence-0001", cta: "ChatGPT" },
        { text: "需要学习助手", href: "/directory/resource/artificial-intelligence-0006", cta: "NotebookLM" },
      ],
    },
    {
      question: "想要设计工具？",
      options: [
        { text: "专业 UI 设计", href: "/directory/alternatives/figma", cta: "Figma 替代品" },
        { text: "快速做图", href: "/directory/resource/design-0001", cta: "Canva" },
        { text: "开源设计工具", href: "/directory/best/design", cta: "开源设计工具排行" },
      ],
    },
    {
      question: "想要隐私工具？",
      options: [
        { text: "拦截广告", href: "/directory/best/adblock", cta: "广告拦截工具排行" },
        { text: "加密通讯", href: "/directory/resource/privacy-0001", cta: "Signal" },
        { text: "匿名浏览", href: "/directory/resource/privacy-0002", cta: "Tor Browser" },
      ],
    },
  ];

  return (
    <div className="py-12 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            快速决策指南
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            不知道选哪个工具？根据你对需求，快速找到合适的工具
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
