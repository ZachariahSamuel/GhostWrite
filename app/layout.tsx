import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'GhostWrite — Invisible craft. Visible results.',
  description: 'Write in your own authentic voice and see exactly how your text reads against AI detectors — with real, DOI-verified citations. Built for students across Southern Africa.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#F4EFE6',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>

      <body className="paper-grain riso-wash min-h-screen bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  )
}
