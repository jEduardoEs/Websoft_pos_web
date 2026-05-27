import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'WS POS — Sistema de Facturación',
  description: 'Sistema POS profesional web',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
