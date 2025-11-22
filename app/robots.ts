import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/payment/'],
      },
    ],
    sitemap: 'https://www.fkbounce.com/sitemap.xml',
  }
}
