import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import AuthButton from '../components/AuthButton'
import UpgradeButton from '../components/UpgradeButton'
import AppBreadcrumb from '../components/AppBreadcrumb'
import { ThemeProvider } from '../components/ThemeProvider'

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
          <div className="fixed top-4 left-4 z-50">
            <AppBreadcrumb />
          </div>
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <UpgradeButton />
            <AuthButton />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
