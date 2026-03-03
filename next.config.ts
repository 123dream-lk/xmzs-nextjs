import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // 配置跨域代理
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5173/api/:path*',
      },
    ];
  },
};

export default nextConfig;
