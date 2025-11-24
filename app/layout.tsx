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
  title: {
    default: 'FKbounce - Email Verification & Validation Tool | Real-Time SMTP Checker',
    template: '%s | FKbounce - Email Verification'
  },
  description: 'Verify email addresses instantly with FKbounce. Real-time SMTP validation, bulk email verification, disposable email detection. Reduce bounce rates by 95%. Best alternative to ZeroBounce, Hunter.io, Kickbox. Start free with 500 verifications/month.',
  keywords: [
    'email verification',
    'email validator',
    'verify email address',
    'email validation',
    'email checker',
    'bulk email verification',
    'email verification tool',
    'email verification service',
    'email validation API',
    'SMTP email verification',
    'real-time email verification',
    'email bounce checker',
    'verify email exists',
    'check email validity',
    'email address validator',
    'email list cleaning',
    'email list validator',
    'bulk email checker',
    'csv email verification',
    'email verification software',
    'disposable email detector',
    'catch-all email detector',
    'email deliverability',
    'email hygiene',
    'reduce email bounces',
    'improve email deliverability',
    'email bounce rate',
    'email verification free',
    'free email validator',
    'cheap email verification',
    'affordable email validator',
    'zerobounce alternative',
    'hunter.io alternative',
    'kickbox alternative',
    'neverbounce alternative',
    'bouncer alternative',
    'emailable alternative',
    'debounce alternative',
    'snov.io alternative',
    'mailgun validation alternative',
    'clearout alternative',
    'email list verify',
    'verify mailing list',
    'email verification api',
    'smtp validation',
    'mx record check',
    'email syntax check',
    'verify business email',
    'verify gmail address',
    'verify outlook email',
    'email marketing tool',
    'cold email tool',
    'email outreach tool',
  ],
  authors: [{ name: 'FKbounce', url: 'https://www.fkbounce.com' }],
  creator: 'FKbounce',
  publisher: 'FKbounce',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
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
    title: 'FKbounce - Email Verification & Validation Tool | Reduce Bounce Rates by 95%',
    description: 'Professional email verification with real-time SMTP validation. Verify single emails or bulk lists instantly. Better pricing than ZeroBounce, Hunter, Kickbox. 1M verifications for $15/month. Start free with 500 verifications.',
    url: 'https://www.fkbounce.com',
    siteName: 'FKbounce',
    images: [
      {
        url: '/OG.png',
        width: 1200,
        height: 630,
        alt: 'FKbounce - Turn Email Bounces Into Conversions',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FKbounce - Email Verification Tool | Reduce Bounce Rates',
    description: 'Verify email addresses instantly with real-time SMTP validation. Best alternative to ZeroBounce & Hunter.io. Start free.',
    images: ['/OG.png'],
    creator: '@fkbounce',
    site: '@fkbounce',
  },
  metadataBase: new URL('https://www.fkbounce.com'),
  alternates: {
    canonical: 'https://www.fkbounce.com',
  },
  category: 'Email Marketing',
  classification: 'Email Verification Software',
  referrer: 'origin-when-cross-origin',
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
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
      <body className={`${geist.variable} ${geistMono.variable} bg-[#fafafa] dark:bg-[#0a0a0a] font-sans`}>
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
