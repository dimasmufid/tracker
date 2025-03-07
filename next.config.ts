import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Configure webpack to handle native modules
  webpack: (config, { isServer }) => {
    // For libsql and other native dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }

    return config;
  },
  // Ensure Next.js doesn't try to bundle native modules
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
