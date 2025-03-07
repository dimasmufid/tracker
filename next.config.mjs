/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
  experimental: {
    serverComponentsExternalPackages: ["@libsql/client"],
  },
};

export default nextConfig;
