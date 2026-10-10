const { withContentlayer } = require("next-contentlayer2");
// Bundle analyzer: lazy-load to avoid missing module error
// const withBundleAnalyzer = require("@next/bundle-analyzer");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Prisma engine file tracing for standalone output on Vercel
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/client/**/*"],
    "/api/**": ["./node_modules/.prisma/client/**/*"],
  },
  
  // Disable the Next.js Dev Tools panel (bottom-left overlay in dev mode)
  devIndicators: false,

  // Turbopack: enabled (default in Next.js 16)
  // Previously disabled due to GitHub#57709 false-positive "duplicate key" warning
  // Root cause was fixed: deduplicated generateStaticParams in best/[slug]/page.tsx
  turbopack: {},

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000, // 1 year for static images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      // Ghost CMS images (if self-hosted, update hostname)
      {
        protocol: "https",
        hostname: "**.ghost.io",
      },
      // Resource site logos/icons
      {
        protocol: "https",
        hostname: "**.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.github.com",
      },
    ],
  },

  // ★ 收敛「同组件双 id」重复 URL（2026-10-10）
  // 17 组工具此前各占两个 URL，<title> 完全相同、正文是两套文案 ⇒ 关键词自相残杀。
  // 成因：2026-06-14 同一天两条并行批量导入线（omni-tools port 系列 / Batch 9-11 系列）
  // 各自把同一个组件注册到不同 slug，且都未做跨线去重。
  // 处置：保留完整度更高的一方（A 线 port 系列，17 组全胜），另一方 301 到保留方。
  async redirects() {
    return [
    { source: "/tools/string-quote", destination: "/tools/quote", permanent: true },
    { source: "/tools/string-palindrome", destination: "/tools/palindrome", permanent: true },
    { source: "/tools/string-remove-duplicates", destination: "/tools/remove-duplicate-lines", permanent: true },
    { source: "/tools/crontab-guru", destination: "/tools/cron-parser", permanent: true },
    { source: "/tools/list-shuffle", destination: "/tools/shuffle-lines", permanent: true },
    { source: "/tools/list-sort", destination: "/tools/sort-lines", permanent: true },
    { source: "/tools/list-unique", destination: "/tools/unique-lines", permanent: true },
    { source: "/tools/truncate-clock-time", destination: "/tools/truncate-time", permanent: true },
    { source: "/tools/list-duplicate", destination: "/tools/duplicate-lines", permanent: true },
    { source: "/tools/list-reverse", destination: "/tools/reverse-lines", permanent: true },
    { source: "/tools/list-rotate", destination: "/tools/rotate-lines", permanent: true },
    { source: "/tools/list-wrap", destination: "/tools/wrap-lines", permanent: true },
    { source: "/tools/list-truncate", destination: "/tools/truncate-lines", permanent: true },
    { source: "/tools/list-unwrap", destination: "/tools/unwrap-lines", permanent: true },
    { source: "/tools/json-escape", destination: "/tools/escape-json", permanent: true },
    { source: "/tools/json-sort", destination: "/tools/sort-json", permanent: true },
    { source: "/tools/json-stringify", destination: "/tools/stringify-json", permanent: true },
    ];
  },
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,

  // Enable compression for smaller transfer size
  compress: true,

  // Standalone output for smaller deployment size (reduces node_modules)
  output: 'standalone',

  // Incremental Static Regeneration (ISR) global config
  // Individual pages can override with their own revalidate
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
      "lodash-es",
    ],
  },

  // Transpile ESM packages for webpack
  transpilePackages: ["@prisma/client", "tegaki"],

  // Env vars required for build (Ghost CMS)
  env: {
    GHOST_URL: process.env.GHOST_URL || "",
    GHOST_CONTENT_API_KEY: process.env.GHOST_CONTENT_API_KEY || "",
  },
};

// Only enable bundle analyzer if ANALYZE env var is set
// const config = process.env.ANALYZE === "true"
//   ? withBundleAnalyzer(nextConfig)
//   : nextConfig;
const config = nextConfig;

module.exports = withContentlayer(config);
