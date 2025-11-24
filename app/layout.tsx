import type { Metadata } from 'next'
import localFont from 'next/font/local'
// @ts-ignore
import './globals.css'
import NavigationWrapper from '../components/NavigationWrapper'
import { ThemeProvider } from '../components/ThemeProvider'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { websiteSchema, organizationSchema, faqSchema } from './schema'

const geist = localFont({
  src: '../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.woff2',
  variable: '--font-geist',
  fallback: ['system-ui', 'sans-serif'],
})

const geistMono = localFont({
  src: '../node_modules/geist/dist/fonts/geist-mono/GeistMono-Regular.woff2',
  variable: '--font-geist-mono',
  fallback: ['monospace'],
})

export const metadata: Metadata = {
  title: 'FKbounce - Email Verification',
  description: 'Turn bounces into conversions with professional email verification. Real-time SMTP validation, bulk verification, and disposable email detection. Alternative to ZeroBounce, Hunter.io, Kickbox. Start free with 500 verifications/month.',
  keywords: [
    'email verification',
    'email validator',
    'bulk email verification',
    'email checker',
    'verify email address',
    'email validation tool',
    'email list cleaning',
    'bounce rate reducer',
    'zerobounce alternative',
    'bouncer alternative',
    'kickbox alternative',
    'neverbounce alternative',
    'hunter.io alternative',
    'emailable alternative',
    'debounce alternative',
    'snov.io alternative',
    'mailgun alternative',
    'getnobounce alternative',
    'email verification service',
    'email validation API',
    'SMTP email verification',
    'disposable email detector',
    'email deliverability',
    'email hygiene',
    'email list validator',
    'bulk email checker',
    'csv email verification',
    'real-time email verification',
    'email verification software',
    'email address validation',
    'check email validity',
    'verify email exists',
    'email verification free',
    'cheap email verification',
    'affordable email validator',
    'email bounce checker',
    'reduce email bounces',
    'improve deliverability',
  ],
  authors: [{ name: 'FKbounce' }],
  creator: 'FKbounce',
  publisher: 'FKbounce',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'FKbounce - Turn Bounces Into Conversions',
    description: 'Professional email verification with real-time SMTP validation. Better pricing than ZeroBounce, Hunter, Kickbox. 1M verifications for $15/month. Start free.',
    url: 'https://www.fkbounce.com',
    siteName: 'FKbounce',
    images: [
      {
        url: '/OG.png',
        width: 1200,
        height: 630,
        alt: 'FKbounce - Turn Bounces Into Conversions',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FKbounce - Turn Bounces Into Conversions',
    description: 'Professional email verification. Verify emails instantly. Better pricing than competitors.',
    images: ['/OG.png'],
    creator: '@fkbounce',
  },
  metadataBase: new URL('https://www.fkbounce.com'),
  alternates: {
    canonical: 'https://www.fkbounce.com',
  },
  category: 'Email Marketing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} bg-[#eeeeee] dark:bg-[#0a0a0a] font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NavigationWrapper />
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
