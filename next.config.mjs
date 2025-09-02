/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configure for large file uploads
  experimental: {
    serverComponentsExternalPackages: ['tus-js-client'],
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  // Increase body size limit for API routes
  api: {
    bodyParser: {
      sizeLimit: '200mb',
    },
    responseLimit: false,
  },
}

export default nextConfig
