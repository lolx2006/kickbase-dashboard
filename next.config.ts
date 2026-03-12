import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kickbase.b-cdn.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
