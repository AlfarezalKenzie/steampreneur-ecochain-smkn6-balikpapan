/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy API calls ke backend services di dev (Service A & B).
  // Di produksi, gunakan API Gateway/Nginx — ini hanya kemudahan lokal.
  async rewrites() {
    return [
      { source: "/api/core/:path*", destination: "http://localhost:4001/:path*" },
      { source: "/api/carbon/:path*", destination: "http://localhost:4002/:path*" },
    ];
  },
};

export default nextConfig;
