import type { NextConfig } from "next";

const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://*.blob.vercel-storage.com data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://*.blob.vercel-storage.com",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",     value: ContentSecurityPolicy },
          { key: "Strict-Transport-Security",   value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options",             value: "DENY" },
          { key: "X-Content-Type-Options",      value: "nosniff" },
          { key: "Referrer-Policy",             value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",          value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control",      value: "on" },
        ],
      },
      {
        // Prevent browsers from caching authenticated dashboard pages
        source: "/((?!api|_next|favicon\\.ico|.*\\.png$).*)",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
