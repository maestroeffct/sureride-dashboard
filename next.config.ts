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

const nextConfig: NextConfig = {
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
