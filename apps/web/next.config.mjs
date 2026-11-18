/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a minimal self-contained server for the Docker image
  output: 'standalone',
  poweredByHeader: false,
};

export default nextConfig;
