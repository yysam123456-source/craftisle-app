const { withContentlayer } = require("next-contentlayer2");
// Bundle analyzer: lazy-load to avoid missing module error
// const withBundleAnalyzer = require("@next/bundle-analyzer");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 🔴🔴 2026-10-21（DEBT-33 根因修复）：Prisma 查询引擎必须保持 external。
  //
  // 病根：下面那组 outputFileTracingIncludes 只给 `/api/**` 追了 `.prisma/client`
  // ⇒ API 路由函数能读到库，而**页面函数**（/tools/[tool]、/l/[slug]、首页等）
  // 的 bundle 里没有 libquery_engine-rhel-openssl-3.0.x.so.node。
  // 运行时 `refreshOverrides()` 抛：
  //   "Prisma Client could not locate the Query Engine for runtime rhel-openssl-3.0.x"
  // 又被 page-meta-db 的 catch 静默吞掉 ⇒ 症状是「写侧/读侧探针全绿、线上 title
  // 纹丝不动」，四轮排查（DEBT-30/31/32/33）全被这个假象带偏。
  //
  // serverExternalPackages 让 @prisma_client 走 node_modules 运行时加载，
  // Vercel 的文件追踪会自动把引擎文件带进部署产物（pris.ly/d/engine-not-found-nextjs）。
  serverExternalPackages: ["@prisma/client", ".prisma/client"],

  // Prisma engine file tracing for standalone output on Vercel
  // （保留：API 路由的额外保险；页面函数现在靠上面的 serverExternalPackages）
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/client/**/*"],
    "/api/**": ["./node_modules/.prisma/client/**/*"],
    "/tools/**/*": ["./node_modules/.prisma/client/**/*"],
    "/l/**/*": ["./node_modules/.prisma/client/**/*"],
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

    // ★ 收敛「同功能双实现」（2026-10-15，DEBT-12）
    // 这 6 组与 DEBT-01 的 17 组形态不同：那 17 组是同一组件文件注册双 id（组件哈希可检测），
    // 这 6 组是两条批量线各自实现的不同组件，各自独立成页。
    //
    // 保留方由真实搜索词决定，不按组件行数拍脑袋。Bing Suggest 实测（2026-10-15，8 个扩展 × 6 组）：
    //   days to hours     61 建议  vs convert days to hours     11  → 5.5x
    //   hours to days     62       vs convert hours to days     19     → 3.3x
    //   time to seconds   41       vs convert time to seconds   21     → 2.0x
    //   time to decimal   43       vs convert time to decimal   18     → 2.4x
    //   seconds to time   33       vs convert seconds to time   26     → 1.3x（接近，仍留裸名）
    //   unix to date      41       vs convert unix to date      33     → 1.2x（接近，仍留裸名）
    // 结论：裸名线全胜，convert-* 线 0 胜。此前「B 线 convert-* 组件更长所以更好」的判断
    // 只看了实现完整度、没看需求，方向是错的 —— 组件更长不等于该占这个 URL。
    { source: "/tools/convert-days-to-hours",   destination: "/tools/days-to-hours",   permanent: true },
    { source: "/tools/convert-hours-to-days",   destination: "/tools/hours-to-days",   permanent: true },
    { source: "/tools/convert-seconds-to-time", destination: "/tools/seconds-to-time", permanent: true },
    { source: "/tools/convert-time-to-seconds", destination: "/tools/time-to-seconds", permanent: true },
    { source: "/tools/convert-time-to-decimal", destination: "/tools/time-to-decimal", permanent: true },
    { source: "/tools/convert-unix-to-date",    destination: "/tools/unix-to-date",    permanent: true },
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
  // 🔴 2026-10-21（DEBT-33 根因）：@prisma/client 不能进 transpilePackages。
  // 进了 transit 就意味着 webpack 把 Prisma 客户端**打进页面 bundle**，
  // 而查询引擎 libquery_engine-*.so.node 是二进制、打包工具不会复制它
  // ⇒ 页面函数运行时抛「could not locate the Query Engine for runtime
  //   rhel-openssl-3.0.x」，被 page-meta-db 的 catch 静默吞掉。
  // API 路由此前只是靠 outputFileTracingIncludes 的单独追踪才侥幸能读库。
  // 正确做法：Prisma 走 node_modules 运行时加载（见上面 serverExternalPackages）。
  transpilePackages: ["tegaki"],

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
