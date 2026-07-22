import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép IP LAN 192.168.137.1 truy cập Dev Server
  allowedDevOrigins: ["192.168.137.1:3000", "localhost:3000"],
  
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;