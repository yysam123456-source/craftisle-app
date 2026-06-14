const { withContentlayer } = require("next-contentlayer2");
const withBundleAnalyzer = require("@next/bundle-analyzer");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // trailingSlash: true, // disabled: causes Vercel 404 on homepage
  
  // Disable the Next.js Dev Tools panel (bottom-left overlay in dev mode)
  devIndicators: false,

  // Turbopack: use webpack for tegaki compatibility
  // Set to {} to enable Turbopack (default in Next.js 16),
  // or set to false to force webpack (not valid — use --webpack flag in build script).
  // We use "next build --webpack" in package.json build script instead.
  turbopack: {
    // Empty config = Turbopack enabled (for dev)
    // For build, package.json build script has --webpack flag
  },

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

  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,

  // Code splitting: extract CSS per page to reduce bundle size
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
const config = process.env.ANALYZE === "true"
  ? withBundleAnalyzer(nextConfig)
  : nextConfig;

module.exports = withContentlayer(config);
