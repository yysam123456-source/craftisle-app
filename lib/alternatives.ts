/**
 * alternatives.ts
 * 付费工具 → 免费替代品映射表
 * Google合规：每个替代品必须链接到真实资源，不做SEO堆砌
 *
 * 数据来源：
 * 1. 手工维护的 ALTERNATIVES_MAP（默认）
 * 2. public/data/alternatives-import.json（程序化批量导入，优先级更高）
 */

import { readFileSync } from "fs";
import { join } from "path";

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
    isSelfHosted?: boolean; // 是否支持自部署
  }[];
  category: string;
  seoKeywords: string[];
  /** FAQ 区块（SEO + 用户决策辅助） */
  faqs?: { question: string; answer: string }[];
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
    faqs: [
      { question: "Is there a free alternative to ChatGPT?", answer: "Yes. Claude, Google Gemini, DeepSeek, and Qwen all offer free AI chatbot experiences. DeepSeek and Qwen are fully open-source." },
      { question: "Is ChatGPT open source?", answer: "No. ChatGPT is proprietary. For open-source alternatives, try DeepSeek or Qwen." },
      { question: "What is the best free AI chatbot?", answer: "It depends on your needs. DeepSeek excels at coding, Claude at long-form writing, Gemini at Google Workspace integration." },
      { question: "Can I use ChatGPT alternatives for free?", answer: "Yes. All alternatives listed above have free tiers with no credit card required." },
      { question: "Which ChatGPT alternative is best for coding?", answer: "DeepSeek offers strong coding capabilities for free, and Continue + Cline are open-source coding assistants." },
    ],
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
    faqs: [
      { question: "Is there a free alternative to Photoshop?", answer: "Yes. Photopea runs in the browser and opens PSD files, while GIMP is a powerful open-source desktop editor." },
      { question: "Is Photoshop open source?", answer: "No. Adobe Photoshop is proprietary. GIMP and Krita are open-source alternatives." },
      { question: "What is the best free photo editor?", answer: "Photopea is the closest to Photoshop in the browser. GIMP offers the most features as a desktop app." },
      { question: "Can I edit PSD files for free?", answer: "Yes. Photopea opens and saves PSD files natively in the browser for free." },
      { question: "Which free image editor is best for digital painting?", answer: "Krita is specifically designed for digital painting and illustration, and is fully open-source." },
    ]
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
    faqs: [
      { question: "Is there a free alternative to Notion?", answer: "Yes. Obsidian, AppFlowy, and Logseq are all free alternatives with different strengths." },
      { question: "Is Notion open source?", answer: "No. Notion is proprietary. AppFlowy and Logseq are open-source alternatives." },
      { question: "What is the best free note-taking app?", answer: "Obsidian is best for local-first knowledge management, while AppFlowy offers a Notion-like experience with self-hosting." },
      { question: "Can I self-host a Notion alternative?", answer: "Yes. AppFlowy and Outline support self-hosting for full data control." },
      { question: "Which Notion alternative works offline?", answer: "Obsidian and AppFlowy both work fully offline, storing data locally on your device." },
    ]
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
    faqs: [
      { question: "Is there a free alternative to Grammarly?", answer: "Yes. LanguageTool is a free open-source grammar checker that supports 30+ languages." },
      { question: "Is Grammarly free?", answer: "Grammarly has a limited free tier. LanguageTool offers more features for free and is open-source." },
      { question: "What is the best free grammar checker?", answer: "LanguageTool offers the most comprehensive free grammar checking with browser extensions and multi-language support." },
      { question: "Can I use a grammar checker without signing up?", answer: "Yes. Both LanguageTool and Hemingway Editor work in the browser without an account." },
    ]
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
    faqs: [
      { question: "Is there a free alternative to Spotify?", answer: "Yes. YouTube Music offers free streaming with ads, and Libre.fm is an open-source music platform." },
      { question: "Can I listen to music for free without ads?", answer: "Libre.fm is ad-free and open-source, though its catalog is smaller than Spotify." },
      { question: "What is the best free music streaming service?", answer: "YouTube Music has the largest free library. Libre.fm is best for open-source enthusiasts." },
    ]
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
    faqs: [
      { question: "Is there a free alternative to Figma?", answer: "Yes. Penpot is a free open-source design tool that works in the browser and is self-hostable." },
      { question: "Is Figma open source?", answer: "No. Figma is proprietary. Penpot is the leading open-source alternative." },
      { question: "Can I self-host a design tool?", answer: "Yes. Penpot can be self-hosted, giving you full control over your design files." },
      { question: "Which Figma alternative supports real-time collaboration?", answer: "Penpot supports real-time collaboration in the browser, similar to Figma." },
    ]
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
    faqs: [
      { question: "Is there a free alternative to Microsoft Office?", answer: "Yes. LibreOffice, Google Docs, and OnlyOffice are all free alternatives." },
      { question: "Is LibreOffice compatible with Microsoft Office files?", answer: "Yes. LibreOffice can open, edit, and save .docx, .xlsx, and .pptx files." },
      { question: "Can I use an office suite without Microsoft?", answer: "Yes. Google Docs works in the browser, and LibreOffice is a full desktop suite — both free." },
      { question: "Which free office suite is best for collaboration?", answer: "Google Docs excels at real-time collaboration. OnlyOffice offers self-hosted collaboration." },
    ]
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
    faqs: [
      { question: "Is there a free alternative to Adobe Premiere Pro?", answer: "Yes. DaVinci Resolve, Kdenlive, and OpenShot are all free video editors." },
      { question: "Is DaVinci Resolve really free?", answer: "Yes. DaVinci Resolve has a fully functional free version used by professional filmmakers." },
      { question: "What is the best free video editor?", answer: "DaVinci Resolve is the most powerful free editor. Kdenlive is great for open-source users." },
      { question: "Can I edit 4K video for free?", answer: "Yes. DaVinci Resolve and Kdenlive both support 4K editing at no cost." },
    ]
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
    faqs: [
      { question: "Is there a free alternative to 1Password?", answer: "Yes. Bitwarden and KeePass are free open-source password managers." },
      { question: "Is Bitwarden really free?", answer: "Yes. Bitwarden core features including cross-platform sync are completely free." },
      { question: "Can I use a password manager offline?", answer: "Yes. KeePass and KeePassXC work entirely offline with local encrypted databases." },
      { question: "Is Bitwarden safe?", answer: "Yes. Bitwarden is open-source, audited, and uses end-to-end encryption. You can also self-host it." },
    ],
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
    faqs: [
      { question: "Is there a free alternative to Zoom?", answer: "Yes. Jitsi Meet and Google Meet are both free video conferencing tools." },
      { question: "Is Jitsi Meet really free?", answer: "Yes. Jitsi Meet is completely free, open-source, and requires no account to start a meeting." },
      { question: "Does Jitsi have a time limit?", answer: "No. Jitsi Meet has no time limits on meetings, unlike Zoom 40-minute free tier limit." },
      { question: "Can I self-host a video conferencing solution?", answer: "Yes. Jitsi Meet can be self-hosted for full control over your video infrastructure." },
    ]
  },
  Slack: {
    paidTool: "Slack",
    description:
      "Slack is a team communication platform. Pro plan costs $7.25/month per user; free tier limits message history to 90 days.",
    alternatives: [
      {
        name: "Mattermost",
        url: "https://mattermost.com",
        reason: "Open-source Slack alternative with self-hosting, unlimited message history, and enterprise features.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Element",
        url: "https://element.io",
        reason: "Free and open-source messaging built on the Matrix protocol, end-to-end encrypted, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Zulip",
        url: "https://zulip.com",
        reason: "Free open-source team chat with topic-based threading, better for organized discussions than Slack.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Rocket.Chat",
        url: "https://rocket.chat",
        reason: "Fully open-source team communication platform, self-hostable, supports omnichannel and real-time translation.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Communication",
    seoKeywords: ["free slack alternative", "slack replacement", "open source team chat", "self-hosted slack"],
    faqs: [
      { question: "Is there a free alternative to Slack?", answer: "Yes. Mattermost, Element, Zulip, and Rocket.Chat are all free open-source alternatives." },
      { question: "Is Slack open source?", answer: "No. Slack is proprietary. Mattermost and Element are fully open-source alternatives." },
      { question: "Can I self-host a team chat?", answer: "Yes. Mattermost, Element, Zulip, and Rocket.Chat all support self-hosting." },
      { question: "Which Slack alternative has unlimited message history?", answer: "Self-hosted Mattermost, Element, and Zulip all offer unlimited message history for free." },
      { question: "What is the most secure Slack alternative?", answer: "Element uses the Matrix protocol with end-to-end encryption by default." },
    ]
  },
  Trello: {
    paidTool: "Trello",
    description:
      "Trello is a Kanban-style project management tool. Standard plan costs $5/month per user.",
    alternatives: [
      {
        name: "WeKan",
        url: "https://wekan.github.io",
        reason: "Free and open-source Kanban board, self-hostable, supports Trello import for easy migration.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Focalboard",
        url: "https://www.focalboard.com",
        reason: "Free open-source project management tool by Mattermost, Trello-like interface, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Taiga",
        url: "https://taiga.io",
        reason: "Free open-source project management with Kanban and Scrum, designed for agile teams.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Project Management",
    seoKeywords: ["free trello alternative", "trello replacement", "open source kanban board"],
    faqs: [
      { question: "Is there a free alternative to Trello?", answer: "Yes. WeKan, Focalboard, and Taiga are all free open-source Kanban and project management tools." },
      { question: "Can I import my Trello boards?", answer: "Yes. WeKan supports direct Trello board import for easy migration." },
      { question: "Is there a self-hosted Kanban board?", answer: "Yes. WeKan, Focalboard, and Taiga all support self-hosting." },
    ]
  },
  Jira: {
    paidTool: "Jira",
    description:
      "Jira is an issue tracking and project management tool by Atlassian. Standard plan costs $7.75/month per user.",
    alternatives: [
      {
        name: "Plane",
        url: "https://plane.so",
        reason: "Free open-source project management with issue tracking, sprints, and cycles — a modern Jira alternative.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Redmine",
        url: "https://www.redmine.org",
        reason: "Free open-source issue tracking and project management, highly customizable with plugins.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "GitLab Issues",
        url: "https://about.gitlab.com",
        reason: "Free issue tracking integrated with Git repository management, CI/CD, and code review.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Project Management",
    seoKeywords: ["free jira alternative", "jira replacement", "open source issue tracker"],
    faqs: [
      { question: "Is there a free alternative to Jira?", answer: "Yes. Plane, Redmine, and GitLab Issues are free open-source issue tracking alternatives." },
      { question: "Is Jira open source?", answer: "No. Jira is proprietary. Redmine and Plane are open-source alternatives." },
      { question: "What is the best free issue tracker?", answer: "Plane offers a modern Jira-like experience. Redmine is mature and highly customizable." },
      { question: "Can I self-host a Jira alternative?", answer: "Yes. Plane, Redmine, and GitLab all support self-hosting." },
    ]
  },
  Airtable: {
    paidTool: "Airtable",
    description:
      "Airtable is a spreadsheet-database hybrid. Plus plan costs $10/month per seat.",
    alternatives: [
      {
        name: "NocoDB",
        url: "https://nocodb.com",
        reason: "Free open-source Airtable alternative that turns any database into a smart spreadsheet, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Baserow",
        url: "https://baserow.io",
        reason: "Free open-source no-code database and Airtable alternative, self-hostable with a REST API.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Grist",
        url: "https://getgrist.com",
        reason: "Free open-source relational spreadsheet with Python formulas, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Productivity",
    seoKeywords: ["free airtable alternative", "airtable replacement", "open source spreadsheet database"],
    faqs: [
      { question: "Is there a free alternative to Airtable?", answer: "Yes. NocoDB, Baserow, and Grist are all free open-source Airtable alternatives." },
      { question: "Is Airtable open source?", answer: "No. Airtable is proprietary. NocoDB and Baserow are open-source alternatives." },
      { question: "Can I self-host an Airtable alternative?", answer: "Yes. NocoDB, Baserow, and Grist all support self-hosting with full data control." },
      { question: "Which Airtable alternative works with existing databases?", answer: "NocoDB can turn any MySQL or PostgreSQL database into an Airtable-like interface." },
    ]
  },
  Dropbox: {
    paidTool: "Dropbox",
    description:
      "Dropbox is a cloud storage service. Plus plan costs $9.99/month for 2TB.",
    alternatives: [
      {
        name: "Nextcloud",
        url: "https://nextcloud.com",
        reason: "Free open-source cloud storage and collaboration platform, fully self-hosted with file sync and sharing.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Syncthing",
        url: "https://syncthing.net",
        reason: "Free open-source continuous file synchronization between devices, no cloud server needed.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Seafile",
        url: "https://www.seafile.com",
        reason: "Free open-source file syncing and sharing with enterprise-grade reliability, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Cloud Storage",
    seoKeywords: ["free dropbox alternative", "dropbox replacement", "self-hosted cloud storage"],
    faqs: [
      { question: "Is there a free alternative to Dropbox?", answer: "Yes. Nextcloud, Syncthing, and Seafile are free open-source file syncing and storage alternatives." },
      { question: "Can I self-host cloud storage?", answer: "Yes. Nextcloud and Seafile can be self-hosted for complete control over your files." },
      { question: "What is the best free file sync tool?", answer: "Nextcloud offers the most features. Syncthing is best for peer-to-peer device syncing." },
      { question: "Is there a Dropbox alternative without storage limits?", answer: "Self-hosted Nextcloud uses your own storage, so limits depend only on your hardware." },
    ]
  },
  Miro: {
    paidTool: "Miro",
    description:
      "Miro is an online whiteboard and collaboration tool. Business plan costs $16/month per user.",
    alternatives: [
      {
        name: "Excalidraw",
        url: "https://excalidraw.com",
        reason: "Free open-source virtual whiteboard for sketching hand-drawn diagrams, real-time collaboration.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Draw.io",
        url: "https://app.diagrams.net",
        reason: "Free online diagram and whiteboard tool, supports multiple cloud storage integrations.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "tldraw",
        url: "https://www.tldraw.com",
        reason: "Free open-source infinite canvas whiteboard with intuitive drawing tools and real-time collaboration.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Design Tools",
    seoKeywords: ["free miro alternative", "miro replacement", "open source whiteboard"],
    faqs: [
      { question: "Is there a free alternative to Miro?", answer: "Yes. Excalidraw, Draw.io, and tldraw are all free open-source whiteboard tools." },
      { question: "Is Miro open source?", answer: "No. Miro is proprietary. Excalidraw and tldraw are open-source alternatives." },
      { question: "What is the best free online whiteboard?", answer: "Excalidraw is great for hand-drawn diagrams. Draw.io is best for structured diagrams." },
    ]
  },
  Asana: {
    paidTool: "Asana",
    description:
      "Asana is a work management platform. Premium plan costs $10.99/month per user.",
    alternatives: [
      {
        name: "OpenProject",
        url: "https://www.openproject.org",
        reason: "Free open-source project management with task tracking, Gantt charts, and agile boards.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Plane",
        url: "https://plane.so",
        reason: "Free open-source project management tool with modern UI, issues, sprints, and roadmaps.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Leantime",
        url: "https://leantime.io",
        reason: "Free open-source project management for non-project managers, combines strategy and execution.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Project Management",
    seoKeywords: ["free asana alternative", "asana replacement", "open source project management"],
    faqs: [
      { question: "Is there a free alternative to Asana?", answer: "Yes. OpenProject, Plane, and Leantime are free open-source project management alternatives." },
      { question: "Can I self-host a project management tool?", answer: "Yes. OpenProject, Plane, and Leantime all support self-hosting." },
      { question: "What is the best free project management tool?", answer: "OpenProject is the most comprehensive. Plane offers the most modern UI." },
    ]
  },
  Canva: {
    paidTool: "Canva",
    description:
      "Canva is a graphic design platform. Pro plan costs $12.99/month.",
    alternatives: [
      {
        name: "Penpot",
        url: "https://penpot.app",
        reason: "Free open-source design and prototyping platform, supports SVG, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Pencil",
        url: "https://pencil.evolus.vn",
        reason: "Free open-source GUI prototyping tool for creating mockups and diagrams.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Polotno Studio",
        url: "https://studio.polotno.com",
        reason: "Free browser-based design editor for creating social media graphics and presentations.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Creative Tools",
    seoKeywords: ["free canva alternative", "canva replacement", "free graphic design tool"],
    faqs: [
      { question: "Is there a free alternative to Canva?", answer: "Yes. Penpot and Pencil are free open-source design tools." },
      { question: "Is Canva open source?", answer: "No. Canva is proprietary. Penpot is the leading open-source design platform." },
      { question: "Can I create social media graphics for free?", answer: "Yes. Polotno Studio and Penpot offer free browser-based design editors." },
    ]
  },
  LastPass: {
    paidTool: "LastPass",
    description:
      "LastPass is a password manager. Premium plan costs $3/month; free tier limited to one device type.",
    alternatives: [
      {
        name: "Bitwarden",
        url: "https://bitwarden.com",
        reason: "Free open-source password manager with cross-platform sync, browser extensions, and end-to-end encryption.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "KeePassXC",
        url: "https://keepassxc.org",
        reason: "Free open-source offline password manager with auto-type, browser integration, and no cloud dependency.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Proton Pass",
        url: "https://proton.me/pass",
        reason: "Free password manager by Proton with end-to-end encryption, built-in 2FA authenticator.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Security",
    seoKeywords: ["free lastpass alternative", "lastpass replacement", "free password manager"],
    faqs: [
      { question: "Is there a free alternative to LastPass?", answer: "Yes. Bitwarden, KeePassXC, and Proton Pass are all free password managers." },
      { question: "Is Bitwarden better than LastPass free?", answer: "Bitwarden free tier includes cross-platform sync, which LastPass now restricts to paid plans." },
      { question: "Can I use a free password manager on multiple devices?", answer: "Yes. Bitwarden and Proton Pass offer cross-device sync for free." },
    ]
  },
  Evernote: {
    paidTool: "Evernote",
    description:
      "Evernote is a note-taking app. Personal plan costs $10.83/month; free tier limited to 50 notes.",
    alternatives: [
      {
        name: "Joplin",
        url: "https://joplinapp.org",
        reason: "Free open-source note-taking with Markdown, end-to-end encryption, and Web Clipper.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Obsidian",
        url: "https://obsidian.md",
        reason: "Free local-first knowledge base with Markdown, graph view, and a rich plugin ecosystem.",
        isFree: true,
        isOpenSource: false,
      },
      {
        name: "Standard Notes",
        url: "https://standardnotes.com",
        reason: "Free open-source encrypted notes app with extensions, self-hostable, privacy-focused.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Productivity",
    seoKeywords: ["free evernote alternative", "evernote replacement", "open source note taking"],
    faqs: [
      { question: "Is there a free alternative to Evernote?", answer: "Yes. Joplin, Obsidian, and Standard Notes are all free note-taking alternatives." },
      { question: "Is Evernote still free?", answer: "Evernote free tier is now limited to 50 notes. Joplin and Obsidian have no such limits." },
      { question: "What is the best free note-taking app?", answer: "Obsidian is best for knowledge graphs. Joplin is best for web clipping. Standard Notes is best for privacy." },
      { question: "Can I self-host my notes?", answer: "Yes. Joplin and Standard Notes both support self-hosted sync servers." },
    ]
  },
  Sketch: {
    paidTool: "Sketch",
    description:
      "Sketch is a vector graphics editor for macOS. Subscription costs $10/month.",
    alternatives: [
      {
        name: "Penpot",
        url: "https://penpot.app",
        reason: "Free open-source design tool that works in the browser, cross-platform, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Figma (Free Tier)",
        url: "https://www.figma.com",
        reason: "Free for up to 3 projects, browser-based, real-time collaboration, Sketch file compatible.",
        isFree: true,
        isOpenSource: false,
      },
      {
        name: "Lunacy",
        url: "https://icons8.com/lunacy",
        reason: "Free design tool for Windows that opens Sketch files natively, built-in assets.",
        isFree: true,
        isOpenSource: false,
      },
    ],
    category: "Design Tools",
    seoKeywords: ["free sketch alternative", "sketch replacement", "open source vector design"],
    faqs: [
      { question: "Is there a free alternative to Sketch?", answer: "Yes. Penpot and Lunacy are free design tools that can open Sketch files." },
      { question: "Can I open Sketch files for free?", answer: "Yes. Lunacy opens Sketch files natively on Windows. Figma free tier also imports them." },
      { question: "Is there a cross-platform Sketch alternative?", answer: "Penpot works in any browser, and Lunacy is available for Windows, both for free." },
    ]
  },
  "GitHub Copilot": {
    paidTool: "GitHub Copilot",
    description:
      "GitHub Copilot is an AI coding assistant. Individual plan costs $10/month; Business plan costs $19/month.",
    alternatives: [
      {
        name: "Continue",
        url: "https://continue.dev",
        reason: "Free open-source AI coding assistant that works with any LLM, supports VS Code and JetBrains.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Cline",
        url: "https://cline.bot",
        reason: "Free open-source autonomous AI coding agent for VS Code, works with Claude and other models.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Tabby",
        url: "https://tabby.tabbyml.com",
        reason: "Free open-source AI coding assistant, self-hostable, supports multiple LLM backends.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Developer Tools",
    seoKeywords: ["free github copilot alternative", "copilot replacement", "open source ai coding assistant"],
    faqs: [
      { question: "Is there a free alternative to GitHub Copilot?", answer: "Yes. Continue, Cline, and Tabby are free open-source AI coding assistants." },
      { question: "Is GitHub Copilot open source?", answer: "No. GitHub Copilot is proprietary. Continue, Cline, and Tabby are open-source alternatives." },
      { question: "Can I use an AI coding assistant for free?", answer: "Yes. Continue and Cline work with free LLM APIs. Tabby can be self-hosted." },
      { question: "Which Copilot alternative works in VS Code?", answer: "Continue, Cline, and Tabby all have VS Code extensions." },
    ]
  },
  Salesforce: {
    paidTool: "Salesforce",
    description:
      "Salesforce is a CRM platform. Essentials plan starts at $25/month per user.",
    alternatives: [
      {
        name: "ERPNext",
        url: "https://erpnext.com",
        reason: "Free open-source ERP and CRM system, self-hostable, covers sales, HR, accounting and more.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Crater",
        url: "https://craterapp.com",
        reason: "Free open-source invoicing and CRM for freelancers and small businesses, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Monica CRM",
        url: "https://www.monicahq.com",
        reason: "Free open-source personal CRM to manage relationships, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Business Tools",
    seoKeywords: ["free salesforce alternative", "salesforce replacement", "open source CRM"],
    faqs: [
      { question: "Is there a free alternative to Salesforce?", answer: "Yes. ERPNext and Monica CRM are free open-source CRM alternatives." },
      { question: "Is Salesforce open source?", answer: "No. Salesforce is proprietary. ERPNext is a fully open-source CRM and ERP system." },
      { question: "Can I self-host a CRM?", answer: "Yes. ERPNext, Crater, and Monica CRM all support self-hosting." },
    ]
  },
  Zendesk: {
    paidTool: "Zendesk",
    description:
      "Zendesk is a customer service and support ticketing platform. Suite Team plan costs $55/month per agent.",
    alternatives: [
      {
        name: "Chatwoot",
        url: "https://www.chatwoot.com",
        reason: "Free open-source customer engagement platform with live chat, email, and social media support, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Zammad",
        url: "https://zammad.com",
        reason: "Free open-source helpdesk and ticketing system with email, chat, and social media integration.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "FreeScout",
        url: "https://freescout.net",
        reason: "Free open-source help desk and shared inbox, lightweight, self-hostable, Zendesk-like experience.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Business Tools",
    seoKeywords: ["free zendesk alternative", "zendesk replacement", "open source helpdesk"],
    faqs: [
      { question: "Is there a free alternative to Zendesk?", answer: "Yes. Chatwoot, Zammad, and FreeScout are free open-source helpdesk alternatives." },
      { question: "Can I self-host a helpdesk?", answer: "Yes. Chatwoot, Zammad, and FreeScout all support self-hosting." },
      { question: "What is the best free ticketing system?", answer: "Zammad is the most feature-complete. FreeScout is the lightest and most Zendesk-like." },
    ]
  },
  Monday: {
    paidTool: "Monday.com",
    description:
      "Monday.com is a work OS and project management tool. Standard plan costs $9/month per seat.",
    alternatives: [
      {
        name: "OpenProject",
        url: "https://www.openproject.org",
        reason: "Free open-source project management with Gantt charts, time tracking, and agile boards, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Plane",
        url: "https://plane.so",
        reason: "Free open-source project management with a modern UI, issues, cycles, and modules.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Focalboard",
        url: "https://www.focalboard.com",
        reason: "Free open-source project management with Trello/Monday-like boards, by Mattermost.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Project Management",
    seoKeywords: ["free monday alternative", "monday.com replacement", "open source work management"],
    faqs: [
      { question: "Is there a free alternative to Monday.com?", answer: "Yes. OpenProject, Plane, and Focalboard are free open-source project management alternatives." },
      { question: "Can I self-host a Monday.com alternative?", answer: "Yes. OpenProject and Plane both support self-hosting." },
      { question: "What is the best free work management tool?", answer: "OpenProject is the most mature. Plane offers the most modern and intuitive interface." },
    ]
  },
  Confluence: {
    paidTool: "Confluence",
    description:
      "Confluence is a team wiki and documentation tool by Atlassian. Standard plan costs $5.50/month per user.",
    alternatives: [
      {
        name: "BookStack",
        url: "https://www.bookstackapp.com",
        reason: "Free open-source wiki and documentation platform with a simple WYSIWYG editor, self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Wiki.js",
        url: "https://js.wiki",
        reason: "Free open-source wiki engine with Markdown support, Git integration, and multi-language content.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Outline",
        url: "https://www.getoutline.com",
        reason: "Free open-source knowledge base with Slack integration, Markdown, and real-time collaboration.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Productivity",
    seoKeywords: ["free confluence alternative", "confluence replacement", "open source wiki"],
    faqs: [
      { question: "Is there a free alternative to Confluence?", answer: "Yes. BookStack, Wiki.js, and Outline are free open-source wiki alternatives." },
      { question: "Can I self-host a wiki?", answer: "Yes. BookStack, Wiki.js, and Outline all support self-hosting." },
      { question: "What is the best free team wiki?", answer: "Outline offers the best Confluence-like experience. BookStack is the simplest to set up." },
    ]
  },
  HubSpot: {
    paidTool: "HubSpot",
    description:
      "HubSpot is a marketing, sales, and service CRM. Starter plan costs $15/month per seat.",
    alternatives: [
      {
        name: "Chatwoot",
        url: "https://www.chatwoot.com",
        reason: "Free open-source customer engagement platform, self-hostable, covers live chat and social channels.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "Mautic",
        url: "https://www.mautic.org",
        reason: "Free open-source marketing automation platform for email campaigns, landing pages, and lead management.",
        isFree: true,
        isOpenSource: true,
      },
      {
        name: "ERPNext",
        url: "https://erpnext.com",
        reason: "Free open-source ERP with CRM, marketing, HR, and accounting, fully self-hostable.",
        isFree: true,
        isOpenSource: true,
      },
    ],
    category: "Business Tools",
    seoKeywords: ["free hubspot alternative", "hubspot replacement", "open source marketing automation"],
    faqs: [
      { question: "Is there a free alternative to HubSpot?", answer: "Yes. Chatwoot, Mautic, and ERPNext offer free CRM and marketing automation." },
      { question: "Is there a free marketing automation tool?", answer: "Yes. Mautic is a fully open-source marketing automation platform." },
      { question: "Can I self-host a CRM and marketing platform?", answer: "Yes. ERPNext, Mautic, and Chatwoot all support self-hosting." },
    ]
  },
};

/** 获取替代品条目（通过 slug 查找） */
export function getAlternativeBySlug(slug: string): AlternativeEntry | null {
  const allMap = getCombinedMap();
  const entry = Object.entries(allMap).find(
    ([key]) => key.toLowerCase().replace(/\s+/g, "-") === slug
  );
  return entry ? entry[1] : null;
}

/** 获取所有替代品 slug 列表（用于 generateStaticParams） */
export function getAllAlternativeSlugs(): string[] {
  const allMap = getCombinedMap();
  return Object.keys(allMap).map((key) =>
    key.toLowerCase().replace(/\s+/g, "-")
  );
}

/** 合并手工 MAP + JSON 导入数据 */
let _combinedMap: Record<string, AlternativeEntry> | null = null;

export function getCombinedMap(): Record<string, AlternativeEntry> {
  if (_combinedMap) return _combinedMap;

  _combinedMap = { ...ALTERNATIVES_MAP };

  // Try to load from JSON import file
  try {
    const filePath = join(process.cwd(), "public", "data", "alternatives-import.json");
    const raw = readFileSync(filePath, "utf-8");
    const imports: AlternativeEntry[] = JSON.parse(raw);
    for (const entry of imports) {
      if (entry.paidTool && entry.alternatives?.length) {
        _combinedMap[entry.paidTool] = entry;
      }
    }
  } catch {
    // No import file or parse error — use MAP only
  }

  return _combinedMap;
}
