import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  transpilePackages: ["x402-next", "x402-fetch"],
  async rewrites() {
    return [
      {
        source: "/.well-known/x402.json",
        destination: "/api/x402-discovery",
      },
    ];
  },
};
export default nextConfig;
