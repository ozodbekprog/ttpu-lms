import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const cspDirectives = [
  "default-src 'self'",
  // Next.js statik sahifalarda hydration uchun inline skript ishlatadi; nonce
  // faqat dinamik renderda ishlaydi, shu sababli 'unsafe-inline' qoladi.
  // 'unsafe-eval' productionda kerak emas (React/Next ishlatmaydi).
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  isProduction ? "connect-src 'self'" : "connect-src 'self' ws: wss:",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  },
  { key: "Content-Security-Policy", value: cspDirectives },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
