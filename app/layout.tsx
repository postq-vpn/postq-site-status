import type { Metadata, Viewport } from 'next'
import './globals.css'
import '@/design-system/postq.css'
import { RD_THEME_INIT_SCRIPT } from '@/design-system/theme-script'
import RdHeader from '@/components/RdHeader'
import RdFooter from '@/components/RdFooter'

export const metadata: Metadata = {
  metadataBase: new URL('https://status.postq.space'),
  title: 'postq vpn | статус серверов',
  description: 'Мониторинг состояния VPN-серверов postq в реальном времени',
  icons: {
    icon: [
      { url: '/icons/icon.svg?v=2', type: 'image/svg+xml' },
      { url: '/icons/icon-32.png?v=2', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png?v=2',
  },
  openGraph: {
    title: 'postq vpn | статус серверов',
    description: 'Мониторинг состояния VPN-серверов postq в реальном времени',
    url: 'https://status.postq.space',
    siteName: 'postq vpn status',
    locale: 'ru_RU',
    type: 'website',
    images: [{ url: 'https://status.postq.space/og-image.png?v=2', width: 1200, height: 630, alt: 'Статус серверов PostqVPN' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'postq vpn | статус серверов',
    description: 'Мониторинг состояния VPN-серверов postq в реальном времени',
    images: ['https://status.postq.space/og-image.png?v=2'],
  },
}

export const viewport: Viewport = {
  // Page background of each theme (postq.css).
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f8f8' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1c' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/gteestiprodisplay_bold.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/gteestiprodisplay_regular.woff2" as="font" type="font/woff2" crossOrigin="" />
        {/* Sets data-rd-theme on <html> before the first paint, so there is no light→dark flash.
            Same storage key as postq.space, but a different origin: the choice isn't shared. */}
        <script dangerouslySetInnerHTML={{ __html: RD_THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <div id="top" className="rd-page">
          <RdHeader />
          {children}
          <RdFooter />
        </div>
      </body>
    </html>
  )
}
