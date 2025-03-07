/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    return config;
  },
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
