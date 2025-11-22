import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import NavigationWrapper from '../components/NavigationWrapper'
import { ThemeProvider } from '../components/ThemeProvider'
import { Analytics } from '@vercel/analytics/react'

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
  title: 'FKbounce',
  description: 'Validate email addresses with comprehensive checks',
  icons: {
    icon: '/favicon-black.png',
    apple: '/favicon-black.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        </ThemeProvider>
      </body>
    </html>
  )
}
