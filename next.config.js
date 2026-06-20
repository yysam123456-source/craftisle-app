const { withContentlayer } = require("next-contentlayer2");
// Bundle analyzer: lazy-load to avoid missing module error
// const withBundleAnalyzer = require("@next/bundle-analyzer");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // trailingSlash: true, // disabled: causes Vercel 404 on homepage
  
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

  // Exclude heavy ML libraries from server-side bundles (Vercel 250MB limit)
  // webpack.externals is the most reliable way to keep ML libs out of serverless functions
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      // Mark ML packages + their heavy native deps as external
      const mlPackages = [
        "@huggingface/transformers",
        "@imgly/background-removal",
        "onnxruntime-node",
        "onnxruntime-web",
      ];
      for (const pkg of mlPackages) {
        config.externals.push(({ request }, callback) => {
          if (request === pkg || request?.startsWith(pkg + "/")) {
            return callback(null, `commonjs ${pkg}`);
          }
          callback();
        });
      }
    }
    return config;
  },

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
