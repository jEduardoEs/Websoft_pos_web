import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'WebSoft Solutions — Sistema POS',
  description: 'Sistema de facturacion y gestion WebSoft Solutions',
  icons: {
    icon: 'https://websoftsolutions.com.gt/logo.png',
    apple: 'https://websoftsolutions.com.gt/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="https://websoftsolutions.com.gt/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="https://websoftsolutions.com.gt/logo.png" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
