import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Allow eval for lightweight-charts library (needed for chart rendering)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
