import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Configure webpack to handle native modules
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
