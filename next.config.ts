import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // 配置跨域代理
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.API_TARGET + '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
