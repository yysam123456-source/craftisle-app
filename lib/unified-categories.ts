/**
 * unified-categories.ts
 * Maps all 216 categories (from 4 data sources) into 12 unified domains.
 *
 * 12 Unified Domains:
 *   development  — coding, IDEs, APIs, CI/CD, source control, testing
 *   ai-ml        — AI, machine learning, generative AI, NLP
 *   devops       — deployment, containers, monitoring, IaC, cloud infra
 *   security     — auth, encryption, anti-malware, VPN, password mgmt
 *   design       — UI/UX, CMS, design tools, frontend, fonts
 *   data         — databases, analytics, search, data science
 *   productivity — note-taking, office, task mgmt, calendars, bookmarks
 *   cloud-infra  — hosting, DNS, CDN, storage, networking, PaaS
 *   media        — music, video, streaming, photo, games, media tools
 *   comms        — email, messaging, social, forums, video chat
 *   learning     — education, courses, reading, books, knowledge mgmt
 *   misc         — everything else
 */

export interface UnifiedDomain {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string; // tailwind gradient class
}

export const DOMAINS: UnifiedDomain[] = [
  {
    id: "development",
    name: "Development",
    icon: "💻",
    description: "IDEs, APIs, source control, CI/CD, testing — tools you use to build software.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "ai-ml",
    name: "AI & Machine Learning",
    icon: "🤖",
    description: "LLMs, generative AI, ML frameworks, NLP tools, and AI APIs.",
    color: "from-purple-500 to-violet-600",
  },
  {
    id: "devops",
    name: "DevOps & Infrastructure",
    icon: "⚙️",
    description: "Containers, monitoring, logs, deployment, and automation platforms.",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "security",
    name: "Security & Privacy",
    icon: "🔒",
    description: "Auth, encryption, ad blocking, VPNs, password managers, and anti-malware.",
    color: "from-red-500 to-rose-600",
  },
  {
    id: "design",
    name: "Design & Frontend",
    icon: "🎨",
    description: "UI kits, CMS platforms, icon libraries, design tools, and frontend frameworks.",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "data",
    name: "Data & Analytics",
    icon: "📊",
    description: "Databases, analytics platforms, search engines, and data visualization.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "productivity",
    name: "Productivity & Tools",
    icon: "📝",
    description: "Note-taking, office suites, task management, calendars, and bookmarks.",
    color: "from-amber-500 to-yellow-600",
  },
  {
    id: "cloud-infra",
    name: "Cloud & Infrastructure",
    icon: "☁️",
    description: "Cloud providers, hosting, DNS, CDN, storage, networking, and PaaS.",
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "media",
    name: "Media & Entertainment",
    icon: "🎬",
    description: "Music, video, streaming, photo galleries, gaming, and media tools.",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "comms",
    name: "Communication",
    icon: "💬",
    description: "Email, messaging, social networks, forums, and video conferencing.",
    color: "from-sky-500 to-cyan-600",
  },
  {
    id: "learning",
    name: "Learning & Education",
    icon: "📚",
    description: "Online courses, reading platforms, e-books, and educational resources.",
    color: "from-lime-500 to-green-600",
  },
  {
    id: "misc",
    name: "More Resources",
    icon: "📦",
    description: "Food, health, weather, government, agriculture, and other specialized resources.",
    color: "from-gray-500 to-slate-600",
  },
];

