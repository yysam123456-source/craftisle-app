export interface CategoryH2Content {
  about: string;
  related: string[];
}

export const CATEGORY_H2_CONTENT: Record<string, CategoryH2Content> = {
  "Artificial-Intelligence": {
    about: "Looking for free AI tools that actually work? You've found the right place. This curated list brings together the best free artificial intelligence tools available in 2025 — from AI chatbots and writing assistants to image generators, code helpers, and research aids. Every tool here is free to use (no credit card required), open-source where possible, and regularly updated. Whether you're a developer integrating AI into your workflow, a student using AI for research, or a creator exploring generative AI, you'll find something useful here. We've tested each tool for reliability, rate limits, and output quality — so you don't have to.",
    related: ["Educational", "Misc"],
  },
  Educational: {
    about: "Free learning resources for everyone. This collection covers free online courses, programming tutorials, certification programs, and self-study tools across every major subject. Whether you're learning to code, mastering a new language, or pursuing professional certifications, these curated resources will help you learn without breaking the bank. All tools are free (many with optional paid tiers), and we've prioritized platforms with certificates upon completion. From MIT OpenCourseWare to free Codecademy alternatives, this is your gateway to free education in 2025.",
    related: ["Artificial-Intelligence", "Misc"],
  },
  Adblock: {
    about: "Take back your browser. This collection of free ad blockers and privacy tools helps you block ads, stop trackers, and browse faster. We've curated the best open-source adblockers, including uBlock Origin alternatives, privacy-focused browser extensions, and anti-tracking tools that actually work in 2025. Every tool here is free, open-source where possible, and regularly updated to keep pace with changing web standards. Whether you want to block YouTube ads, stop Facebook tracking, or just browse faster, you'll find the right tool here.",
    related: ["Misc", "Downloading"],
  },
  Linux: {
    about: "Free operating systems and tools for Linux users. This collection covers the best free Linux distributions, desktop environments, terminal tools, and system utilities — all open-source and free to download. Whether you're a Linux beginner looking for a user-friendly distro, a developer needing powerful CLI tools, or a sysadmin managing servers, these curated resources will help. We've included lightweight distros for older hardware, security-focused options, and everything in between. All tools are free, most are open-source, and many have active community support.",
    related: ["Misc", "Gaming"],
  },
  Misc: {
    about: "Useful free tools that don't fit neatly into other categories. This is a handpicked collection of free online utilities, productivity tools, and everyday web apps that solve specific problems. From free unit converters and calculators to online notepads, whiteboard tools, and random generators — if there's a free tool that's genuinely useful, it belongs here. We update this list regularly to remove dead links and add new discoveries. Every tool is free to use, requires no signup where possible, and has been tested for reliability.",
    related: ["Educational", "Adblock", "Downloading"],
  },
  Reading: {
    about: "Free books, articles, and reading platforms. This collection brings together the best free ebook sites, online libraries, audiobook platforms, and digital reading tools available in 2025. Whether you're looking for free PDF books, public domain literature, academic papers, or web-based reading platforms — everything here is free, legal, and accessible. We've prioritized open-access resources, library alternatives, and platforms that don't require account creation. From Project Gutenberg to modern reading platforms, discover your next free read here.",
    related: ["Educational", "Non-Eng"],
  },
  Mobile: {
    about: "Free apps and tools for Android and iOS. This curated list focuses on open-source mobile apps, FOSS Android alternatives, and free iOS utilities that respect your privacy. Unlike mainstream app stores filled with ad-supported junk, these tools are genuinely free — no hidden subscriptions, no aggressive tracking, no paywalled features. Whether you need a free alternative to Google Maps, an open-source music player, or privacy-focused messaging, you'll find it here. All apps are free to download and use.",
    related: ["Linux", "Adblock"],
  },
  Storage: {
    about: "Free cloud storage and file-sharing tools. This collection covers the best free cloud storage providers, file hosting services, backup solutions, and large-file transfer tools available in 2025. We've compared storage limits, upload sizes, privacy policies, and ease of use — so you can pick the right tool for your needs. Whether you need 5GB of free cloud drive space, a way to send large files, or automated backups for your projects, these curated resources have you covered. All tools are free to start, with clear pricing if you need more.",
    related: ["Downloading", "Misc"],
  },
  Gaming: {
    about: "Free game development tools and indie resources. This collection is for game developers, modders, and indie creators looking for free, capable tools. We've curated free game engines, 3D asset libraries, texture packs, audio resources, and modding tools — all free for commercial use where specified. Whether you're building your first game in Godot, looking for free 3D models, or need royalty-free game audio, you'll find quality free resources here. Updated regularly as new tools launch.",
    related: ["Linux", "Music", "Torrenting"],
  },
  Music: {
    about: "Free music production tools and audio software. This collection brings together the best free DAWs, audio editors, plugins, and music streaming tools available in 2025. Whether you're producing your first track, need a free alternative to Adobe Audition, or want open-source audio tools for podcasting — everything here is free, capable, and regularly updated. We've prioritized tools that are free for commercial use, have active communities, and don't watermark your output. Make better music without spending a fortune.",
    related: ["Gaming", "Streaming"],
  },
  Streaming: {
    about: "Free video players, media tools, and streaming utilities. This collection covers the best free media players, video codecs, live streaming software, screen recorders, and IPTV tools available in 2025. Whether you need a free alternative to VLC, free OBS alternatives for live streaming, or video conversion tools — these curated resources are all free, open-source where possible, and regularly updated. We've tested each tool for format support, performance, and ease of use.",
    related: ["Music", "Torrenting"],
  },
  "Non-Eng": {
    about: "Free multilingual resources and non-English content tools. This collection serves users looking for free tools in languages other than English — including Chinese, Spanish, Japanese, Korean, Arabic, and more. We've curated free translation tools, multilingual content platforms, subtitle tools, and regional streaming services that are genuinely free. Whether you're learning a new language, looking for content in your native language, or need translation tools for work — these resources are free and accessible from anywhere.",
    related: ["Educational", "Reading"],
  },
  Downloading: {
    about: "Free download managers and file downloading tools. This collection covers the best free download managers, torrent clients, and file downloaders available in 2025. Whether you need a free Internet Download Manager alternative, a multi-threaded download accelerator, or a simple tool for batch downloads — these curated resources are all free, open-source where possible, and regularly updated. We've prioritized tools that are lightweight, don't bundle adware, and respect your privacy. Download faster and more reliably.",
    related: ["Torrenting", "Storage"],
  },
  Torrenting: {
    about: "Free torrent clients and P2P file sharing tools. This collection focuses on open-source, privacy-respecting torrent clients and P2P tools that are free to use in 2025. We've curated the best BitTorrent clients, magnet link downloaders, seedbox tools, and torrent search engines — all free, most open-source, and regularly updated for security. Whether you're looking for a free qBittorrent alternative, need a portable torrent client, or want to explore private trackers — these resources are genuinely free and privacy-focused.",
    related: ["Downloading", "Streaming"],
  },
};
