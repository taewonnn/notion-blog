import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        // 외부 이미지 도메인 사용 시 미리 설정해줘야해!
        hostname: 'picsum.photos',
      },
    ],
  },
};

export default nextConfig;