// Map every category ID to a domain.
// Categories prefixed by source: ffd-*, pa-*, sh-*; FMHY has no prefix.
export const CATEGORY_DOMAIN_MAP: Record<string, string> = {
  // ── FMHY categories (14) ────────────────────────────────
  "Artificial-Intelligence": "ai-ml",
  Educational: "learning",
  Adblock: "security",
  Linux: "cloud-infra",
  Misc: "productivity",
  Reading: "learning",
  Mobile: "misc",
  Storage: "cloud-infra",
  Gaming: "media",
  Music: "media",
  Streaming: "media",
  "Non-Eng": "misc",
  Downloading: "misc",
  Torrenting: "misc",

  // ── Free for Dev (57) ──────────────────────────────────
  "ffd-major-cloud-providers": "cloud-infra",
  "ffd-cloud-management-solutions": "cloud-infra",
  "ffd-source-code-repos": "development",
  "ffd-apis-data-and-ml": "ai-ml",
  "ffd-artifact-repos": "development",
  "ffd-tools-for-teams-and-collaboration": "productivity",
  "ffd-cms": "design",
  "ffd-code-generation": "development",
  "ffd-code-quality": "development",
  "ffd-code-search-and-browsing": "development",
  "ffd-ci-and-cd": "devops",
  "ffd-testing": "development",
  "ffd-security-and-pki": "security",
  "ffd-authentication-authorization-and-user-management": "security",
  "ffd-mobile-app-distribution-and-feedback": "misc",
  "ffd-management-system": "productivity",
  "ffd-messaging-and-streaming": "comms",
  "ffd-log-management": "devops",
  "ffd-translation-management": "development",
  "ffd-monitoring": "devops",
  "ffd-crash-and-exception-handling": "devops",
  "ffd-search": "data",
  "ffd-education-and-career-development": "learning",
  "ffd-email": "comms",
  "ffd-feature-toggles-management-platforms": "development",
  "ffd-font": "design",
  "ffd-forms": "design",
  "ffd-generative-ai": "ai-ml",
  "ffd-cdn-and-protection": "cloud-infra",
  "ffd-paas": "cloud-infra",
  "ffd-baas": "cloud-infra",
  "ffd-low-code-platform": "development",
  "ffd-web-hosting": "cloud-infra",
  "ffd-dns": "cloud-infra",
  "ffd-domain": "cloud-infra",
  "ffd-iaas": "cloud-infra",
  "ffd-managed-data-services": "data",
  "ffd-tunneling-webrtc-web-socket-servers-and-other-routers": "cloud-infra",
  "ffd-issue-tracking-and-project-management": "productivity",
  "ffd-storage-and-media-processing": "cloud-infra",
  "ffd-design-and-ui": "design",
  "ffd-data-visualization-on-maps": "data",
  "ffd-package-build-system": "development",
  "ffd-ide-and-code-editing": "development",
  "ffd-analytics-events-and-statistics": "data",
  "ffd-visitor-session-recording": "data",
  "ffd-international-mobile-number-verification-api-and-sdk": "comms",
  "ffd-payment-and-billing-integration": "misc",
  "ffd-docker-related": "devops",
  "ffd-dev-blogging-sites": "learning",
  "ffd-commenting-platforms": "comms",
  "ffd-screenshot-apis": "media",
  "ffd-flutter-related-and-building-ios-apps-without-mac": "development",
  "ffd-privacy-management": "security",
  "ffd-miscellaneous": "misc",
  "ffd-remote-desktop-tools": "cloud-infra",
  "ffd-other-free-resources": "misc",

  // ── Public APIs (51) ───────────────────────────────────
  "pa-animals": "misc",
  "pa-anime": "media",
  "pa-anti-malware": "security",
  "pa-art-design": "design",
  "pa-authentication-authorization": "security",
  "pa-blockchain": "misc",
  "pa-books": "learning",
  "pa-business": "productivity",
  "pa-calendar": "productivity",
  "pa-cloud-storage-file-sharing": "cloud-infra",
  "pa-continuous-integration": "devops",
  "pa-cryptocurrency": "misc",
  "pa-currency-exchange": "misc",
  "pa-data-validation": "data",
  "pa-development": "development",
  "pa-dictionaries": "learning",
  "pa-documents-productivity": "productivity",
  "pa-email": "comms",
  "pa-entertainment": "media",
  "pa-environment": "misc",
  "pa-events": "productivity",
  "pa-finance": "misc",
  "pa-food-drink": "misc",
  "pa-games-comics": "media",
  "pa-geocoding": "data",
  "pa-government": "misc",
  "pa-health": "misc",
  "pa-jobs": "misc",
  "pa-machine-learning": "ai-ml",
  "pa-music": "media",
  "pa-news": "comms",
  "pa-open-data": "data",
  "pa-open-source-projects": "development",
  "pa-patent": "misc",
  "pa-personality": "misc",
  "pa-phone": "comms",
  "pa-photography": "media",
  "pa-programming": "development",
  "pa-science-math": "learning",
  "pa-security": "security",
  "pa-shopping": "misc",
  "pa-social": "comms",
  "pa-sports-fitness": "misc",
  "pa-test-data": "data",
  "pa-text-analysis": "ai-ml",
  "pa-tracking": "data",
  "pa-transportation": "misc",
  "pa-url-shorteners": "development",
  "pa-vehicle": "misc",
  "pa-video": "media",
  "pa-weather": "misc",

  // ── Awesome Self-Hosted (94) ─────────────────────────
  "sh-analytics": "data",
  "sh-archiving-and-digital-preservation-dp": "cloud-infra",
  "sh-automation": "productivity",
  "sh-backup": "cloud-infra",
  "sh-blogging-platforms": "comms",
  "sh-booking-and-scheduling": "productivity",
  "sh-bookmarks-and-link-sharing": "productivity",
  "sh-calendar-contacts": "productivity",
  "sh-communication-custom-communication-systems": "comms",
  "sh-communication-email-complete-solutions": "comms",
  "sh-communication-email-mail-delivery-agents": "comms",
  "sh-communication-email-mail-transfer-agents": "comms",
  "sh-communication-email-mailing-lists-and-newsletters": "comms",
  "sh-communication-email-webmail-clients": "comms",
  "sh-communication-irc": "comms",
  "sh-communication-sip": "comms",
  "sh-communication-social-networks-and-forums": "comms",
  "sh-communication-video-conferencing": "comms",
  "sh-communication-xmpp-servers": "comms",
  "sh-communication-xmpp-web-clients": "comms",
  "sh-community-supported-agriculture-csa": "misc",
  "sh-conference-management": "productivity",
  "sh-content-management-systems-cms": "design",
  "sh-customer-relationship-management-crm": "productivity",
  "sh-database-management": "data",
  "sh-dns": "cloud-infra",
  "sh-document-management": "productivity",
  "sh-document-management-e-books": "learning",
  "sh-document-management-institutional-repository-and-digital-library-software": "learning",
  "sh-document-management-integrated-library-systems-ils": "learning",
  "sh-e-commerce": "misc",
  "sh-federated-identity-authentication": "security",
  "sh-feed-readers": "comms",
  "sh-file-transfer-synchronization": "cloud-infra",
  "sh-file-transfer-distributed-filesystems": "cloud-infra",
  "sh-file-transfer-object-storage-file-servers": "cloud-infra",
  "sh-file-transfer-peer-to-peer-filesharing": "cloud-infra",
  "sh-file-transfer-single-click-drag-n-drop-upload": "cloud-infra",
  "sh-file-transfer-web-based-file-managers": "cloud-infra",
  "sh-games": "media",
  "sh-games-administrative-utilities-control-panels": "media",
  "sh-genealogy": "misc",
  "sh-generative-artificial-intelligence-genai": "ai-ml",
  "sh-groupware": "productivity",
  "sh-health-and-fitness": "misc",
  "sh-human-resources-management-hrm": "productivity",
  "sh-identity-management": "security",
  "sh-internet-of-things-iot": "cloud-infra",
  "sh-inventory-management": "productivity",
  "sh-knowledge-management-tools": "productivity",
  "sh-learning-and-courses": "learning",
  "sh-manufacturing": "misc",
  "sh-maps-and-global-positioning-system-gps": "data",
  "sh-media-management": "media",
  "sh-media-streaming": "media",
  "sh-media-streaming-audio-streaming": "media",
  "sh-media-streaming-multimedia-streaming": "media",
  "sh-media-streaming-video-streaming": "media",
  "sh-miscellaneous": "misc",
  "sh-money-budgeting-management": "misc",
  "sh-monitoring-status-pages": "devops",
  "sh-network-utilities": "cloud-infra",
  "sh-note-taking-editors": "productivity",
  "sh-office-suites": "productivity",
  "sh-password-managers": "security",
  "sh-pastebins": "development",
  "sh-personal-dashboards": "productivity",
  "sh-photo-galleries": "media",
  "sh-polls-and-events": "productivity",
  "sh-proxy": "cloud-infra",
  "sh-recipe-management": "misc",
  "sh-remote-access": "cloud-infra",
  "sh-resource-planning": "productivity",
  "sh-search-engines": "data",
  "sh-self-hosting-solutions": "cloud-infra",
  "sh-software-development": "development",
  "sh-software-development-api-management": "development",
  "sh-software-development-continuous-integration-deployment": "devops",
  "sh-software-development-faas-serverless": "cloud-infra",
  "sh-software-development-feature-toggle": "development",
  "sh-software-development-ide-tools": "development",
  "sh-software-development-localization": "development",
  "sh-software-development-low-code": "development",
  "sh-software-development-project-management": "productivity",
  "sh-software-development-testing": "development",
  "sh-static-site-generators": "design",
  "sh-task-management-to-do-lists": "productivity",
  "sh-ticketing": "productivity",
  "sh-time-tracking": "productivity",
  "sh-url-shorteners": "development",
  "sh-video-surveillance": "security",
  "sh-vpn": "security",
  "sh-web-servers": "cloud-infra",
  "sh-wikis": "productivity",
};

/**
 * Get the domain ID for a category.
 */
export function getDomainForCategoryId(categoryId: string): string {
  return CATEGORY_DOMAIN_MAP[categoryId] || "misc";
}

/**
 * Format a category ID into a human-readable name.
 * Strips source prefixes (ffd-/pa-/sh-) and converts kebab-case to Title Case.
 */
export function formatCategoryName(categoryId: string, fallback?: string): string {
  if (fallback && fallback !== categoryId) return fallback;

  // Strip prefix
  let name = categoryId
    .replace(/^(ffd-|pa-|sh-)/, "")
    .replace(/-/g, " ")
    .replace(/\band\b/gi, "&");

  // Title case
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Get domain info by ID.
 */
export function getDomain(did: string): UnifiedDomain | undefined {
  return DOMAINS.find((d) => d.id === did);
}
