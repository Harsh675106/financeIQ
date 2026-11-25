import type { Metadata, Viewport } from 'next'
import { Inter, Sora, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import MotionProvider from '@/components/motion/MotionProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const sora = Sora({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'FinanceIQ',
  description: 'AI-driven financial decision intelligence platform',
}

export const viewport: Viewport = {
  themeColor: '#f7fbfa',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <MotionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </MotionProvider>
      </body>
    </html>
  )
}
