import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://websoftsolutions.com.gt'),
  title: {
    default: 'WebSoft Solutions — Sistema POS',
    template: '%s | WebSoft Solutions',
  },
  description: 'Sistema POS y gestión empresarial para WebSoft Solutions, con ventas, inventario, clientes, cotizaciones, reportes y control de caja.',
  keywords: ['sistema pos', 'facturación', 'inventario', 'ventas', 'WebSoft Solutions', 'Guastatoya'],
  applicationName: 'WebSoft POS',
  alternates: {
    canonical: 'https://websoftsolutions.com.gt',
  },
  openGraph: {
    title: 'WebSoft Solutions — Sistema POS',
    description: 'Plataforma de gestión para ventas, inventario, clientes y reportes.',
    url: 'https://websoftsolutions.com.gt',
    siteName: 'WebSoft Solutions',
    type: 'website',
    images: ['https://websoftsolutions.com.gt/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebSoft Solutions — Sistema POS',
    description: 'Sistema POS y gestión empresarial para WebSoft Solutions.',
    images: ['https://websoftsolutions.com.gt/logo.png'],
  },
  icons: {
    icon: 'https://websoftsolutions.com.gt/logo.png',
    apple: 'https://websoftsolutions.com.gt/logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1581E3',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="https://websoftsolutions.com.gt/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="https://websoftsolutions.com.gt/logo.png" />
      </head>
      <body className="antialiased min-h-screen">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
