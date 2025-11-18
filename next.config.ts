import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        // 외부 이미지 도메인 사용 시 미리 설정해줘야해!
        hostname: 'picsum.photos',
      },
      {
        hostname: 'images.unsplash.com',
      },
      {
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
    ],
  },
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
};

const withMDX = createMDX({
  // 아래에 필요한 마크다운 플러그인 추가
});

export default withMDX(nextConfig);
