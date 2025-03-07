/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    return config;
  },
  serverExternalPackages: ["@libsql/client"],
  output: "export",
};

export default nextConfig;
