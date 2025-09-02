import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
  // Configure external packages that should not be bundled
  serverExternalPackages: ['tus-js-client'],
  // Configure for large file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  // Set output file tracing root to silence lockfile warning
  outputFileTracingRoot: __dirname,
}

export default nextConfig
