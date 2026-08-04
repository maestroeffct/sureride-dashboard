import type { NextConfig } from "next";

// Backend origin the dashboard talks to (for connect-src in the CSP).
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim();

// Content-Security-Policy. Note: Next.js / React inline styles and the inline
// style attributes used across this app require 'unsafe-inline' for style-src.
// reCAPTCHA (google.com/gstatic) is allowlisted for script/frame/connect.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
  "frame-src https://www.google.com",
  [
    "connect-src 'self'",
    apiBase,
    "https://www.google.com",
    "https://www.gstatic.com",
  ]
    .filter(Boolean)
    .join(" "),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

// Extra image hosts a buyer can allowlist without touching this file —
// comma-separated hostnames in NEXT_PUBLIC_EXTRA_IMAGE_HOSTS, e.g.
//   NEXT_PUBLIC_EXTRA_IMAGE_HOSTS=cdn.mysite.com,storage.googleapis.com
const extraImageHosts = (process.env.NEXT_PUBLIC_EXTRA_IMAGE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

// Parse the backend origin so its hostname is auto-allowlisted for the
// self-hosted images admins upload directly (uploads/*).
let apiHost: string | null = null;
try {
  if (apiBase) apiHost = new URL(apiBase).hostname;
} catch {}

const nextConfig: NextConfig = {
  images: {
    // remotePatterns wins over the legacy `domains` list. Cover the CDNs
    // this codebase uploads to today, plus the self-hosted backend host,
    // plus anything the buyer opts in via env.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "flagcdn.com", pathname: "/**" },
      { protocol: "https", hostname: "**.amazonaws.com", pathname: "/**" },
      { protocol: "https", hostname: "**.digitaloceanspaces.com", pathname: "/**" },
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/**" },
      ...(apiHost ? [{ protocol: "https" as const, hostname: apiHost, pathname: "/**" }] : []),
      ...extraImageHosts.map((hostname) => ({
        protocol: "https" as const,
        hostname,
        pathname: "/**",
      })),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
