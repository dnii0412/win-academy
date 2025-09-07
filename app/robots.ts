import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/_next/',
        '/checkout/',
        '/learn/',
        '/dashboard/',
        '/auth-test/',
        '/create-admin/',
      ],
    },
    sitemap: 'https://winacademy.mn/sitemap.xml',
  }
}
