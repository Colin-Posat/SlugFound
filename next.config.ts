import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1 MB request body limit. We allow image
    // uploads up to 5 MB on the Create form (matches the Storage bucket cap),
    // so bump the limit to 6 MB to leave a small buffer for form fields.
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },

  // Allow images served from the public Supabase Storage URL on listing cards.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
