/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Exclude API routes from TypeScript build issues
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
