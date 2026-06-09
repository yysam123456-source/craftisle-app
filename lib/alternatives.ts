/**
 * alternatives.ts
 * 付费工具 → 免费替代品映射表
 * Google合规：每个替代品必须链接到真实资源，不做SEO堆砌
 */

export interface AlternativeEntry {
  /** 付费/主流工具名称 */
  paidTool: string;
  /** 简短描述这个付费工具是什么 */
  description: string;
  /** 免费替代品（对应 fmhy-resources.json 中的资源 id 或直接 URL） */
  alternatives: {
    name: string;
    resourceId?: string; // 对应 fmhy-resources.json 中的 id
    url?: string; // 直接外链（当没有 resourceId 时）
    reason: string; // 为什么推荐这个替代品
    isFree: boolean;
    isOpenSource: boolean;
  }[];
  category: string;
  seoKeywords: string[];
}

export const ALTERNATIVES_MAP: Record<string, AlternativeEntry> = {
  ChatGPT: {
    paidTool: "ChatGPT",
    description:
      "ChatGPT is an AI chatbot by OpenAI. The free tier has usage limits; ChatGPT Plus costs $20/month.",
    alternatives: [
      {
        name: "Claude",
        url: "https://claude.ai",
        reason: "Anthropic's AI assistant with a generous free tier, excellent for writing and analysis.",
        isFree: true,
        isOpenSource: false,
      },
      {
        name: "Google Gemini",
        url: "https://gemini.google.com",
        reason: "Google's AI assistant, free with a Google account, integrates with Google Workspace.",
        isFree: true,
        isOpenSource: false,
      },
      {
        name: "DeepSeek",
        url: "https://chat.deepseek.com",
        reason: "High-performance open-source AI with a free web interface, strong at coding and reasoning.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Qwen",
        url: "https://chat.qwen.ai",
        reason: "Alibaba's multilingual AI assistant, free to use, strong on Asian languages.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "AI Tools",
    seoKeywords: ["chatgpt free alternative", "free ai chatbot", "chatgpt replacement"],
  },
  Photoshop: {
    paidTool: "Adobe Photoshop",
    description:
      "Adobe Photoshop is the industry-standard image editing software. Subscription costs $20.99/month.",
    alternatives: [
      {
        name: "Photopea",
        url: "https://www.photopea.com",
        reason: "Free browser-based Photoshop alternative that opens and saves PSD files natively.",
        isFree: true,
        isOpenSource: false,
      },
      {
        name: "GIMP",
        url: "https://www.gimp.org",
        reason: "The most powerful free and open-source image editor, available for all platforms.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Krita",
        url: "https://krita.org",
        reason: "Free and open-source digital painting software, great for illustration and concept art.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Creative Tools",
    seoKeywords: ["free photoshop alternative", "photoshop free replacement", "open source photoshop"],
  },
  Notion: {
    paidTool: "Notion",
    description:
      "Notion is an all-in-one workspace for notes, docs, and project management. Paid plans start at $8/month.",
    alternatives: [
      {
        name: "Obsidian",
        url: "https://obsidian.md",
        reason: "Free personal knowledge base with local-first storage, Markdown support, and a rich plugin ecosystem.",
        isFree: true,
        isOpenSource: false,
      },
      {
        name: "AppFlowy",
        url: "https://appflowy.io",
        reason: "Open-source Notion alternative with self-hosting support and full offline access.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Logseq",
        url: "https://logseq.com",
        reason: "Free, open-source outliner and knowledge management tool with bidirectional linking.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Productivity",
    seoKeywords: ["free notion alternative", "notion replacement", "open source notion"],
  },
  Grammarly: {
    paidTool: "Grammarly",
    description:
      "Grammarly is an AI writing assistant. The Premium plan costs $12/month.",
    alternatives: [
      {
        name: "LanguageTool",
        url: "https://languagetool.org",
        reason: "Free grammar checker with browser extension, supports 30+ languages.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Hemingway Editor",
        url: "https://hemingwayapp.com",
        reason: "Free online writing tool that highlights complex sentences and readability issues.",
        isFree: true,
        isOpenSource: false,
      },
    ],
    category: "Writing Tools",
    seoKeywords: ["free grammarly alternative", "grammarly replacement", "free grammar checker"],
  },
  Spotify: {
    paidTool: "Spotify Premium",
    description:
      "Spotify Premium removes ads and allows offline listening. Costs $9.99/month.",
    alternatives: [
      {
        name: "YouTube Music",
        url: "https://music.youtube.com",
        reason: "Free with ads, huge library including user-uploaded music not on other platforms.",
        isFree: true,
        isOpenSource: false,
      },
      {
        name: "Libre.fm",
        url: "https://libre.fm",
        reason: "Free and open-source music streaming and scrobbling platform.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Music",
    seoKeywords: ["free spotify alternative", "spotify replacement", "free music streaming"],
  },
  Figma: {
    paidTool: "Figma",
    description:
      "Figma is a professional UI/UX design tool. Pro plans start at $12/month per editor.",
    alternatives: [
      {
        name: "Penpot",
        url: "https://penpot.app",
        reason: "Free and open-source design tool, Figma-compatible, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Lunacy",
        url: "https://icons8.com/lunacy",
        reason: "Free desktop design tool compatible with Sketch and Figma files.",
        isFree: true,
        isOpenSource: false,
      },
    ],
    category: "Design Tools",
    seoKeywords: ["free figma alternative", "figma replacement", "open source design tool"],
  },
  "Microsoft Office": {
    paidTool: "Microsoft Office",
    description:
      "Microsoft Office 365 subscription costs $6.99/month for personal use.",
    alternatives: [
      {
        name: "LibreOffice",
        url: "https://www.libreoffice.org",
        reason: "The most complete free and open-source office suite, compatible with Microsoft formats.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Google Docs",
        url: "https://docs.google.com",
        reason: "Free browser-based office suite with real-time collaboration, no downloads needed.",
        isFree: true,
        isOpenSource: false,
      },
      {
        name: "OnlyOffice",
        url: "https://www.onlyoffice.com",
        reason: "Free and open-source office suite with high MS Office format compatibility.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Productivity",
    seoKeywords: ["free microsoft office alternative", "office suite free", "word excel powerpoint free alternative"],
  },
  "Adobe Premiere": {
    paidTool: "Adobe Premiere Pro",
    description:
      "Adobe Premiere Pro is a professional video editor. Subscription costs $54.99/month.",
    alternatives: [
      {
        name: "DaVinci Resolve",
        url: "https://www.blackmagicdesign.com/products/davinciresolve",
        reason: "Professional-grade free video editor used by Hollywood, with advanced color grading.",
        isFree: true,
        isOpenSource: false,
      },
      {
        name: "Kdenlive",
        url: "https://kdenlive.org",
        reason: "Free and open-source video editor with a multi-track timeline and many effects.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "OpenShot",
        url: "https://www.openshot.org",
        reason: "Simple, free, and open-source video editor, great for beginners.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Video Tools",
    seoKeywords: ["free adobe premiere alternative", "premiere pro free replacement", "free video editor"],
  },
  "1Password": {
    paidTool: "1Password",
    description:
      "1Password is a popular password manager. Individual plan costs $2.99/month.",
    alternatives: [
      {
        name: "Bitwarden",
        url: "https://bitwarden.com",
        reason: "Free, open-source password manager with end-to-end encryption and cross-platform sync.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "KeePass",
        url: "https://keepass.info",
        reason: "Free and open-source offline password manager, no cloud required.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Security",
    seoKeywords: ["free 1password alternative", "password manager free", "bitwarden vs 1password"],
  },
  Zoom: {
    paidTool: "Zoom",
    description:
      "Zoom's free plan limits meetings to 40 minutes. Pro plan costs $14.99/month.",
    alternatives: [
      {
        name: "Jitsi Meet",
        url: "https://meet.jit.si",
        reason: "Free and open-source video conferencing with no time limits, no account required.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Google Meet",
        url: "https://meet.google.com",
        reason: "Free video calling with a Google account, 60-minute limit removed for 1:1 calls.",
        isFree: true,
        isOpenSource: false,
      },
    ],
    category: "Communication",
    seoKeywords: ["free zoom alternative", "zoom replacement", "free video conferencing"],
  },
};

/** 获取替代品条目（通过 slug 查找） */
export function getAlternativeBySlug(slug: string): AlternativeEntry | null {
  const entry = Object.entries(ALTERNATIVES_MAP).find(
    ([key]) => key.toLowerCase().replace(/\s+/g, "-") === slug
  );
  return entry ? entry[1] : null;
}

/** 获取所有替代品 slug 列表（用于 generateStaticParams） */
export function getAllAlternativeSlugs(): string[] {
  return Object.keys(ALTERNATIVES_MAP).map((key) =>
    key.toLowerCase().replace(/\s+/g, "-")
  );
}
