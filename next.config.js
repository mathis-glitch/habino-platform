/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  typescript: {
    // Type errors are caught locally via tsc — don't block Vercel deploys
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// Only wrap with Sentry if auth token is configured (skip in CI without secrets)
if (process.env.SENTRY_AUTH_TOKEN) {
  module.exports = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG ?? "habino",
    project: process.env.SENTRY_PROJECT ?? "habino-platform",
    silent: true,
    widenClientFileUpload: true,
    hideSourceMaps: true,
  });
} else {
  module.exports = nextConfig;
}
