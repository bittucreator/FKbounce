import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FKbounce - Email Verification Tool',
    short_name: 'FKbounce',
    description: 'Professional email verification with real-time SMTP validation. Verify emails instantly and reduce bounce rates.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#171717',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    categories: ['business', 'productivity', 'utilities'],
  }
}
