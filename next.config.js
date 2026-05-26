const { withContentlayer } = require("next-contentlayer2");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,

  // Turbopack disabled via CLI flag: --webpack
  // (Next.js 16 enables Turbopack by default; --webpack forces webpack)
  // turbopack: {}, // uncomment to re-enable Turbopack

  images: {
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
    ],
  },

  // Transpile packages that need it (replaces serverComponentsExternalPackages)
  transpilePackages: ["@prisma/client"],

  // Env vars required for build (Ghost CMS)
  env: {
    GHOST_URL: process.env.GHOST_URL || "",
    GHOST_CONTENT_API_KEY: process.env.GHOST_CONTENT_API_KEY || "",
  },
};

module.exports = withContentlayer(nextConfig);
