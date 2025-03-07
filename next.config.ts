import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Configure webpack to handle native modules
  webpack: (config) => {
    return config;
  },
  // Ensure Next.js doesn't try to bundle native modules
  serverExternalPackages: ["@libsql/client"],
  output: "export",
};

export default nextConfig;
