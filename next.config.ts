import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.kydo.gr' }],
        destination: 'https://kydo.gr/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'kydocare.gr' }],
        destination: 'https://kydo.gr/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.kydocare.gr' }],
        destination: 'https://kydo.gr/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'kydocare.com' }],
        destination: 'https://kydo.gr/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.kydocare.com' }],
        destination: 'https://kydo.gr/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig