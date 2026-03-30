import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER, PHASE_DEVELOPMENT_SERVER, PHASE_TYPE } from 'next/constants'
console.log('process.env.API_TARGET：', process.env.API_TARGET)
const nextConfig: NextConfig = {
  // output: 'standalone',  // 添加这一行
  /* config options here */
  reactCompiler: true,
  // reactStrictMode: true,
  // cacheComponents: true,
  // generateEtags: true,
  // compress: true,
  images: {
    formats: ['image/avif', 'image/webp'], //默认是 ['image/webp']
    remotePatterns: [
      {
        protocol: 'https', // 协议
        hostname: 'img.daisyui.com', // 主机名
        pathname: '/images/stock/**', // 路径
        port: '', // 端口
      },
    ],
  },
  turbopack: {
    rules: {
      '*.less': {
        loaders: ['less-loader'],
        as: '*.css',
      }
    }
  },
  sassOptions: {
    additionalData: `@use "@/styles/variables.scss" as *;`,
  },

  // 配置跨域代理
  async rewrites() {
    return [
      {
        source: '/prod-api/:path*',
        destination: 'http://localhost:9999/prod-api/:path*',
      },
    ];
  },
};

const nextConfigFn = (phase: PHASE_TYPE): NextConfig => {
  console.log('nextConfigFn args:', phase);
  if (phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER) {
    // 生产环境
  } else if (phase === PHASE_DEVELOPMENT_SERVER) {
    // 开发环境
  }
  return nextConfig
}

export default nextConfigFn;
