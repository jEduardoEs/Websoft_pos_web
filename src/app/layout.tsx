import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'WebSoft Solutions — Sistema POS',
  description: 'Sistema de facturacion y gestion WebSoft Solutions',
  icons: {
    icon: 'https://websoft-solutions.vercel.app/logo.png',
    apple: 'https://websoft-solutions.vercel.app/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="https://websoft-solutions.vercel.app/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="https://websoft-solutions.vercel.app/logo.png" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
