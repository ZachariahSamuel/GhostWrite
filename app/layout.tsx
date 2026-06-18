import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'GhostWrite — Invisible craft. Visible results.',
  description: 'GhostWrite transforms AI-generated drafts into authentically human prose — so undetectable, it feels like it was always yours.',
  themeColor: '#0A0A0F',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="mesh-bg min-h-screen bg-vb text-sw antialiased">
        {children}
      </body>
    </html>
  )
}
